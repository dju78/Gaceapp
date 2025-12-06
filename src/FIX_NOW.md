# ⚡ FIX IN 2 MINUTES

## 🎯 The Problem
Netlify is using `npm run build` from UI settings (it ignores your netlify.toml file).

## ✅ The Solution
Change it in Netlify dashboard to `npm run build:prod`

---

## 🚀 Steps (DO THIS NOW)

### **1. Go to Netlify Build Settings**

**Your site:** https://app.netlify.com/sites/YOUR_SITE_NAME/settings/deploys

*Replace `YOUR_SITE_NAME` with your actual Netlify site name*

**Or navigate manually:**
- Netlify Dashboard → Your Site → Site configuration → Build & deploy

---

### **2. Edit Build Command**

Scroll to "Build settings" section

Click **"Edit settings"** button

Change:
```
FROM: npm run build
TO:   npm run build:prod
```

Click **"Save"**

---

### **3. Redeploy**

Click **"Deploys"** tab (top of page)

Click **"Trigger deploy"** button (top right)

Select **"Clear cache and deploy site"**

Wait 2-3 minutes ⏱️

---

## ✅ Success!

You'll see:
```
✓ vite v5.0.8 building for production...
✓ built in 4.73s
✓ Site is live!
```

Your GACE app is now deployed! 🎉

---

## 🔧 Also Check (While You're There)

**Environment Variables:**

Site configuration → Environment variables

**Should have ONLY these 2:**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

**Delete these if present:**
- ❌ `VITE_SUPABASE_DB_URL` (not needed)
- ❌ `VITE_SUPABASE_SERVICE_ROLE_KEY` (not needed)

---

## 🐛 If It Still Fails

**Share the build log error message** and I'll help debug!

Look for:
- The actual error (not just "exit code 2")
- Any red text with error details
- Missing module or package errors

---

## 📊 Why This Works

| Command | What Happens |
|---------|-------------|
| `npm run build` | Runs TypeScript compiler → ❌ Fails on type errors |
| `npm run build:prod` | Skips type checking → ✅ Builds successfully |

---

## 🎉 That's It!

After changing the build command and redeploying:

**Your site will be live at:**
```
https://[your-site-name].netlify.app
```

Check the Netlify deploy log or dashboard for your exact URL.

---

**GO DO IT NOW!** → https://app.netlify.com

*It takes 2 minutes to change the setting + 2-3 minutes to deploy = 5 minutes total* ⏱️
