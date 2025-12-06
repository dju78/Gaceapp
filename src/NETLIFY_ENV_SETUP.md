# Netlify Environment Variables Setup

## 🎯 Quick Guide: Adding Environment Variables to Netlify

### **Step 1: Access Netlify Dashboard**

1. Go to https://app.netlify.com
2. Log in with your account
3. Click on your **GACE site**

---

### **Step 2: Navigate to Environment Variables**

1. In the left sidebar, click **"Site configuration"**
2. Click **"Environment variables"** in the submenu
3. Or go directly to: `Build & deploy` → `Environment variables`

---

### **Step 3: Add Variables**

Click the **"Add a variable"** button and add these two variables:

#### Variable 1: VITE_SUPABASE_URL
```
Key:   VITE_SUPABASE_URL
Value: https://faczbtutzsrcnlrahifb.supabase.co
```

**Scopes:** 
- ✅ All scopes (Production, Deploy Previews, Branch deploys)

---

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
Key:   VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY3pidHV0enNyY25scmFoaWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTE3MTMsImV4cCI6MjA4MDA2NzcxM30.2PYn_okTcGJ78VtwEq6uN3ESKBmOb1r6bZALIV10lGc
```

**Scopes:** 
- ✅ All scopes (Production, Deploy Previews, Branch deploys)

---

### **Step 4: Save Variables**

After adding both variables, you should see:

```
VITE_SUPABASE_URL = https://faczbtutzsrcnlrahifb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Click **"Save"** or **"Create variable"**

---

### **Step 5: Trigger Redeploy**

1. Go to **"Deploys"** tab (top navigation)
2. Click **"Trigger deploy"** button (top right)
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes for build to complete

---

## 🔍 Verify Environment Variables Are Working

### Option 1: Check Build Logs

1. Open the latest deploy
2. Scroll through build logs
3. You should **NOT** see any errors about missing environment variables

### Option 2: Test in Browser Console

After deployment completes:

1. Open your deployed site
2. Open browser console (F12)
3. Type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```

You should see:
```
https://faczbtutzsrcnlrahifb.supabase.co
```

---

## ⚠️ Common Issues

### Issue 1: Variables Not Found During Build

**Symptom:** Build fails with "VITE_SUPABASE_URL is undefined"

**Solution:**
- Make sure variable names start with `VITE_` prefix
- Make sure you saved the variables
- Try triggering a new deploy (not redeploy)

---

### Issue 2: Variables Not Available in Browser

**Symptom:** `import.meta.env.VITE_SUPABASE_URL` returns `undefined` in browser

**Solution:**
- Verify variables are scoped to "All scopes"
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check if build succeeded (green checkmark)

---

### Issue 3: Still Using Hardcoded Values

**Symptom:** App works but still shows hardcoded credentials

**Solution:**
- Your code has fallback values:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://faczbtutzsrcnlrahifb.supabase.co'
```
- This is CORRECT - it provides fallback if env var is missing
- The app will prefer environment variable if available

---

## ✅ Final Checklist

Before you're done, verify:

- [ ] Both environment variables added to Netlify
- [ ] Variables are scoped to "All scopes"
- [ ] Triggered new deploy with "Clear cache and deploy site"
- [ ] Build completed successfully (green checkmark)
- [ ] Site is accessible
- [ ] No errors in browser console
- [ ] API calls work (check Network tab)

---

## 🔒 Security Notes

### ✅ Safe to Expose (Frontend)
- `VITE_SUPABASE_URL` - Public URL, safe to expose
- `VITE_SUPABASE_ANON_KEY` - Public anon key, safe to expose
  - ⚠️ This key is **already public** in your app's JavaScript
  - Protected by Supabase Row-Level Security (RLS) policies
  - Can only perform operations allowed by RLS rules

### ❌ NEVER Expose (Backend Only)
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access, **NEVER** add to Netlify frontend env vars
  - This should ONLY exist in Supabase Edge Functions environment
  - This is already configured in Supabase dashboard for your edge functions
  - Adding it to frontend would be a **critical security vulnerability**

---

## 📸 Visual Guide

### Environment Variables Page Should Look Like:

```
┌─────────────────────────────────────────────────────────┐
│ Environment variables                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  VITE_SUPABASE_URL                                      │
│  https://faczbtutzsrcnlrahifb.supabase.co              │
│  Scopes: All ✓                                          │
│  [Edit] [Delete]                                        │
│                                                          │
│  VITE_SUPABASE_ANON_KEY                                 │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                │
│  Scopes: All ✓                                          │
│  [Edit] [Delete]                                        │
│                                                          │
│  [+ Add a variable]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Copy-Paste

### For Netlify UI:

**Variable 1:**
```
VITE_SUPABASE_URL
```
```
https://faczbtutzsrcnlrahifb.supabase.co
```

**Variable 2:**
```
VITE_SUPABASE_ANON_KEY
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY3pidHV0enNyY25scmFoaWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTE3MTMsImV4cCI6MjA4MDA2NzcxM30.2PYn_okTcGJ78VtwEq6uN3ESKBmOb1r6bZALIV10lGc
```

---

**Done!** Your environment variables are configured. Now trigger a redeploy and your app will use them. 🎉
