# GACE Presentation Quick Reference Card

## 🎯 Demo Accounts (All passwords: Demo123!)

| Scenario | Email | Assets | Value |
|----------|-------|--------|-------|
| 🏠 US Expat | demo.expat@gace.demo | 4 US assets | £1.7M |
| 🌍 Global Investor | demo.investor@gace.demo | 5 jurisdictions | £1.3M |
| 💼 Business Owner | demo.business@gace.demo | UAE business | £1.2M |
| 👔 Tax Advisor | demo.advisor@gace.demo | Professional | - |
| 🏖️ Retiree | demo.retiree@gace.demo | FR/CA pensions | £831K |
| 💰 Simple Case | demo.simple@gace.demo | 1 HK account | £48K |

## 🚀 Deployment Commands

### Quick Deploy (Windows)
```batch
deploy.bat
```

### Quick Deploy (Mac/Linux)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Deploy
```bash
npm run build
netlify deploy --prod
```

## ✅ Pre-Presentation Checklist

- [ ] Site deployed and accessible
- [ ] Environment variables set in Netlify
- [ ] Demo data seeded (run seed endpoint)
- [ ] Test login with demo.expat@gace.demo
- [ ] Product tour tested
- [ ] All pages load without errors
- [ ] Mobile view tested

## 🎬 Presentation Flow

### 1. Opening (2 min)
- Show landing page
- Explain the RegTech problem
- Highlight UK tax compliance complexity

### 2. Live Demo (5-7 min)
```
1. Login: demo.expat@gace.demo / Demo123!
2. Dashboard Overview
   - Click "Take Tour" button
   - Show multi-jurisdiction portfolio (£1.7M)
   - Point out compliance alerts
3. Global Asset Scanner
   - Show US properties + investments
   - Highlight automatic jurisdiction detection
4. Tax Calculator
   - Demonstrate DTA calculation
   - Show UK tax liability with foreign tax credits
5. Document Processing
   - Show uploaded documents
   - Explain OCR extraction
6. Compliance Alerts
   - Show deadline tracking
   - Highlight HMRC filing reminders
```

### 3. Key Differentiators (2 min)
- ✅ AI interprets multiple tax regimes
- ✅ Automatic DTA calculations
- ✅ Multi-jurisdiction support
- ✅ Real-time compliance tracking
- ✅ Document OCR processing
- ✅ Role-based access (individual/advisor/admin)

### 4. Technical Innovation (1 min)
- Modern tech stack (React, Supabase, AI)
- Secure authentication
- Real-time updates
- Scalable architecture

## 🔧 Emergency Fixes

### If site is down:
```bash
# Quick redeploy
netlify deploy --prod
```

### If login fails:
```bash
# Reseed demo data
curl -X POST https://YOUR_ID.supabase.co/functions/v1/make-server-b5fd51b8/demo/seed \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### If tour doesn't work:
- Clear localStorage
- Reload page
- Start tour manually

## 📊 Key Metrics to Highlight

- **£3.9M+** total demo portfolio value
- **15+ countries** supported
- **6 user scenarios** ready
- **Real-time** compliance tracking
- **Automatic** DTA calculations

## 🎯 Elevator Pitch

"GACE is an AI-powered RegTech platform that helps UK residents with overseas assets maintain HMRC compliance. We automatically interpret tax treaties across multiple jurisdictions, calculate Double Taxation Agreement relief, and provide real-time compliance alerts—saving hours of manual work and preventing costly filing errors."

## 💡 Key Features to Emphasize

1. **AI Tax Interpretation** - Automatically interprets complex tax treaties
2. **Multi-Jurisdiction** - Handles assets across 15+ countries
3. **DTA Automation** - Calculates foreign tax credits automatically
4. **Compliance Automation** - Real-time deadline tracking and alerts
5. **Document Intelligence** - OCR extraction from tax documents
6. **Professional Features** - Advisor/accountant portal for managing clients

## 📞 Troubleshooting During Demo

| Issue | Quick Fix |
|-------|-----------|
| Login fails | Use demo.simple@gace.demo instead |
| Tour won't start | Refresh page, click "Take Tour" again |
| Data not loading | Check network tab, verify API is responding |
| 404 error | Verify netlify.toml redirects are working |
| Blank screen | Check console for errors, refresh |

## 🌟 Backup Demo Plan

If live site fails:
1. Have screenshots ready
2. Use screen recording
3. Show local development version
4. Walk through architecture slides

## 📱 Test URLs

- **Production**: https://your-site-name.netlify.app
- **Health Check**: https://YOUR_ID.supabase.co/functions/v1/make-server-b5fd51b8/health
- **Supabase Dashboard**: https://app.supabase.com

## 🎓 Innovator Founder Talking Points

### Problem
- UK residents with overseas assets face complex tax compliance
- Multiple tax regimes and Double Taxation Agreements
- Manual calculations prone to errors
- Costly accountant fees
- Risk of HMRC penalties

### Solution
- AI-powered automation
- Multi-jurisdiction support
- Real-time compliance tracking
- Professional-grade reporting
- Affordable SaaS pricing

### Market
- 5.5M+ UK residents with overseas assets
- Growing digital nomad population
- £billions in foreign-held assets
- Increasing HMRC scrutiny
- Professional accountant market

### Innovation
- AI interprets tax treaties automatically
- First platform for multi-jurisdiction UK compliance
- Modern tech stack (React, Supabase, AI)
- Scalable architecture
- Role-based access for advisors

### Traction/Roadmap
- MVP complete with real Supabase backend
- 6 realistic demo scenarios
- Ready for beta testing
- Plan: Onboard 100 beta users
- Target: 1,000 users within 12 months

## 📸 Screenshot Checklist

Before presentation, take screenshots of:
- [ ] Dashboard overview
- [ ] Asset portfolio
- [ ] Tax calculator results
- [ ] Compliance alerts
- [ ] Document upload
- [ ] Product tour in action

## ⏱️ Timing Guide

- **5-minute pitch**: Opening + Demo + Key points
- **10-minute pitch**: Add technical details + market
- **15-minute pitch**: Add full demo + Q&A

## 🎤 Opening Line

"Imagine you're a UK resident who just inherited property in the US. You now have to navigate UK tax law, US tax law, and the UK-US Double Taxation Agreement. GACE automates this entire process with AI, saving hours of work and preventing costly errors."

---

## 🚀 You're Ready!

- Demo data seeded ✅
- Product tour working ✅
- All features functional ✅
- Backup plans ready ✅

**Break a leg with your Innovator Founder endorsement presentation!** 🎯

---

*Last updated: December 2025*
