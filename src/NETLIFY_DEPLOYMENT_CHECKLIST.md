# Netlify Deployment Checklist for GACE

## Pre-Deployment Checklist

### ✅ 1. Environment Variables
Ensure these are set in Netlify (Site settings → Environment variables):

#### Required Variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the Project URL and anon/public key

### ✅ 2. Supabase Edge Functions
Your Edge Functions are deployed separately to Supabase, not Netlify.

**Verify they're deployed:**
```bash
# Check if server function is live
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-b5fd51b8/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

### ✅ 3. Build Settings
**Netlify should auto-detect these, but verify:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18 or higher

## Deployment Steps

### Option A: Deploy via Netlify CLI (Recommended)

```bash
# 1. Install Netlify CLI if not already installed
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Initialize site (first time only)
netlify init

# 4. Deploy to production
netlify deploy --prod

# Follow prompts:
# - Choose existing site or create new
# - Publish directory: dist
# - Build command: npm run build
```

### Option B: Deploy via Git Push

```bash
# 1. Commit all changes
git add .
git commit -m "feat: add presentation enhancements and demo data"

# 2. Push to GitHub
git push origin main

# Netlify will auto-deploy if connected to GitHub
```

### Option C: Deploy via Netlify UI

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables
7. Click "Deploy site"

## Post-Deployment Verification

### 1. Check Build Logs
```
✅ Build should complete without errors
✅ Look for "Site is live" message
✅ Note the deployed URL
```

### 2. Test Critical Flows

Visit your deployed site and test:

```
✅ Landing page loads
✅ Sign up works (create test account)
✅ Login works
✅ Dashboard displays correctly
✅ Assets can be added/viewed
✅ Documents can be uploaded
✅ Tax calculator works
✅ No console errors
```

### 3. Test Demo Data

```bash
# Seed demo data on production
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-b5fd51b8/demo/seed \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Then login with:
# Email: demo.expat@gace.demo
# Password: Demo123!
```

### 4. Test Product Tour
- Login to dashboard
- Click "Take Tour" button
- Verify tour works correctly
- Complete all steps

## Common Issues & Fixes

### Issue 1: Build Fails - "Cannot find module"
**Fix:**
```bash
# Ensure all dependencies are in package.json, not devDependencies
# For production builds, move these to dependencies if needed:
npm install --save-prod react-router-dom recharts motion lucide-react
```

### Issue 2: Environment Variables Not Working
**Fix:**
- Environment variables in Netlify must start with `VITE_` for Vite projects
- After adding variables, redeploy: `netlify deploy --prod`
- Clear build cache in Netlify UI: Site settings → Build & deploy → Clear cache and retry deploy

### Issue 3: 404 on Routes
**Fix:** Create `netlify.toml` (already exists, but verify):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Issue 4: API Calls Fail
**Fix:**
- Check browser console for CORS errors
- Verify Supabase Edge Functions are deployed
- Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Test Edge Function directly: `curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-b5fd51b8/health`

### Issue 5: Assets/Images Not Loading
**Fix:**
- Ensure all imports use correct paths
- Check that `figma:asset` imports are working
- Verify public folder assets are in `/public` directory

## Environment Variable Setup

### Add to Netlify:
1. Go to Site settings → Environment variables
2. Click "Add a variable"
3. Add each variable:

```
Key: VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co

Key: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Click "Save"
5. Redeploy site

## Performance Optimization (Post-Deploy)

### Enable Performance Features in Netlify:

1. **Asset Optimization**
   - Site settings → Build & deploy → Post processing
   - Enable: Bundle CSS, Minify CSS, Minify JS
   - Enable: Image optimization

2. **Edge Functions (if using Netlify Edge)**
   - Currently using Supabase Edge Functions (no change needed)

3. **Custom Headers** (optional)
   ```toml
   # Add to netlify.toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

## Demo Data Setup on Production

### After Deployment:

```bash
# 1. Seed demo data
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-b5fd51b8/demo/seed \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 2. Verify demo accounts exist
# Login with: demo.expat@gace.demo / Demo123!

# 3. Take a tour
# Click "Take Tour" button on dashboard

# 4. (Optional) Clear demo data after presentation
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-b5fd51b8/demo/clear \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring & Analytics

### Recommended Setup:

1. **Netlify Analytics** (optional, paid)
   - Site settings → Analytics
   - Enable for visitor insights

2. **Real User Monitoring**
   - Monitor page load times
   - Track Core Web Vitals

3. **Error Tracking** (recommended)
   - Consider adding Sentry for production error tracking
   - Already have error boundaries in place

## Final Pre-Presentation Checks

### 24 Hours Before Demo:

- [ ] Site is deployed and accessible
- [ ] All environment variables are set
- [ ] Demo data is seeded
- [ ] Test all 6 demo accounts login successfully
- [ ] Product tour works end-to-end
- [ ] No console errors on any page
- [ ] Mobile responsiveness tested
- [ ] All API endpoints responding
- [ ] Asset uploads working
- [ ] Tax calculator functioning
- [ ] Documents uploading successfully

### Backup Plan:

- [ ] Keep local dev environment running as backup
- [ ] Have demo credentials written down
- [ ] Screenshots/screen recording of key features
- [ ] PDF export of key metrics/calculations

## Quick Commands Reference

```bash
# Deploy to production
netlify deploy --prod

# Check deployment status
netlify status

# Open site in browser
netlify open:site

# View build logs
netlify watch

# Test environment variables locally
netlify dev

# Rollback to previous deploy (if needed)
# Go to Netlify UI → Deploys → Select previous deploy → Publish

# Clear cache and redeploy
netlify build --clear-cache && netlify deploy --prod
```

## Support Links

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- GACE Support: Your team contact

## Success Criteria

✅ Build completes without errors
✅ Site loads on provided URL
✅ Login/Signup works
✅ Demo accounts accessible
✅ Product tour functional
✅ All features working
✅ No console errors
✅ Mobile responsive

---

## 🚀 Ready to Deploy!

Once everything is verified, your GACE application will be live and ready for Innovator Founder endorsement presentations!

**Deployed URL will be:** `https://your-site-name.netlify.app`

Good luck with your presentation! 🎯
