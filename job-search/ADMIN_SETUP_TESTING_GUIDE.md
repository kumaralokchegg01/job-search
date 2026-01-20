# Quick Setup & Testing Guide

## ✅ If Pages Still Not Showing

Try these steps:

### Step 1: Clear Browser Cache
```bash
# In browser DevTools (F12):
# - Go to Application → Storage
# - Click "Clear site data"
# - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 2: Check Backend is Running
```bash
# Terminal 1: Check if backend is running on port 5000
curl http://localhost:5000/api/health

# Should return: {"status":"ok"} or similar

# If not running:
cd JobIntel/backend
npm run dev
```

### Step 3: Check Frontend is Running
```bash
# Terminal 2: Check if frontend is running on port 8080
curl http://localhost:8080

# If not running:
cd JobIntel/frontend
npm run dev
```

### Step 4: Verify Admin Authentication
1. Go to `/admin/crawlers`
2. Check browser console (F12 → Console)
3. Look for errors like "401 Unauthorized" or "403 Forbidden"
4. If you see auth errors, login again:
   - Go to `/login`
   - Use admin credentials: `admin@jobintel.local` / `AdminPass!23`
   - Should redirect to `/admin` dashboard

### Step 5: Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Click on `/admin/crawlers`
4. Look for request to `GET /api/admin/scrape/logs`
5. If it fails:
   - Check the response status (should be 200)
   - Look for error message in response body

---

## 🧪 Manual Testing

### Test 1: Navigate to All Admin Pages
```
✅ /admin → Should show Dashboard
✅ /admin/jobs → Should show Jobs
✅ /admin/users → Should show Users
✅ /admin/profile-fields → Should show Profile Fields
✅ /admin/skills → Should show Skills
✅ /admin/notifications → Should show Notifications
✅ /admin/referrals → Should show Referrals
✅ /admin/crawlers → Should show Crawlers (JUST FIXED!)
✅ /admin/analytics → Should show Analytics
✅ /admin/revenue → Should show Revenue
✅ /admin/settings → Should show Settings
```

### Test 2: Crawlers Page Functionality
```
1. Navigate to /admin/crawlers
2. Should see:
   - "Web Crawlers & Scraping" title
   - 11 checkboxes for buckets
   - "Select All" button
   - "Start Scraping" button (gray/disabled initially)
   - "Scraping Logs" section below

3. Click "Select All"
   - All 11 checkboxes should be checked
   - Button should turn blue/enabled

4. Uncheck a few buckets
   - Show selected count

5. Click "Start Scraping"
   - Should show: "Scraping started! Session ID: ..."
   - Button should show loading state

6. Check "Scraping Logs" section
   - Should show entries after a few seconds
   - Should display status (in-progress/completed/failed)
```

### Test 3: Backend Logs
```bash
# Check if scraping logs are being created
cd JobIntel/backend
npm run dev

# In another terminal:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/scrape/logs

# Should return JSON with logs array
```

---

## 🐛 If Still Not Working

### Check Browser Console for Errors
```
F12 → Console tab
Look for:
- 404 errors (endpoint not found)
- 401/403 errors (authentication/authorization)
- Network errors (CORS, connection refused)
```

### Check Backend Console for Errors
```
Look for:
- "Cannot find module" errors
- "Authentication failed" errors
- "Database connection" errors
- MongoDB connection issues
```

### Rebuild Frontend
```bash
cd JobIntel/frontend
npm run build

# This will show compilation errors if any
```

### Restart Everything Fresh
```bash
# Terminal 1: Kill backend
pkill -f "npm run dev"

# Terminal 2: Kill frontend  
pkill -f "npm run dev"

# Kill Node processes completely
pkill -f node

# Start backend first
cd JobIntel/backend
npm run dev

# Wait 5 seconds, then start frontend
cd JobIntel/frontend
npm run dev

# Access http://localhost:8080
```

---

## 📝 Key Files Modified

1. **Frontend:**
   - `/frontend/src/pages/admin/AdminCrawlers.tsx` - Complete rewrite

2. **Backend:**
   - `/backend/src/controllers/adminController.ts` - Added `getScrapingLogs`
   - `/backend/src/routes/admin.ts` - Added `/scrape/logs` endpoint import

---

## 🔗 Related Endpoints

### Admin Scraping Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/scrape/run` | POST | Start scraping job | Admin |
| `/api/admin/scrape/logs` | GET | Get scraping history | Admin |
| `/api/admin/stats` | GET | Get dashboard stats | Admin |
| `/api/admin/api-usage/current` | GET | Get API usage stats | Admin |

### Data Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/jobs/search` | GET | Search jobs | Public |
| `/api/matches/my-jobs` | GET | Get matched jobs | User |
| `/api/resume/upload` | POST | Upload resume | User |

---

## 💡 Tips

- **Rate Limiting:** API calls are limited to 1 per second (respect OpenWeb Ninja limits)
- **Monthly Budget:** 200 API calls/month (hardcoded limit)
- **Data Expiry:** Jobs expire after 30 days, deleted after 60 days
- **Deduplication:** Jobs are unique by `externalJobId` from OpenWeb Ninja
- **Matching:** 6-factor algorithm (Skill 40% + Role 20% + Level 15% + Exp 10% + Loc 10% + Mode 5%)

---

## ✨ What's Next?

After confirming all admin pages work:

1. **Test User Job Matching**
   - Upload a resume
   - Should auto-trigger matching against scraped jobs
   - Should show matches with score breakdown

2. **Test Notifications**
   - Configure email/WhatsApp/Telegram
   - Should send notifications for top matches

3. **Monitor API Usage**
   - Check API usage tracking
   - Verify 200/month limit enforcement
