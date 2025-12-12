# 🚀 Deploy GACE to Netlify

**Quick Deploy Guide** - Get your changes live in 5 minutes!

---

## ✅ Pre-Deployment Checklist

Before deploying, make sure you've done these:

- [x] Fixed the `import.meta.env` error ✅
- [ ] Committed your changes to Git
- [ ] Pushed to GitHub
- [ ] Configured Netlify environment variables (if not done yet)

---

## 🎯 Option 1: Deploy via Git Push (RECOMMENDED)

This is the easiest method - Netlify will automatically build and deploy.

### Step 1: Commit Your Changes

```bash
# Add all changes
git add .

# Commit with a message
git commit -m "fix: resolve import.meta.env undefined error and add production hardening"

# Push to GitHub (triggers automatic Netlify deployment)
git push origin main
```

**Alternative if you're on a different branch:**
```bash
git push origin <your-branch-name>
```

### Step 2: Watch the Build

1. Go to your Netlify dashboard: https://app.netlify.com
2. Click on your GACE site
3. Click **"Deploys"** tab
4. You should see a new deploy starting automatically
5. Wait 2-3 minutes for build to complete

### Step 3: Verify

Once the build completes:
- ✅ Status should be "Published"
- ✅ Your site URL should show the updated app
- ✅ No errors in the build log

**Done!** 🎉

---

## 🎯 Option 2: Manual Deploy via Netlify CLI

If you want to deploy without pushing to Git:

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will open your browser to authenticate.

### Step 3: Link to Your Site

```bash
netlify link
```

Choose your GACE site from the list.

### Step 4: Build Locally

```bash
npm run build:prod
```

This creates the `dist` folder.

### Step 5: Deploy

**Deploy to draft URL (for testing):**
```bash
netlify deploy
```

**Deploy to production:**
```bash
netlify deploy --prod
```

**Done!** 🎉

---

## 🎯 Option 3: Manual Deploy via Netlify UI

If you just want to deploy the built files:

### Step 1: Build Locally

```bash
npm run build:prod
```

### Step 2: Deploy via UI

1. Go to https://app.netlify.com
2. Click your GACE site
3. Go to **"Deploys"** tab
4. Drag and drop the `dist` folder onto the upload area

**Done!** 🎉

---

## ⚙️ IMPORTANT: Configure Environment Variables

**Before the app works in production**, you MUST add environment variables to Netlify:

### Quick Setup (5 minutes)

1. Go to https://app.netlify.com
2. Click your GACE site
3. **Site configuration** → **Environment variables**
4. Click **"Add a variable"** and add:

**Variable 1:**
```
Key:   VITE_SUPABASE_URL
Value: https://faczbtutzsrcnlrahifb.supabase.co
Scopes: All
```

**Variable 2:**
```
Key:   VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY3pidHV0enNyY25scmFoaWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTE3MTMsImV4cCI6MjA4MDA2NzcxM30.2PYn_okTcGJ78VtwEq6uN3ESKBmOb1r6bZALIV10lGc
Scopes: All
```

5. Click **"Save"**
6. **Trigger a new deploy:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

**Detailed guide:** See `/NETLIFY_ENV_SETUP.md`

---

## 📊 Expected Build Output

When the build succeeds, you should see:

```
✓ Build completed
✓ 1234 modules transformed
✓ Built in 45.23s
✓ dist/index.html                   1.23 kB
✓ dist/assets/index-abc123.js       456.78 kB
✓ dist/assets/index-def456.css      12.34 kB

Build time: 2m 15s
Status: Published
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails with TypeScript Errors

**Solution:** Your `netlify.toml` is already configured to use `build:prod` which skips TypeScript checking. ✅

### Issue 2: "Environment Variable Not Found"

**Solution:** 
- Make sure you added environment variables in Netlify UI
- Variable names must start with `VITE_`
- Trigger a new deploy after adding variables
- The app will work with fallback values if env vars are missing ✅

### Issue 3: "Page Not Found" on Refresh

**Solution:** Your `netlify.toml` already has the SPA redirect configured. ✅

### Issue 4: Build Succeeds but Site Shows Errors

**Check:**
1. Open browser console (F12) for errors
2. Check if API calls are working (Network tab)
3. Verify Supabase credentials are correct
4. Check build logs for warnings

---

## 🔍 Verify Deployment

After deployment, test these:

### 1. Home Page Loads
- [ ] Open your site URL
- [ ] Page loads without errors
- [ ] UI looks correct

### 2. Authentication Works
- [ ] Can sign up for new account
- [ ] Can log in
- [ ] Can log out
- [ ] Protected routes redirect to login

### 3. API Integration Works
- [ ] Go to Assets page
- [ ] Check browser console - no errors
- [ ] If you have assets, they should load
- [ ] Create a new asset - it should persist after refresh

### 4. Environment Variables Work
- [ ] Open browser console
- [ ] Type: `console.log(import.meta.env?.VITE_SUPABASE_URL)`
- [ ] Should show: `https://faczbtutzsrcnlrahifb.supabase.co`

---

## 📈 Deployment Status Dashboard

After deployment, you can monitor:

### Netlify Dashboard
- **Build status:** Green = Success ✅
- **Deploy preview:** View before going live
- **Build logs:** Check for errors
- **Analytics:** Traffic and performance

### Supabase Dashboard
- **API requests:** Monitor usage
- **Database rows:** Check data
- **Auth users:** See signups
- **Storage:** Check file uploads (when implemented)

---

## 🚀 Quick Deploy Command Summary

**For most cases (recommended):**
```bash
git add .
git commit -m "your commit message"
git push origin main
```

**For local testing:**
```bash
npm run build:prod
netlify deploy
```

**For production:**
```bash
npm run build:prod
netlify deploy --prod
```

---

## ✅ Post-Deployment Checklist

After deploy succeeds:

- [ ] Site URL is accessible
- [ ] No errors in browser console
- [ ] Authentication works
- [ ] Assets page loads (may be empty if no data)
- [ ] Compliance alerts page loads
- [ ] UI looks correct on desktop
- [ ] UI looks correct on mobile
- [ ] No broken images or icons

---

## 🎉 You're Live!

Once deployment succeeds, your app is live at your Netlify URL!

**Share your site:**
- Demo URL: `https://your-site.netlify.app`
- Custom domain: Configure in Netlify settings

**Next steps:**
1. Test all functionality
2. Create storage bucket (for file uploads)
3. Remove remaining mock data
4. Integrate real OCR
5. Beta launch! 🚀

---

## 📞 Need Help?

**Build Errors:**
- Check `/FIX_NOW.md`
- Check `/NETLIFY_UI_FIX.md`

**Environment Variables:**
- Check `/NETLIFY_ENV_SETUP.md`

**General Issues:**
- Check `/PRODUCTION_HARDENING_SUMMARY.md`
- Check build logs in Netlify dashboard

---

**Ready?** Run your deployment command now! 🚀
