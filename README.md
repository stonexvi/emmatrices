# Matrix Gift - 30 Matrices for 30th Birthday 🎉

An interactive web application where family and friends can place their marks on 30 different personality/preference matrices as a unique 30th birthday gift.

## Features

- 30 unique 2D matrices covering different personality traits and preferences
- Interactive grid where users can place their mark by clicking
- See where others have placed their marks
- Track progress across all 30 matrices
- Mobile-friendly design
- Persistent storage using AWS backend (DynamoDB)

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app!

## Deployment to GitHub Pages

1. Update `vite.config.js` - change the `base` to match your repo name:
   ```javascript
   base: '/your-repo-name/',
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Enable GitHub Pages in your repo settings (Settings → Pages → Source: gh-pages branch)

Your app will be live at: `https://your-username.github.io/your-repo-name/`

## AWS Backend Setup (Optional)

The app works with mock data by default. To connect to AWS:

1. Create DynamoDB tables (see below)
2. Create Lambda functions + API Gateway
3. Update `.env` with your API URL
4. Set `VITE_USE_MOCK_DATA=false`

### DynamoDB Tables

**MatrixMarks**
- Partition key: `matrixId` (Number)
- Sort key: `userName` (String)

**UserProgress**
- Partition key: `userName` (String)

See full AWS setup instructions in the docs.

## Project Structure

```
src/
├── components/
│   └── Matrix.jsx          # Interactive matrix grid
├── data/
│   └── matrices.js         # 30 matrix definitions
├── utils/
│   └── api.js              # Backend API calls
└── App.jsx                 # Main app
```

## Tech Stack

- React + Vite
- Tailwind CSS  
- AWS Lambda + DynamoDB (optional)
- GitHub Pages

---

Made with ❤️ for an amazing 30th birthday!
