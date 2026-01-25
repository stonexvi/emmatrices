import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export default function Matrix({ 
  matrixId, 
  xLabel, 
  yLabel, 
  userName,
  userInitials,
  userColor,
  isReadOnly = false,
  onMarkPlaced 
}) {
  const [marks, setMarks] = useState([]);
  const [userMark, setUserMark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverPosition, setHoverPosition] = useState(null);
  const canvasRef = useRef(null);

  // Parse axis labels (format: "Left Label / Right Label")
  const [xLabelLeft, xLabelRight] = xLabel.split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = yLabel.split('/').map(s => s.trim());

  useEffect(() => {
    loadMarks();
  }, [matrixId]);

  const loadMarks = async () => {
    try {
      setLoading(true);
      const response = await api.getMarks(matrixId);
      if (response.ok) {
        const data = await response.json();
        setMarks(data.marks || []);
        
        const existingMark = data.marks.find(m => m.userName === userName);
        if (existingMark) {
          setUserMark(existingMark);
        }
      }
    } catch (error) {
      console.error('Error loading marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = async (e) => {
    if (isReadOnly || !userName) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert to coordinate system: -50 to +50 on both axes
    const x = ((clickX / rect.width) - 0.5) * 100;
    const y = ((0.5 - (clickY / rect.height)) * 100);
    
    // Clamp to valid range
    const clampedX = Math.max(-50, Math.min(50, x));
    const clampedY = Math.max(-50, Math.min(50, y));

    const newMark = { 
      userName,
      userInitials,
      userColor,
      x: Math.round(clampedX * 10) / 10,
      y: Math.round(clampedY * 10) / 10 
    };
    
    try {
      const response = await api.addMark(matrixId, newMark);

      if (response.ok) {
        setUserMark(newMark);
        setMarks(prev => {
          const filtered = prev.filter(m => m.userName !== userName);
          return [...filtered, newMark];
        });
        
        if (onMarkPlaced) {
          onMarkPlaced(matrixId, newMark);
        }
      }
    } catch (error) {
      console.error('Error placing mark:', error);
    }
  };

  const handleMouseMove = (e) => {
    if (isReadOnly) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setHoverPosition({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  // Convert coordinate (-50 to +50) to pixel position (0 to 100%)
  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading matrix...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Top Y-axis label */}
      <div className="mb-3 text-sm font-semibold text-gray-700">
        {yLabelTop}
      </div>

      {/* Main coordinate system container */}
      <div className="flex items-center w-full gap-2 sm:gap-4">
        {/* Left X-axis label */}
        <div className="w-12 m:w-16 sm:w-24 text-xs sm:text-sm font-semibold text-gray-700 text-right">
          {xLabelLeft}
        </div>
        
        {/* Canvas/coordinate system - RESPONSIVE BUT CONSISTENT */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative bg-white rounded-lg shadow-lg w-full"
            style={{ 
              aspectRatio: '1 / 1',
              width: '100%', 
              maxWidth: 'min(600px, 90vw)',
              margin: '0 auto',
            }}
          >
            {/* Axes - crossing at center */}
            {/* Horizontal axis (X) */}
            <div 
              className="absolute left-0 w-full bg-gray-400"
              style={{ 
                height: '2px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            {/* Vertical axis (Y) */}
            <div 
              className="absolute top-0 h-full bg-gray-400"
              style={{ 
                width: '2px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />

            {/* Hover cursor - translucent grey X */}
            {hoverPosition && !isReadOnly && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${hoverPosition.x}px`,
                  top: `${hoverPosition.y}px`,
                }}
              >
                {/* Center the X on the cursor position */}
                <svg width="20" height="20" className="opacity-30" style={{ transform: 'translate(-50%, -50%)' }}>
                  <line x1="2" y1="2" x2="18" y2="18" stroke="#6b7280" strokeWidth="2" />
                  <line x1="18" y1="2" x2="2" y2="18" stroke="#6b7280" strokeWidth="2" />
                </svg>
              </div>
            )}

            {/* Marks */}
            {marks.map((mark, index) => {
              const isUserMark = mark.userName === userName;
              const color = mark.userColor || userColor;
              const initials = mark.userInitials || userInitials;
              
              return (
                <div
                  key={`${mark.userName}-${index}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${coordToPercent(mark.x)}%`,
                    top: `${coordToPercent(-mark.y)}%`,
                  }}
                  title={mark.userName}
                >
                  {/* X symbol - centered on the exact coordinate */}
                  <div style={{ transform: 'translate(-50%, -50%)' }}>
                    <svg width="20" height="20">
                      <line x1="2" y1="2" x2="18" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
                      <line x1="18" y1="2" x2="2" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    {/* Initials below the X */}
                    <div 
                      className="text-xs font-bold text-center"
                      style={{ 
                        color: color,
                        marginTop: '-2px'
                      }}
                    >
                      {initials}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right X-axis label */}
        <div className="w-12 m:w-16 sm:w-24 text-xs sm:text-sm font-semibold text-gray-700 text-left">
          {xLabelRight}
        </div>
      </div>

      {/* Bottom Y-axis label */}
      <div className="mt-3 text-sm font-semibold text-gray-700">
        {yLabelBottom}
      </div>

      {/* Legend */}
      <div className="mt-6 text-sm text-gray-600 text-center">
        {userMark ? (
          <span>Click anywhere to move your mark</span>
        ) : (
          <span>{marks.length} {marks.length === 1 ? 'person has' : 'people have'} marked this matrix</span>
        )}
      </div>
    </div>
  );
}
