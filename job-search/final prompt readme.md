# JobIntel Final Development Prompt (India-Only)

## Executive Summary
This document enables any coding agent or developer to complete the JobIntel platform for India-focused job aggregation and matching. It integrates:
- [requiremnt prompt.md](requiremnt%20prompt.md) requirements
- AI_AGENT_PROMPT.md specification
- LinkedIN-Scraper proven API logic
- All current JobIntel features

**Key Goals:**
- India-only jobs (no US/UK/Sweden/Aus)
- 11-bucket job taxonomy
- API usage limit: 200 calls/month (OpenWeb Ninja)
- MongoDB-first data flow: API → MongoDB → user fetch → matching
- Transparent 6-factor matching algorithm
- Admin controls for scraping, API usage, and stale data

---
    ↓
Backend Job Scraper Service (Scheduled/Admin-triggered)
    ↓
```

---

## Job Bucket System (India-Only)
- **Buckets:** Fresher, Batch, Software, Data, Cloud, Mobile, QA, Non-Tech, Experience, Employment, Work Mode
- **Filtering:** All API queries must use `country: 'in'` and Indian cities/companies
- **API Call Budget:** Each bucket has a monthly call allocation; total ≤ 200

---

## Development Phases
### Phase 1: Scraping Infrastructure
- Integrate LinkedIN-Scraper logic for robust API calls
- Use admin-triggered or scheduled scraping only
- Enforce API usage limits (200/month)

### Phase 2: MongoDB Schema Design
### Phase 3: Job Extraction & Normalization
- Validate and normalize data (see LinkedIN-Scraper Pydantic patterns)
- Deduplicate by externalJobId


### Phase 5: Resume Parsing & Job Matching
- Show transparent match breakdown to user

- Admin dashboard for audit and manual cleanup

### Auth
- `POST /api/auth/register` { email, password, ... }
### Jobs
- `GET /api/jobs?bucket=software&location=Bangalore`
### Resume & Matching
- `GET /api/match?userId=...`

### Notifications
- `POST /api/notify` { userId, channel, message }

### Admin
- `GET /api/admin/api-usage`
- `POST /api/admin/scrape` { bucket, location }
- `GET /api/admin/stale-jobs`

### Example Payloads
```json
// Register
{
  "email": "user@example.com",
  "password": "securepass",
  "name": "Amit Kumar"
}
// Scrape Jobs (admin)
{
  "bucket": "data",
  "location": "Hyderabad"
}
```

---

## External Services & Integration Points
- **OpenWeb Ninja API:** India-only jobs, 200 calls/month, admin-triggered
- **Razorpay:** Payments for premium/ultra tiers
- **WhatsApp Cloud API & Telegram Bot API:** Real notification delivery (not mocks)
- **BullMQ + Redis:** Background job queues for scraping, notifications

---

## Pseudocode: MERN Models & Schemas
### Job Model (Mongoose)
```js
const JobSchema = new mongoose.Schema({
  externalJobId: { type: String, unique: true },
  title: String,
  location: String,
  bucket: String,
  skills: [String],
  experience: String,
  workMode: String,
  postedAt: Date,
  expiresAt: Date,
  ... // other fields
});
```
### Resume Parsing Service
```js
function parseResume(file) {
  // Extract text from PDF/DOCX
  // Use regex to find skills, experience, education
  // Return normalized object
}
```
### Matching Algorithm
```js
function matchJob(userResume, job) {
  // Calculate score for each factor
  // skillMatch = ... (40%)
  // roleMatch = ... (20%)
  // ...
  // Return total score and breakdown
}
```

---

## Pseudocode: Frontend Components
- **JobListPage:** Fetch jobs from `/api/jobs`, filter by bucket/location
- **JobDetailPage:** Show job details, match breakdown
- **ResumeUpload:** Upload PDF/DOCX, show parsed skills
- **MatchResults:** Display jobs with match scores
- **AdminDashboard:** API usage, scraping controls, stale job management

---

## API Usage Limits & Data Flow
- All jobs fetched via OpenWeb Ninja API (India-only) are saved to MongoDB
- Users always fetch jobs from MongoDB, never direct API
- API usage tracked in `api_usage` collection; hard stop at 200/month
- Admin can view usage, trigger scraping, and manage buckets

---

## Testing, Monitoring, Error Handling
- **Testing:** Unit tests for models, services, matching; integration tests for API endpoints
- **Monitoring:** Log API usage, job scraping, notification delivery
- **Error Handling:** Graceful fallback for API failures, validation errors, notification retries
- **Edge Cases:** Duplicate jobs, expired jobs, API quota exceeded, invalid resumes

---

## Implementation Checklist
- [ ] Scraping infrastructure with API limits
- [ ] MongoDB schema and indexes
- [ ] Job extraction/normalization logic
- [ ] Frontend job display (React)
- [ ] Resume upload and parsing
- [ ] 6-factor matching engine
- [ ] Notification system (real adapters)
- [ ] Admin controls for scraping, API usage, stale data
- [ ] Testing and monitoring setup

---

## References
- [requiremnt prompt.md](requiremnt%20prompt.md)
- AI_AGENT_PROMPT.md
- LinkedIN-Scraper (Python logic)
- JobIntel (existing features)

---

**This README is designed for direct use by any coding agent or developer to complete JobIntel for India-only job aggregation and matching.**
