# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be on GitHub
3. **Supabase Project**: Your Supabase project should be set up

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. **Go to Settings > Environment Variables**
2. **Add these variables**:
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```

## Step 4: Update Supabase Settings

In your Supabase dashboard:

1. **Go to Authentication > URL Configuration**
2. **Add your Vercel domain to "Redirect URLs"**:
   ```
   https://your-project.vercel.app/auth/callback
   ```
3. **Add your Vercel domain to "Site URL"**:
   ```
   https://your-project.vercel.app
   ```

## Step 5: Deploy

1. **Click "Deploy"** in Vercel
2. **Wait for build to complete**
3. **Your site will be live at**: `https://your-project.vercel.app`

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally

### Environment Variables
- Make sure Supabase URL and key are correct
- Check that variables are prefixed with `VITE_`

### Authentication Issues
- Verify Supabase redirect URLs include your Vercel domain
- Check that environment variables are set correctly

## Custom Domain (Optional)

1. **Go to Vercel Dashboard > Domains**
2. **Add your custom domain**
3. **Update Supabase redirect URLs** with your custom domain
4. **Configure DNS** as instructed by Vercel

## Automatic Deployments

- Every push to `main` branch will trigger a new deployment
- Preview deployments are created for pull requests
- You can configure branch protection rules in GitHub

## Performance Tips

- Enable Vercel Analytics
- Use Vercel Edge Functions for API routes
- Optimize images with Vercel Image Optimization
- Enable caching headers for static assets 