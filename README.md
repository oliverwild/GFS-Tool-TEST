# GitHub Pages Setup Guide for GFS Tools

This guide will walk you through setting up a GitHub Pages website for your GFS Tools project.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- Basic knowledge of HTML, CSS, and JavaScript (optional but helpful)

## Step 1: Create a New Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository: `yourusername.github.io` (replace `yourusername` with your actual GitHub username)
4. Make it public
5. Check "Add a README file"
6. Click "Create repository"

## Step 2: Clone the Repository

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

## Step 3: Create Your Website Files

### Option A: Basic HTML/CSS/JS Website
Create the following files in your repository:

- `index.html` - Main page
- `styles.css` - Styling
- `script.js` - JavaScript functionality
- `README.md` - This file

### Option B: Use Jekyll (GitHub Pages Default)
1. Create a `_config.yml` file
2. Use Markdown files in a `_posts` folder
3. Create layouts in a `_layouts` folder

## Step 4: Push Your Changes

```bash
git add .
git commit -m "Initial website setup"
git push origin main
```

## Step 5: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

## Step 6: Wait for Deployment

- GitHub Pages will automatically build and deploy your site
- This usually takes 1-5 minutes
- Your site will be available at `https://yourusername.github.io`

## Step 7: Custom Domain (Optional)

1. In the Pages settings, enter your custom domain
2. Add a CNAME record in your DNS provider pointing to `yourusername.github.io`
3. Wait for DNS propagation (up to 24 hours)

## File Structure

```
yourusername.github.io/
├── index.html          # Main page
├── styles.css          # Styling
├── script.js           # JavaScript
├── README.md           # This guide
└── assets/             # Images, fonts, etc.
    └── images/
```

## Troubleshooting

### Common Issues:

1. **Site not updating**: Check if you're on the correct branch and wait for deployment
2. **404 errors**: Ensure your main file is named `index.html`
3. **Styling not working**: Check file paths and CSS syntax
4. **Build errors**: Check the Actions tab for build logs

### Build Status:

- Check the "Actions" tab in your repository to see build status
- Green checkmark = successful build
- Red X = build failed (check logs for errors)

## Next Steps

- Customize your website design
- Add more pages and content
- Integrate with your GFS Tools
- Add analytics and SEO optimization

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/)
- [HTML/CSS Tutorials](https://developer.mozilla.org/en-US/docs/Web/Tutorials)

## Support

If you encounter issues:
1. Check the GitHub Pages documentation
2. Search existing GitHub issues
3. Create a new issue in your repository
4. Check the Actions tab for build errors
