# Deployment Guide - Matrix Gift

## Quick Deploy to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to GitHub and create a new repository (e.g., `matrix-birthday-gift`)
2. **Important**: Note your repository name - you'll need it in Step 2

### Step 2: Update Configuration

Edit `vite.config.js` and change this line:
```javascript
base: '/matrix-gift/',  // Change to '/your-repo-name/'
```

For example, if your repo is `birthday-matrices`:
```javascript
base: '/birthday-matrices/',
```

### Step 3: Initialize and Deploy

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to main branch
git push -u origin main

# Deploy to GitHub Pages
npm run deploy
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select branch: `gh-pages`
4. Click **Save**

Wait 1-2 minutes, then visit:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## Sharing with Family

### Option 1: Share the Link Directly
Send the GitHub Pages URL to all family members with instructions:
1. Enter your name
2. Click on each matrix and place your mark
3. Navigate through all 30 matrices

### Option 2: Create Individual Access Codes
You could modify the app to require an access code to prevent random people from filling it out.

## Collecting Data for the Poster

### Without Backend (Mock Data)
The marks will only be stored locally in each person's browser. To create the final poster, you'll need to:
1. Have each person send you a screenshot of their completed matrices
2. Manually compile them

### With Backend (AWS)
All marks are stored in DynamoDB. You can:
1. Query the database to get all marks
2. Generate visualizations programmatically
3. Create a poster with all 30 matrices showing everyone's marks

## Timeline for Your Gift

**Before Sunday (Jan 19):**
1. Deploy the app to GitHub Pages
2. Test it yourself
3. Prepare the gift reveal materials

**Gift Reveal in Florida:**
- Show her the website on your phone
- Explain the concept
- Tell her family members are already filling it out
- Show her a few matrices with marks already placed

**Post-Birthday:**
- Send the link to remaining family members
- Give them 1-2 weeks to complete
- Generate the final poster
- Ship the physical poster to her

## Tips

- The app works on mobile, so everyone can fill it out from their phones
- Encourage people to take their time - it's thoughtful to think about each matrix
- Consider setting a deadline (e.g., "Please complete by Feb 5")
- The 30 matrices are themed around personality traits, preferences, and habits

## Troubleshooting

**Build fails:**
```bash
npm install
npm run build
```

**Deploy fails:**
```bash
# Make sure you're on the main branch
git checkout main

# Try deploying again
npm run deploy
```

**Can't access the site:**
- Wait 2-3 minutes after deployment
- Check GitHub Pages settings
- Make sure base path in vite.config.js matches your repo name

## Next Steps

After the basic app is working, you might want to:
1. Set up AWS backend for persistent storage
2. Add authentication/access codes
3. Create a poster generation script
4. Add ability to view all completed matrices
5. Add admin panel to see who hasn't completed yet
