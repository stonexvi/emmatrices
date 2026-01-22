// API configuration - update these with your AWS API Gateway endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url.amazonaws.com/prod';

// Mock data for local development
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

// Mock storage for development
let mockMarks = {};
let mockUserProgress = {};

export const api = {
  // Get all marks for a specific matrix
  async getMarks(matrixId) {
    if (USE_MOCK_DATA) {
      return {
        ok: true,
        json: async () => ({
          marks: mockMarks[matrixId] || []
        })
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/matrices/${matrixId}/marks`);
      return response;
    } catch (error) {
      console.error('Error fetching marks:', error);
      throw error;
    }
  },

  // Add or update a mark for a user on a matrix
  async addMark(matrixId, mark) {
    if (USE_MOCK_DATA) {
      if (!mockMarks[matrixId]) {
        mockMarks[matrixId] = [];
      }
      
      // Remove existing mark from this user
      mockMarks[matrixId] = mockMarks[matrixId].filter(
        m => m.userName !== mark.userName
      );
      
      // Add new mark (includes userName, userInitials, userColor, x, y)
      mockMarks[matrixId].push(mark);
      
      return {
        ok: true,
        json: async () => ({ success: true, mark })
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/matrices/${matrixId}/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mark)
      });
      return response;
    } catch (error) {
      console.error('Error adding mark:', error);
      throw error;
    }
  },

  // Get user's progress (which matrices they've completed)
  async getUserProgress(userName) {
    if (USE_MOCK_DATA) {
      return {
        ok: true,
        json: async () => ({
          completedMatrices: mockUserProgress[userName] || []
        })
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userName}/progress`);
      return response;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // Update user's progress
  async updateUserProgress(userName, matrixId) {
    if (USE_MOCK_DATA) {
      if (!mockUserProgress[userName]) {
        mockUserProgress[userName] = [];
      }
      
      if (!mockUserProgress[userName].includes(matrixId)) {
        mockUserProgress[userName].push(matrixId);
      }
      
      return {
        ok: true,
        json: async () => ({ success: true })
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userName}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matrixId })
      });
      return response;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }
};

// DynamoDB Table Structure Reference:
// 
// Table: MatrixMarks
// - PK: matrixId (Number)
// - SK: userName (String)
// - userInitials: String (2-3 characters)
// - userColor: String (hex color code)
// - x: Number (-50 to 50)
// - y: Number (-50 to 50)
// - timestamp: Number
//
// Table: UserProgress
// - PK: userName (String)
// - completedMatrices: NumberSet
