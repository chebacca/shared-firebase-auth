# GitHub Repository Setup Guide

This guide will help you set up the Shared Firebase Auth library as a standalone GitHub repository, following the same patterns used in other BACKBONE applications.

## Prerequisites

- Git installed and configured
- GitHub account
- Access to Firebase project (backbone-logic)

## Step 1: Initialize Git Repository

Run the setup script to initialize the repository:

```bash
cd shared-firebase-auth
./setup-git-repository.sh
```

This script will:
- Initialize a new Git repository
- Set the default branch to `main`
- Create an initial commit with all current files

## Step 2: Create GitHub Repository

1. Go to [GitHub New Repository](https://github.com/new)
2. Repository settings:
   - **Name**: `shared-firebase-auth`
   - **Description**: `Shared authentication library for the BACKBONE ecosystem`
   - **Visibility**: Private (recommended) or Public
   - **Important**: Do NOT initialize with:
     - ❌ README
     - ❌ .gitignore
     - ❌ license

3. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

After creating the repository on GitHub, connect your local repository:

### Option A: HTTPS (Recommended for beginners)

```bash
git remote add origin https://github.com/YOUR_USERNAME/shared-firebase-auth.git
git branch -M main
git push -u origin main
```

### Option B: SSH (Recommended for advanced users)

```bash
git remote add origin git@github.com:YOUR_USERNAME/shared-firebase-auth.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 4: Repository Structure

Your repository should have the following structure:

```
shared-firebase-auth/
├── src/
│   ├── index.ts                    # Main exports
│   ├── UnifiedFirebaseAuth.ts      # Core authentication service
│   ├── UnifiedAuthContext.tsx      # React context and provider
│   └── useUnifiedAuth.ts           # React hook
├── .gitignore                      # Git ignore patterns
├── package.json                    # Package configuration
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Project documentation
├── setup-git-repository.sh         # Repository setup script
└── GITHUB_SETUP.md                 # This file
```

## Common Commands

### Daily Development

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

### Branch Management

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main

# Merge branch
git checkout main
git merge feature/your-feature-name
```

## Troubleshooting

### Issue: "Repository not found"
- Verify the remote URL: `git remote -v`
- Check that you have access to the repository
- Ensure the repository name matches exactly

### Issue: "Authentication failed"
- For HTTPS: Use a Personal Access Token instead of password
- For SSH: Ensure your SSH key is added to GitHub
- See: [GitHub Authentication Guide](https://docs.github.com/en/authentication)

## Repository Best Practices

1. **Commit Messages**: Use clear, descriptive commit messages
   ```
   ✅ Good: "Add organization-based permission checks"
   ❌ Bad: "fix stuff"
   ```

2. **Branch Naming**: Use descriptive branch names
   ```
   ✅ Good: feature/auth-context, fix/login-bug
   ❌ Bad: test, new-feature
   ```

3. **Pull Requests**: Create PRs for significant changes
   - Allows code review
   - Maintains code quality
   - Documents changes

4. **Security**: Never commit secrets
   - Verify `.gitignore` includes all sensitive files
   - Review files before committing
   - No Firebase service account files

## Additional Resources

- [GitHub Documentation](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Git logs: `git log --oneline`
3. Consult the main BACKBONE project documentation
4. Contact the development team

---

**Last Updated**: January 2025  
**Repository Pattern**: Based on BACKBONE v14.2 unified project structure

