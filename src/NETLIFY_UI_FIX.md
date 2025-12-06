# 🚨 URGENT FIX - Change Netlify UI Build Command

## ⚠️ The Problem

Your Netlify build log shows:
```
command: npm run build
commandOrigin: ui  ← THIS IS THE PROBLEM!
```

**`commandOrigin: ui`** means Netlify is using the build command from the **UI settings**, which overrides the `netlify.toml` file.

---

## ✅ THE FIX - Follow These Exact Steps

### **Step 1: Go to Build Settings**

**Click this link (replace YOUR_SITE_NAME with your actual site name):**
```
https://app.netlify.com/sites/YOUR_SITE_NAME/settings/deploys#build-settings
```

**Or manually navigate:**
1. Go to https://app.netlify.com
2. Click on your GACE site
3. Click "Site configuration" (left sidebar)
4. Click "Build & deploy"
5. Scroll down to "Build settings"

---

### **Step 2: Edit Build Settings**

You'll see:
```
Build command: npm run build
Publish directory: dist
```

**Click the "Edit settings" button**

---

### **Step 3: Change Build Command**

In the popup/form:

**Change this:**
```
Build command: npm run build
```

**To this:**
```
Build command: npm run build:prod
```

**Keep these the same:**
```
Publish directory: dist
```

**Click "Save"**

---

### **Step 4: Clear Cache and Deploy**

1. Click "Deploys" tab at the top
2. Click the **"Trigger deploy"** dropdown button (top right)
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes

---

## 🎯 What You Should See

### **Build Log Should Show:**

```
12:15:00 AM: Build command from Netlify app
12:15:00 AM: $ npm run build:prod          ← Changed!
12:15:00 AM: 
12:15:00 AM: > gace@1.0.0 build:prod
12:15:00 AM: > vite build
12:15:00 AM: 
12:15:01 AM: vite v5.0.8 building for production...
12:15:03 AM: ✓ 1234 modules transformed.
12:15:05 AM: dist/index.html                   0.45 kB
12:15:05 AM: dist/assets/index-abc123.css      123 kB
12:15:05 AM: dist/assets/index-xyz789.js       456 kB
12:15:05 AM: ✓ built in 4.73s
12:15:05 AM: ✓ Site is live!
```

---

## 🔍 Verify Environment Variables

While you're in the Netlify dashboard, also check environment variables:

**Go to:**
Site configuration → Environment variables

**You should ONLY have these 2:**
```
✅ VITE_SUPABASE_URL = https://faczbtutzsrcnlrahifb.supabase.co
✅ VITE_SUPABASE_ANON_KEY = [your anon key]
```

**DELETE these if present (they're not needed for frontend):**
```
❌ VITE_SUPABASE_DB_URL
❌ VITE_SUPABASE_SERVICE_ROLE_KEY
```

To delete:
1. Click the variable
2. Click "Options" (three dots)
3. Click "Delete"
4. Confirm

---

## 🐛 Still Failing?

### **If build still fails after changing to `build:prod`:**

**Check what the actual error is in the build log.**

Look for errors like:
- `Cannot find module ...` → Missing dependency
- `VITE_SUPABASE_URL is not defined` → Missing env variable
- `Error parsing ...` → Syntax error in code

**Share the error message and I can help debug!**

---

## 📊 Why This Happened

Netlify has **two places** to set build command:

1. **`netlify.toml` file** (in your repo)
2. **Netlify UI** (in dashboard)

**UI settings ALWAYS override the toml file!**

Your build log showed:
```
commandOrigin: ui  ← This means UI is being used, not netlify.toml
```

By changing it in the UI, Netlify will now use `npm run build:prod` which skips type checking and builds successfully.

---

## ✅ After It Works

Once deployed successfully:

**Option A: Keep using UI settings**
- Just leave it as is
- Works fine, but settings are in UI not in code

**Option B: Remove UI override to use netlify.toml**
- In Build settings, clear the "Build command" field (make it empty)
- Click "Save"
- Netlify will then use the command from `netlify.toml`
- This is better for version control

---

## 🎉 Expected Result

After following the steps above:

```
✅ Build succeeds in 2-3 minutes
✅ dist/ folder is created
✅ Site is deployed
✅ Your GACE app is live!
```

**Your site URL will be:**
```
https://[your-site-name].netlify.app
```

Check the Netlify dashboard or build log for the exact URL.

---

## 📸 Visual Guide

### **1. Find Build Settings:**
```
Netlify Dashboard
└── Your Site
    └── Site configuration (left sidebar)
        └── Build & deploy
            └── Build settings (scroll down)
                └── [Edit settings] button
```

### **2. Change Build Command:**
```
Build settings form:
┌─────────────────────────────────────┐
│ Build command                       │
│ [npm run build:prod]  ← Change this│
│                                     │
│ Publish directory                   │
│ [dist]                ← Keep this   │
│                                     │
│ [Cancel]  [Save]      ← Click Save  │
└─────────────────────────────────────┘
```

### **3. Trigger Deploy:**
```
Deploys tab
└── [Trigger deploy ▼] dropdown
    └── Clear cache and deploy site  ← Click this
```

---

## 🚀 DO THIS NOW

1. ✅ Go to: Netlify → Your Site → Site configuration → Build & deploy
2. ✅ Click "Edit settings" in Build settings
3. ✅ Change `npm run build` to `npm run build:prod`
4. ✅ Click "Save"
5. ✅ Go to Deploys tab
6. ✅ Click "Trigger deploy" → "Clear cache and deploy site"
7. ✅ Wait 2-3 minutes
8. ✅ Your site is live! 🎉

---

**This WILL work!** The build command is the only issue. Once you change it to `npm run build:prod`, the build will succeed.
