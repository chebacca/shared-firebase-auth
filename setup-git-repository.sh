#!/bin/bash

# Setup script for initializing Shared Firebase Auth as a standalone Git repository
# This script prepares the repository for GitHub

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔧 Setting up Shared Firebase Auth Git Repository"
echo "=================================================="
echo ""

# Check if already a git repository
if [ -d ".git" ]; then
    echo "⚠️  Git repository already exists"
    echo "   Current remote configuration:"
    git remote -v 2>/dev/null || echo "   No remotes configured"
    echo ""
    read -p "Do you want to reinitialize? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Repository setup cancelled."
        exit 0
    fi
    echo "🗑️  Removing existing .git directory..."
    rm -rf .git
fi

# Initialize git repository
echo "📦 Initializing Git repository..."
git init

# Set default branch to main
echo "🌿 Setting default branch to 'main'..."
git branch -M main

# Create initial commit
echo "📝 Creating initial commit..."
git add .

# Check if there are files to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit. Repository is ready."
else
    git commit -m "Initial commit: Shared Firebase Auth v1.0

- Unified authentication library for Backbone ecosystem
- Firebase Authentication integration
- React Context and hooks
- TypeScript with shared types
- Permission and hierarchy system
- Organization-based multi-tenant support"
    echo "✅ Initial commit created"
fi

echo ""
echo "=================================================="
echo "✅ Git repository initialized successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: shared-firebase-auth"
echo "   - Description: Shared authentication library for the BACKBONE ecosystem"
echo "   - Visibility: Private (recommended) or Public"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo ""
echo "2. Add the remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/shared-firebase-auth.git"
echo "   git push -u origin main"
echo ""
echo "3. Or if using SSH:"
echo "   git remote add origin git@github.com:YOUR_USERNAME/shared-firebase-auth.git"
echo "   git push -u origin main"
echo ""
echo "=================================================="

