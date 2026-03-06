# Mochibazaar Wholesale Portal - Deployment Guide

## Critical: Resolving Step 1 & Step 3 Errors
Firebase App Hosting requires a clean Git environment and a deterministic lockfile. 

### 1. Reset Your Local Environment
Run these commands in your terminal to ensure no local artifacts (like `.next` or `node_modules`) are tracked by Git:
```bash
# Delete existing Git history and artifacts
rm -rf .git .next node_modules package-lock.json

# Initialize a clean repository
git init
git add .
git commit -m "Initial commit with strict .gitignore"
```

### 2. Connect to Your Repository
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
```

### 3. Generate a Fresh Lockfile (REQUIRED)
The Firebase builder **will fail** without a `package-lock.json`.
```bash
npm install
git add package-lock.json
git commit -m "Add fresh lockfile"
git push -u origin main
```

## Admin Terminal Credentials
- **Username**: `Pradoventures`
- **Password**: `Sanju@123`

## Architecture
- **Framework**: Next.js 15 (Standalone Mode)
- **Database**: Firebase Firestore
- **Deployment**: Firebase App Hosting (Docker-based)
