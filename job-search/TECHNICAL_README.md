# LinkedIN-Scraper: Technical Architecture & API Integration Guide

**Version:** 3.0.0  
**Author:** Hex686f6c61  
**Language:** Python 3.7+  
**Last Updated:** 2025-12-08

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Integration Details](#api-integration-details)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Core Components](#core-components)
6. [API Endpoints & Methods](#api-endpoints--methods)
7. [Data Models & Validation](#data-models--validation)
8. [Rate Limiting & Retry Logic](#rate-limiting--retry-logic)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Data Extraction & Processing](#data-extraction--processing)
11. [Usage Examples](#usage-examples)
12. [Performance Considerations](#performance-considerations)

---

## Overview

LinkedIN-Scraper is a robust Python application that integrates with the **OpenWeb Ninja JSearch API** to search, retrieve, and analyze LinkedIn job listings. The application is designed with production-grade error handling, rate limiting, retry logic, and comprehensive data validation.

### Key Characteristics

- **External API:** OpenWeb Ninja JSearch API (api.openwebninja.com)
- **Data Source:** LinkedIn job listings and salary data
- **Supported Operations:** Search jobs, retrieve details, query salaries, filter/sort results
- **Output Formats:** CSV and JSON export
- **Validation:** Pydantic models with field validators
- **Safety Features:** Rate limiting, exponential backoff, retry logic, request timeout

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LinkedIN-Scraper Application                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                           │
│  │   User Interface │ (Rich Console + Menu System)              │
│  │   (UI Layer)     │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────▼──────────────────────────────────────────┐         │
│  │        Service Layer (Business Logic)            │         │
│  ├────────────────────────────────────────────────┤         │
│  │ • JobService                                  │         │
│  │ • SalaryService                               │         │
│  │ • ExportService                               │         │
│  │ • SearchParameters Validation                 │         │
│  └────────┬─────────────────────────────────────┘         │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────┐         │
│  │   API Client Layer (HTTP + Rate Limiting)    │         │
│  ├────────────────────────────────────────────┤         │
│  │ • JSearchClient (Main API Client)           │         │
│  │ • HTTPClient (Generic HTTP Handler)         │         │
│  │ • RateLimiter (1s delay, 3 retries)        │         │
│  └────────┬─────────────────────────────────────┘         │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────┐         │
│  │     External API (OpenWeb Ninja)              │         │
│  ├────────────────────────────────────────────┤         │
│  │ • /jsearch/search                           │         │
│  │ • /jsearch/job-details                      │         │
│  │ • /jsearch/estimated-salary                 │         │
│  │ • /jsearch/company-salary                   │         │
│  └────────────────────────────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────┐              │
│  │  Data Models & Validation (Pydantic)    │              │
│  ├─────────────────────────────────────────┤              │
│  │ • Job (40+ fields with validators)      │              │
│  │ • Salary (salary estimation model)      │              │
│  │ • SearchParameters (request validation) │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
│  ┌─────────────────────────────────────────┐              │
│  │  Output Layer                           │              │
│  ├─────────────────────────────────────────┤              │
│  │ • CSV Export                            │              │
│  │ • JSON Export                           │              │
│  │ • Console Formatting (Rich Tables)      │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Integration Details

### External API: OpenWeb Ninja JSearch API

**API Provider:** OpenWeb Ninja  
**Base URL:** `https://api.openwebninja.com`  
**Authentication:** API Key (x-api-key header)  
**Protocol:** HTTPS  
**Response Format:** JSON  
**Rate Limit:** Configurable (default: 1 request/second)  
**Timeout:** 30 seconds (configurable)

### API Key Configuration

```bash
# .env file
API_KEY=YOUR_API_KEY_HERE
API_HOST=api.openwebninja.com
```

**Location:** `/workspaces/job-search/linkedIN-Scraper/.env`

---

## Data Flow Architecture

### Complete Request-Response Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: USER INITIATES SEARCH                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User selects search type (predefined or custom)             │
│        ↓                                                      │
│  Parameters validated by SearchParameters model              │
│  (Pydantic validation - ensures required fields present)     │
│        ↓                                                      │
│  Parameters converted to API format (to_api_params())        │
│        ↓                                                      │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: RATE LIMITING & RETRY LOGIC                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  RateLimiter.wait() checks time since last request:          │
│    • If < 1 second: sleep until 1 second has passed          │
│    • Prevents API saturation                                 │
│                                                               │
│  Request prepared with authentication header:                │
│    • Header: x-api-key: {API_KEY}                            │
│    • Timeout: 30 seconds                                     │
│                                                               │
│  @rate_limiter.with_retry decorator wraps request:           │
│    • Attempt 1: Immediate execution                          │
│    • Attempt 2: Wait 2 seconds (if failure)                  │
│    • Attempt 3: Wait 4 seconds (if failure)                  │
│    • Attempt 4: Wait 8 seconds (if failure)                  │
│  (Exponential backoff: delay = retry_delay * 2^attempt)      │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: HTTP REQUEST TO OPENWEBNINJA API                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HTTPClient.get() executes HTTPS request:                    │
│    • Connection type: http.client.HTTPSConnection            │
│    • URL construction: /jsearch/search?param1=val1&...       │
│    • HTTP Method: GET                                        │
│    • Headers: {x-api-key, Content-Type}                      │
│    • Timeout: 30 seconds                                     │
│                                                               │
│  Network transmission:                                       │
│    Client → (HTTPS encrypted) → api.openwebninja.com         │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: API RESPONSE PROCESSING                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  OpenWeb Ninja API responds with JSON:                       │
│    • Status code: 200 (success) or error code                │
│    • Body: {"data": [{...job1...}, {...job2...}], ...}       │
│                                                               │
│  HTTPClient validates response:                              │
│    • Status code check: Must be 200                          │
│    • If not 200: raise HTTPError(status_code, message)       │
│    • JSON parsing: json.loads(data)                          │
│                                                               │
│  Error detection:                                            │
│    • Check for "error" field in response dict                │
│    • If error present: raise HTTPError(400, error_msg)       │
│                                                               │
│  Success path:                                               │
│    • Extract "data" array from response                      │
│    • Return list of raw job dictionaries                     │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: DATA VALIDATION & PARSING                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  JobService.search_jobs() processes raw results:             │
│                                                               │
│  For each raw job dict:                                      │
│    1. Attempt: Job.model_validate(job_data)                  │
│    2. Pydantic validates:                                    │
│       • Required fields present                              │
│       • Field types correct                                  │
│       • Custom validators execute:                           │
│         - validate_skills(): ensures list type               │
│         - validate_benefits(): ensures list/None type        │
│    3. On success: Create Job object                          │
│    4. On failure: Log warning, skip this job, continue       │
│                                                               │
│  Result: List of validated Job objects                       │
│    • Each job has 30+ validated fields                       │
│    • Bad data skipped (graceful degradation)                 │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 6: BUSINESS LOGIC & FILTERING                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Optional filtering applied:                                 │
│    • filter_remote_jobs() - only job.is_remote == true       │
│    • filter_by_salary() - only min_salary >= threshold       │
│    • filter_by_employment_type() - match employment_type     │
│                                                               │
│  Optional sorting applied:                                   │
│    • sort_by_salary() - ascending or descending              │
│    • sort_by_date() - newest or oldest first                 │
│    • sort_by_title() - alphabetical                          │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 7: FORMATTING & DISPLAY                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  JobFormatter creates Rich table:                            │
│    • Columns: Title, Company, Location, Remote, Salary       │
│    • Data formatting:                                        │
│      - job.title: Limited to 30 chars                        │
│      - job.get_location(): "City, State, Country"            │
│      - job.get_salary_range(): "$min - $max USD/YEAR"        │
│      - job.is_remote: ✓ or ✗                                 │
│                                                               │
│  Console.print() renders colored table to terminal           │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 8: EXPORT (OPTIONAL)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ExportService exports results:                              │
│                                                               │
│  CSV Export:                                                 │
│    • File: output/{query}_{timestamp}.csv                    │
│    • Encoding: UTF-8                                         │
│    • Columns: All Job model fields                           │
│    • Delimiter: Comma                                        │
│                                                               │
│  JSON Export:                                                │
│    • File: output/{query}_{timestamp}.json                   │
│    • Encoding: UTF-8                                         │
│    • Format: Array of job objects                            │
│    • Pretty printed: indent=2                                │
│                                                               │
└────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. JSearchClient (`src/api/jsearch_client.py`)

**Purpose:** Specialized client for OpenWeb Ninja JSearch API

**Key Methods:**

```python
class JSearchClient:
    def __init__(api_key, api_host, config)
        # Initialize with API credentials and rate limiter
        
    def search_jobs(params: SearchParameters) -> List[Dict]:
        """
        ENDPOINT: GET /jsearch/search
        
        Parameters passed to API:
        - query: Job title/keywords
        - country: Country code (us, gb, es, in, etc.)
        - employment_types: FULLTIME, CONTRACTOR, PARTTIME
        - work_from_home: True/False
        - date_posted: 'hour', '3days', 'week', 'month'
        - page: Pagination (1-based)
        - num_pages: Results per page (max varies by API)
        
        Returns:
        - List of raw job dictionaries from API
        - Each dict has 30+ fields (title, salary, location, etc.)
        """
    
    def get_job_details(job_id, country, language, fields) -> Dict:
        """
        ENDPOINT: GET /jsearch/job-details
        
        Parameters:
        - job_id: Unique job identifier from search results
        - country: Country code where job was posted
        - language: Language code (optional)
        - fields: Specific fields to include (optional)
        
        Returns:
        - Complete job object with all available fields
        - Includes full description, requirements, benefits, etc.
        """
    
    def get_estimated_salary(job_title, location, location_type, experience) -> List[Dict]:
        """
        ENDPOINT: GET /jsearch/estimated-salary
        
        Parameters:
        - job_title: Position title (e.g., "Software Engineer")
        - location: City/Region/Country name
        - location_type: CITY, STATE, COUNTRY, ANY
        - years_of_experience: level (ALL, ENTRY, MID, SENIOR)
        
        Returns:
        - List of salary ranges for position/location combination
        - Includes min/max salary, currency, period (YEAR/MONTH)
        """
    
    def get_company_salary(company, job_title, location, experience) -> List[Dict]:
        """
        ENDPOINT: GET /jsearch/company-salary
        
        Parameters:
        - company: Company name (e.g., "Microsoft")
        - job_title: Position in company (e.g., "Engineer")
        - location: Company location (optional)
        
        Returns:
        - Salary data specific to company and role
        """
```

**Internal Flow:**

1. **Parameter Validation:** `SearchParameters.to_api_params()` converts Python params to API format
2. **Rate Limiting:** `RateLimiter.wait()` ensures 1+ second between requests
3. **HTTP Request:** `HTTPClient.get()` makes HTTPS request with authentication
4. **Retry Decorator:** `@rate_limiter.with_retry` handles up to 3 attempts with exponential backoff
5. **Response Parsing:** JSON parsed, error field checked, data extracted
6. **Error Handling:** HTTPError raised for non-200 status or API error messages

### 2. HTTPClient (`src/api/client.py`)

**Purpose:** Generic HTTPS client for external API communication

**Key Methods:**

```python
class HTTPClient:
    def __init__(host, headers, timeout):
        # Setup HTTPS connection parameters
        # host: "api.openwebninja.com"
        # headers: {"x-api-key": API_KEY}
        # timeout: 30 seconds
    
    def get(endpoint: str, params: Dict) -> Dict:
        """
        Execute HTTPS GET request
        
        Process:
        1. URL encode query parameters (urllib.parse.urlencode)
        2. Construct full endpoint: /jsearch/search?key1=val1&key2=val2
        3. Create HTTPS connection: http.client.HTTPSConnection
        4. Send request with headers (including x-api-key)
        5. Read response with timeout
        6. Verify HTTP 200 status
        7. Parse JSON response
        8. Return dict
        
        Exception Handling:
        - HTTPError raised if status != 200
        - json.JSONDecodeError if response not valid JSON
        - Connection timeout if > 30 seconds
        """
    
    def post(endpoint: str, data: Dict) -> Dict:
        """Similar to get() but uses POST method with JSON body"""
```

**Authentication:**

All requests include header:
```
x-api-key: {API_KEY}
```

This header is required by OpenWeb Ninja API to authenticate the request.

### 3. RateLimiter (`src/api/rate_limiter.py`)

**Purpose:** Prevent API saturation and handle transient failures

**Algorithm:**

```python
class RateLimiter:
    def __init__(delay=1.0, max_retries=3, retry_delay=2):
        # delay: Minimum seconds between requests (1.0)
        # max_retries: Maximum retry attempts (3)
        # retry_delay: Base delay for exponential backoff (2 seconds)
    
    def wait():
        """
        Wait if necessary to maintain rate limit
        
        Logic:
        1. Get current time
        2. Calculate: time_since_last_request = current_time - last_request_time
        3. If time_since_last_request < delay:
           - sleep(delay - time_since_last_request)
        4. Update last_request_time = current_time
        5. Increment request_count
        
        Result: Minimum 1 second between API calls
        """
    
    def with_retry(func):
        """
        Decorator implementing retry logic with exponential backoff
        
        Flow:
        FOR attempt IN range(max_retries):  # 0, 1, 2
            TRY:
                self.wait()  # Apply rate limiting
                result = func()  # Execute function
                RETURN result
            EXCEPT Exception as e:
                last_exception = e
                IF attempt < max_retries - 1:
                    sleep_time = retry_delay * (2 ** attempt)
                    # Attempt 0 fails: wait 2 seconds (2 * 2^0)
                    # Attempt 1 fails: wait 4 seconds (2 * 2^1)
                    # Attempt 2 fails: wait 8 seconds (2 * 2^2)
                    SLEEP(sleep_time)
        
        RAISE last_exception
        
        Example execution:
        - Attempt 1 fails due to timeout
        - Wait 2 seconds
        - Attempt 2 fails due to rate limit
        - Wait 4 seconds
        - Attempt 3 succeeds, return result
        """
```

### 4. JobService (`src/services/job_service.py`)

**Purpose:** Business logic for job search and filtering

**Key Methods:**

```python
class JobService:
    def __init__(api_client: JSearchClient):
        # Store reference to API client
    
    def search_jobs(params: SearchParameters) -> List[Job]:
        """
        Orchestrate job search with validation
        
        Flow:
        1. Call api_client.search_jobs(params)
        2. Receive List[Dict] with raw job data
        3. FOR each raw_job_dict:
            TRY:
                job_obj = Job.model_validate(raw_job_dict)
                jobs.append(job_obj)
            EXCEPT ValidationError:
                Log warning, skip this job
        4. Return List[Job] with validated objects
        
        Validation:
        - Job.model_validate() checks all field types
        - Runs field validators (skills, benefits)
        - Handles field aliases (job_title -> title)
        - Skips jobs with critical data missing
        """
    
    def get_job_details(job_id, country) -> Job:
        """
        Get complete job details
        
        1. Call api_client.get_job_details(job_id, country)
        2. Validate response with Job.model_validate()
        3. Return validated Job object
        4. On validation error, raise ValueError with details
        """
    
    def filter_remote_jobs(jobs) -> List[Job]:
        """Filter: job.is_remote == True"""
    
    def filter_by_salary(jobs, min_salary, currency) -> List[Job]:
        """Filter: job.min_salary >= min_salary AND currency matches"""
    
    def sort_by_salary(jobs, descending=True) -> List[Job]:
        """Sort by min_salary (or average if both min/max present)"""
    
    def sort_by_date(jobs, newest_first=True) -> List[Job]:
        """Sort by posted_at_timestamp"""
```

### 5. Job Model (`src/models/job.py`)

**Purpose:** Pydantic model for data validation and serialization

**Fields (40+):**

```python
class Job(BaseModel):
    # Identifiers
    job_id: str  # Unique ID from OpenWeb Ninja
    
    # Basic Info
    title: str  # Job title (alias: job_title)
    employer_name: str  # Company name
    employer_logo: Optional[str]  # Logo URL
    job_publisher: Optional[str]  # Publishing platform
    
    # Location (4 fields)
    city: str  # City name
    state: str  # State/Region
    country: str  # Country code
    latitude/longitude: float  # Geo coordinates
    
    # Job Details (4 fields)
    is_remote: bool  # Remote work available
    employment_type: str  # FULLTIME, CONTRACTOR, PARTTIME
    description: str  # Full job description
    apply_link: str  # Application URL
    
    # Salary (4 fields)
    min_salary: Optional[float]  # Lower bound
    max_salary: Optional[float]  # Upper bound
    salary_currency: str  # USD, EUR, etc.
    salary_period: str  # YEAR, MONTH
    
    # Dates (4 fields)
    posted_at_timestamp: int  # Unix timestamp
    posted_at_datetime: str  # ISO datetime
    expiration_timestamp: int  # When job expires
    expiration_datetime: str  # Expiration ISO datetime
    
    # Requirements (4 fields)
    required_experience: str  # "5 years"
    required_skills: List[str]  # ["Python", "Java", ...]
    required_education: str  # "Bachelor's"
    experience_in_place_of_education: bool  # Can skip degree
    
    # Additional (8+ fields)
    benefits: Optional[List[str]]  # ["Health", "401k", ...]
    highlights: Optional[Dict]  # Custom highlights
    google_link: Optional[str]  # Google search link

**Field Aliases:** Maps API field names to model attributes
- API field "job_title" → Model field "title"
- API field "job_city" → Model field "city"
- API field "job_is_remote" → Model field "is_remote"

**Validators:**

```python
@field_validator('required_skills', mode='before')
def validate_skills(cls, v):
    """Ensure required_skills is always a list"""
    if v is None:
        return []
    if isinstance(v, str):
        return [v]  # Convert single string to list
    return v

@field_validator('benefits', mode='before')
def validate_benefits(cls, v):
    """Ensure benefits is always a list or None"""
    if v is None:
        return None
    if isinstance(v, str):
        return [v]
    return v

**Helper Methods:**

def get_location() -> str:
    """Format as: 'City, State, Country'"""
    # Used in display tables
    
def get_salary_range() -> Optional[str]:
    """Format as: '$min - $max USD/YEAR'"""
    # Handles min only, max only, or range
    
def get_short_description(max_length=300) -> str:
    """Truncate description to max_length chars"""
    # Cleans whitespace, adds ellipsis if truncated
```

---

## API Endpoints & Methods

### OpenWeb Ninja JSearch API Endpoints

All endpoints use HTTPS and require `x-api-key` header.

#### 1. Job Search Endpoint

```
GET /jsearch/search
Host: api.openwebninja.com
Authentication: x-api-key: {API_KEY}

Query Parameters:
├── query* (required)
│   └── Search keywords (e.g., "python developer")
├── country* (required)
│   └── Country code (us, gb, es, in, au, ca, fr, de, nl, etc.)
├── employment_types (optional)
│   └── FULLTIME | CONTRACTOR | PARTTIME
├── work_from_home (optional)
│   └── true | false
├── date_posted (optional)
│   └── hour | 3days | week | month
├── page (optional)
│   └── Page number (1-based, default: 1)
├── num_pages (optional)
│   └── Results per page (varies, typical: 10)
└── language (optional)
    └── Language code (en, es, fr, de, etc.)

Response Format:
{
  "status": "success",
  "data": [
    {
      "job_id": "abc123xyz",
      "job_title": "Senior Python Developer",
      "employer_name": "Tech Company Inc",
      "job_city": "San Francisco",
      "job_country": "us",
      "job_is_remote": true,
      "job_employment_type": "FULLTIME",
      "job_description": "We are looking for...",
      "job_apply_link": "https://company.com/apply",
      "job_min_salary": 120000,
      "job_max_salary": 180000,
      "job_salary_currency": "USD",
      "job_salary_period": "YEAR",
      "job_posted_at_timestamp": 1701868560,
      "job_posted_at_datetime_utc": "2024-12-06T15:29:20Z",
      "job_required_experience": "5+ years",
      "job_required_skills": ["Python", "FastAPI", "PostgreSQL"],
      "job_benefits": ["Health Insurance", "401k", "Remote"],
      ... (30+ total fields)
    },
    { ... more jobs ... }
  ],
  "meta": {
    "page": 1,
    "num_pages": 10,
    "total_results": 150
  }
}

Status Codes:
- 200: Success
- 400: Invalid parameters
- 401: Authentication failed (bad API key)
- 429: Rate limit exceeded
- 500: Server error
```

#### 2. Job Details Endpoint

```
GET /jsearch/job-details
Host: api.openwebninja.com
Authentication: x-api-key: {API_KEY}

Query Parameters:
├── job_id* (required)
│   └── Unique job ID from search results
├── country* (required)
│   └── Country where job is posted
├── language (optional)
│   └── Language code
└── fields (optional)
    └── Comma-separated field names to include

Response Format:
{
  "status": "success",
  "data": [
    {
      "job_id": "abc123xyz",
      "job_title": "Senior Python Developer",
      ... (all 30+ fields with full details)
      "job_description": "Full job description with all details...",
      "job_highlights": {
        "qualifications": ["5+ years Python", "PostgreSQL experience"],
        "responsibilities": ["Lead architecture", "Code review"],
        "benefits": ["Competitive salary", "Remote work"]
      }
    }
  ]
}

Note: Returns array but typically 1 element
```

#### 3. Estimated Salary Endpoint

```
GET /jsearch/estimated-salary
Host: api.openwebninja.com
Authentication: x-api-key: {API_KEY}

Query Parameters:
├── job_title* (required)
│   └── Position title (e.g., "Software Engineer")
├── location* (required)
│   └── City, region, or country name
├── location_type (optional, default: ANY)
│   └── CITY | STATE | COUNTRY | ANY
├── years_of_experience (optional, default: ALL)
│   └── ALL | ENTRY_LEVEL | ENTRY | MID_LEVEL | MID | SENIOR
└── fields (optional)
    └── Comma-separated field names

Response Format:
{
  "status": "success",
  "data": [
    {
      "job_title": "Software Engineer",
      "location": "San Francisco",
      "location_type": "CITY",
      "years_of_experience": "5",
      "salary_period_year": {
        "min_salary": 120000,
        "max_salary": 180000,
        "median_salary": 150000,
        "currency": "USD"
      },
      "salary_period_month": {
        "min_salary": 10000,
        "max_salary": 15000,
        "median_salary": 12500,
        "currency": "USD"
      }
    }
  ]
}
```

#### 4. Company Salary Endpoint

```
GET /jsearch/company-salary
Host: api.openwebninja.com
Authentication: x-api-key: {API_KEY}

Query Parameters:
├── company* (required)
│   └── Company name (e.g., "Microsoft")
├── job_title* (required)
│   └── Position in company
├── location (optional)
│   └── Company location
├── location_type (optional)
│   └── CITY | STATE | COUNTRY
└── years_of_experience (optional)
    └── Experience level

Response Format:
{
  "status": "success",
  "data": [
    {
      "company": "Microsoft",
      "job_title": "Software Engineer",
      "location": "Redmond",
      "salary_period_year": {
        "min_salary": 140000,
        "max_salary": 220000,
        "median_salary": 180000,
        "currency": "USD"
      }
    }
  ]
}
```

---

## Data Models & Validation

### SearchParameters Model

```python
class SearchParameters(BaseModel):
    """Represents search criteria for jobs"""
    
    query: str  # Search keywords (required)
    country: str  # Country code (required)
    employment_types: Optional[str] = None  # FULLTIME|CONTRACTOR|PARTTIME
    work_from_home: Optional[bool] = None  # true|false
    date_posted: Optional[str] = None  # hour|3days|week|month
    page: int = 1  # Pagination (1-based)
    num_pages: int = 10  # Results per page
    language: Optional[str] = None  # Language code
    
    def to_api_params(self) -> Dict[str, Any]:
        """Convert to API endpoint parameters"""
        params = {
            'query': self.query,
            'country': self.country,
            'page': str(self.page),
            'num_pages': str(self.num_pages),
        }
        
        if self.employment_types:
            params['employment_types'] = self.employment_types
        if self.work_from_home is not None:
            params['work_from_home'] = str(self.work_from_home).lower()
        if self.date_posted:
            params['date_posted'] = self.date_posted
        if self.language:
            params['language'] = self.language
        
        return params

# Predefined searches in config/predefined_searches.py:
PREDEFINED_SEARCHES = {
    "2": SearchParameters(
        query="project manager scrum agile",
        country="es",
        employment_types="FULLTIME",
        date_posted="week"
    ),
    "3": SearchParameters(
        query="software engineer",
        country="es",
        employment_types="FULLTIME",
        date_posted="week"
    ),
    # ... 8 more predefined searches
}
```

### Salary Model

```python
class Salary(BaseModel):
    """Represents salary information"""
    
    job_title: str
    location: str
    location_type: str = "ANY"
    min_salary: Optional[float]
    max_salary: Optional[float]
    median_salary: Optional[float]
    currency: str = "USD"
    period: str = "YEAR"  # YEAR|MONTH
    years_of_experience: Optional[str]
```

---

## Rate Limiting & Retry Logic

### Rate Limiting Strategy

**Goal:** Prevent API saturation and respect rate limits

**Implementation:**

```
┌─────────────────────────────────────────────┐
│  RateLimiter Configuration                  │
├─────────────────────────────────────────────┤
│ delay = 1.0 seconds (minimum between calls) │
│ max_retries = 3 (attempts before failure)   │
│ retry_delay = 2 seconds (base backoff)      │
└─────────────────────────────────────────────┘

Timeline of 3 API requests:

Request 1: t=0s
  Wait check: t < last_time + 1s? No
  → Execute immediately
  last_request_time = 0s

Request 2: t=0.3s (user triggers immediately)
  Wait check: 0.3s < 0s + 1s? Yes
  Sleep(0.7s) to enforce 1 second gap
  → Execute at t=1s
  last_request_time = 1s

Request 3: t=1.5s (user triggers)
  Wait check: 0.5s < 1s? Yes
  Sleep(0.5s) to enforce 1 second gap
  → Execute at t=2s
  last_request_time = 2s

Result: Minimum 1 second enforced between all API calls
```

### Exponential Backoff Strategy

**Goal:** Handle transient failures with increasing delays

**Execution Flow:**

```
First Request Attempt:
├─ Time: t=0s
├─ Action: RateLimiter.wait() → no sleep (first call)
├─ Action: Execute API call
└─ Result: Success → return immediately

Example Failure Flow (timeout):
├─ Time: t=0s
├─ Attempt 1:
│  ├─ RateLimiter.wait() → no sleep
│  ├─ Execute: Network timeout
│  └─ Exception caught, retry scheduled
│
├─ Time: t=0s (exception caught)
│  ├─ Calculation: sleep_time = 2 * (2^0) = 2 seconds
│  ├─ Action: Sleep 2 seconds
│  └─ Waiting...
│
├─ Time: t=2s
├─ Attempt 2:
│  ├─ RateLimiter.wait() → check rate limit
│  ├─ Execute: API returns 429 (rate limited)
│  └─ Exception caught, retry scheduled
│
├─ Time: t=2s (exception caught)
│  ├─ Calculation: sleep_time = 2 * (2^1) = 4 seconds
│  ├─ Action: Sleep 4 seconds
│  └─ Waiting...
│
├─ Time: t=6s
└─ Attempt 3:
   ├─ RateLimiter.wait() → check rate limit
   ├─ Execute: Successful response
   └─ Return result

Total time: 6 seconds for 3 attempts
Backoff delays: 2s, then 4s, then success
```

**Pseudocode:**

```python
for attempt in range(max_retries):  # 0, 1, 2
    try:
        self.wait()  # Enforce 1s minimum between requests
        result = api_call()  # Execute request
        return result  # Success
    
    except Exception as e:
        last_exception = e
        
        if attempt < max_retries - 1:  # Not last attempt
            sleep_time = retry_delay * (2 ** attempt)
            # attempt=0: sleep = 2 * 2^0 = 2s
            # attempt=1: sleep = 2 * 2^1 = 4s
            # attempt=2: sleep = 2 * 2^2 = 8s
            
            time.sleep(sleep_time)
        else:
            # Last attempt failed
            raise last_exception
```

---

## Error Handling Strategy

### HTTP Error Handling

```python
# In HTTPClient.get():
if status_code != 200:
    error_msg = data.decode('utf-8', errors='ignore')[:200]
    raise HTTPError(status_code, error_msg)

# Specific error codes:
class HTTPError(Exception):
    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message
        # Examples:
        # HTTPError(400, "Invalid query parameter")
        # HTTPError(401, "API key not valid")
        # HTTPError(429, "Rate limit exceeded")
        # HTTPError(500, "Internal server error")
```

### API Response Error Handling

```python
# In JSearchClient.search_jobs():
response = self.client.get(endpoint, api_params)

if "error" in response:
    raise HTTPError(400, response.get("error"))
    # API returned error in response body
    # Example: {"error": "Invalid country code: xx"}

data = response.get("data", [])
# If no "data" field, returns empty list
```

### Data Validation Error Handling

```python
# In JobService.search_jobs():
for i, job_data in enumerate(raw_results):
    try:
        job = Job.model_validate(job_data)
        jobs.append(job)
    except ValidationError as e:
        logger.warning(f"Error parsing job #{i+1}: {e}")
        # Log error but continue processing
        # Graceful degradation: skip bad jobs, keep good ones
```

### Complete Error Handling Flow

```
User initiates search
  ↓
[Validation] SearchParameters validated
  ✗ Invalid params → ValueError raised
  ✓ Valid params → Continue
  ↓
[Rate Limiting] Check if 1s elapsed since last request
  ✗ Less than 1s → Sleep until ready
  ✓ Ready → Continue
  ↓
[HTTP Request] HTTPS GET to OpenWeb Ninja
  ✗ Network timeout → HTTPError(timeout)
    → Retry with 2s backoff
    → Retry with 4s backoff
    → Max retries exceeded → Raise HTTPError
  ✗ Status 401 → HTTPError(401, "Bad API key")
    → No retry (authentication issue)
    → Raise HTTPError
  ✗ Status 429 → HTTPError(429, "Rate limited")
    → Retry with backoff
    → If continues → Raise HTTPError
  ✓ Status 200 → Continue
  ↓
[JSON Parsing] Parse response body
  ✗ Invalid JSON → JSONDecodeError
    → Raise JSONDecodeError
  ✓ Valid JSON → Continue
  ↓
[API Error Check] Check for error in response
  ✗ "error" field present → HTTPError(400, error_msg)
    → Raise HTTPError
  ✓ No error field → Continue
  ↓
[Data Extraction] Extract "data" array
  ✗ "data" missing → Empty list
  ✓ "data" present → Continue with array
  ↓
[Data Validation] Validate each job with Pydantic
  ✗ Field missing or invalid type → ValidationError
    → Log warning, skip this job
    → Continue with next job
  ✓ Valid job → Add to results
  ↓
[User Display] Format and show results
  ✓ Display validated jobs in table
  ✓ Show job count
  ✓ Offer export options
```

---

## Data Extraction & Processing

### Field Extraction from API Response

**Raw API Response (truncated):**

```json
{
  "data": [
    {
      "job_id": "eyJwbGF0Zm9ybSI6IkxpbmtlZEluIiwicmVxdWlyZW1lbnRzIjoiUHljaG9uIiwicG9zdGluZ19jb21wYW55IjoiR29vZ2xlIn0=",
      "job_title": "Senior Python Developer",
      "employer_name": "Google",
      "employer_logo": "https://logo.url/google.png",
      "job_publisher": "LinkedIn",
      "job_city": "San Francisco",
      "job_state": "CA",
      "job_country": "US",
      "job_latitude": 37.7749,
      "job_longitude": -122.4194,
      "job_is_remote": true,
      "job_employment_type": "FULLTIME",
      "job_description": "We are seeking a Senior Python Developer...",
      "job_apply_link": "https://google.com/careers/apply",
      "job_google_link": "https://google.com/search?q=...",
      "job_min_salary": 160000,
      "job_max_salary": 240000,
      "job_salary_currency": "USD",
      "job_salary_period": "YEAR",
      "job_posted_at_timestamp": 1701868560,
      "job_posted_at_datetime_utc": "2024-12-06T15:29:20Z",
      "job_offer_expiration_timestamp": 1704546960,
      "job_offer_expiration_datetime_utc": "2024-12-31T15:29:20Z",
      "job_required_experience": "10+ years",
      "job_required_skills": ["Python", "FastAPI", "PostgreSQL", "AWS"],
      "job_required_education": "Bachelor's in Computer Science",
      "job_experience_in_place_of_education": false,
      "job_benefits": ["Health Insurance", "401k Match", "Remote Work", "Stock Options"],
      "job_highlights": {
        "Qualifications": ["Python expert", "10+ years"],
        "Responsibilities": ["Lead team", "Architecture"]
      }
    }
  ]
}
```

### Field Mapping & Validation

```
API Field                           → Model Field    → Validation
─────────────────────────────────────────────────────────────
job_id                              → job_id         → Required str
job_title                           → title (alias)  → Required str
employer_name                       → employer_name  → str
employer_logo                       → employer_logo  → Optional[str]
job_publisher                       → job_publisher  → Optional[str]
job_city                            → city (alias)   → str
job_state                           → state (alias)  → str
job_country                         → country (alias)→ str
job_latitude                        → latitude       → Optional[float]
job_longitude                       → longitude      → Optional[float]
job_is_remote                       → is_remote      → bool (default: False)
job_employment_type                 → employment_type→ str
job_description                     → description    → str
job_apply_link                      → apply_link     → str
job_google_link                     → google_link    → Optional[str]
job_min_salary                      → min_salary     → Optional[float]
job_max_salary                      → max_salary     → Optional[float]
job_salary_currency                 → salary_currency→ str (default: USD)
job_salary_period                   → salary_period  → str (YEAR|MONTH)
job_posted_at_timestamp             → posted_at...   → Optional[int]
job_posted_at_datetime_utc          → posted_at...   → Optional[str]
job_offer_expiration_timestamp      → expiration...  → Optional[int]
job_offer_expiration_datetime_utc   → expiration...  → Optional[str]
job_required_experience             → required_...   → Optional[str]
job_required_skills                 → required_...   → List[str]
   (Validator ensures always list)     (can be single str in API)
job_required_education              → required_...   → Optional[str]
job_experience_in_place_of_education→ experience...  → Optional[bool]
job_benefits                        → benefits       → Optional[List[str]]
   (Validator ensures list or None)
job_highlights                      → highlights     → Optional[Dict]
```

### Data Transformation Examples

**Skill Validation:**

```python
# API sends: job_required_skills: "Python"
# Validator converts to: required_skills: ["Python"]

# API sends: job_required_skills: ["Python", "Java"]
# Validator keeps as: required_skills: ["Python", "Java"]

# API sends: job_required_skills: null
# Validator converts to: required_skills: []
```

**Location Formatting:**

```python
# Raw fields:
{
  "city": "San Francisco",
  "state": "CA",
  "country": "US"
}

# Method: get_location()
# Output: "San Francisco, CA, US"

# Handle missing fields:
{
  "city": "Berlin",
  "state": None,
  "country": "Germany"
}
# Output: "Berlin, Germany"
```

**Salary Formatting:**

```python
# Raw fields:
{
  "min_salary": 120000,
  "max_salary": 180000,
  "salary_currency": "USD",
  "salary_period": "YEAR"
}

# Method: get_salary_range()
# Output: "120,000 - 180,000 USD/YEAR"

# Only min salary:
{
  "min_salary": 100000,
  "max_salary": None,
  "salary_currency": "EUR",
  "salary_period": "YEAR"
}
# Output: "100,000+ EUR/YEAR"

# Only max salary:
{
  "min_salary": None,
  "max_salary": 80000,
  "salary_currency": "GBP",
  "salary_period": "MONTH"
}
# Output: "Up to 80,000 GBP/MONTH"
```

**Description Truncation:**

```python
# Raw: "This is a long description with many lines and lots of text..."
# Method: get_short_description(max_length=300)
# Process:
#   1. Clean whitespace: ' '.join(description.split())
#   2. Check length: if > 300 chars, truncate
#   3. Add ellipsis: ... (3 dots)
# Output: "This is a long description with many lines and lots of..."
```

---

## Usage Examples

### Example 1: Basic Custom Search

```python
from src.main import handle_custom_search
from src.api.jsearch_client import JSearchClient
from src.services.job_service import JobService
from src.services.export_service import ExportService
from src.models.search_params import SearchParameters

# Initialize client
api_key = "your_openwebninja_key"
client = JSearchClient(api_key=api_key)
job_service = JobService(api_client=client)
export_service = ExportService()

# Create search parameters
params = SearchParameters(
    query="python developer",
    country="us",
    employment_types="FULLTIME",
    date_posted="week",
    work_from_home=True
)

# Execute search
try:
    jobs = job_service.search_jobs(params)
    print(f"Found {len(jobs)} jobs")
    
    # Display results
    for job in jobs[:5]:
        print(f"- {job.title} at {job.employer_name}")
        print(f"  Location: {job.get_location()}")
        print(f"  Salary: {job.get_salary_range()}")
        
except Exception as e:
    print(f"Error: {e}")
```

### Example 2: Filter and Export Results

```python
# Search for jobs
params = SearchParameters(
    query="software engineer",
    country="us",
    employment_types="FULLTIME",
    date_posted="week"
)
jobs = job_service.search_jobs(params)

# Filter only remote jobs
remote_jobs = job_service.filter_remote_jobs(jobs)
print(f"Remote jobs: {len(remote_jobs)} of {len(jobs)}")

# Filter by minimum salary
high_salary_jobs = job_service.filter_by_salary(remote_jobs, min_salary=150000)

# Sort by salary descending
sorted_jobs = job_service.sort_by_salary(high_salary_jobs, descending=True)

# Export to CSV
csv_path = export_service.export_jobs_to_csv(sorted_jobs, "remote_high_salary")
print(f"Saved to: {csv_path}")

# Also export to JSON
json_path = export_service.export_jobs_to_json(sorted_jobs, "remote_high_salary")
print(f"Saved to: {json_path}")
```

### Example 3: Get Job Details

```python
# From search results, get full details of specific job
job_id = jobs[0].job_id  # "eyJwbGF0Zm9ybSI6IkxpbmtlZEluIiwi..."
country = "us"

try:
    detailed_job = job_service.get_job_details(job_id, country)
    
    print(f"Title: {detailed_job.title}")
    print(f"Company: {detailed_job.employer_name}")
    print(f"Description:\n{detailed_job.description}")
    print(f"Requirements: {', '.join(detailed_job.required_skills)}")
    print(f"Benefits: {', '.join(detailed_job.benefits or [])}")
    
except Exception as e:
    print(f"Error getting details: {e}")
```

### Example 4: Query Salary Information

```python
from src.services.salary_service import SalaryService

salary_service = SalaryService(api_client=client)

# Get estimated salary for position/location
try:
    salary_data = salary_service.get_estimated_salary(
        job_title="Software Engineer",
        location="San Francisco",
        location_type="CITY",
        years_of_experience="MID_LEVEL"
    )
    
    for salary in salary_data:
        print(f"Position: {salary['job_title']}")
        print(f"Location: {salary['location']}")
        print(f"Min Salary: ${salary['salary_period_year']['min_salary']:,}")
        print(f"Max Salary: ${salary['salary_period_year']['max_salary']:,}")
        print(f"Median: ${salary['salary_period_year']['median_salary']:,}")
        
except Exception as e:
    print(f"Error: {e}")
```

---

## Performance Considerations

### API Call Optimization

**Budget Management:**

```
API Limit: Based on subscription tier
Rate Limit: 1 request/second (enforced locally)

Calculation per search:
- 1 API call for search
- If requesting details: +1 API call per job
- If requesting salary: +1 API call

Recommended practice:
- Batch requests when possible
- Cache results locally (not in this tool)
- Use pagination to limit results per call
```

**Response Time:**

```
Typical Timeline (10 jobs):
- Wait for rate limit: 0-1s
- HTTP request: 0.5-2s
- JSON parsing: 0.1s
- Data validation: 0.2s
- Formatting: 0.1s
─────────────────
Total: 1-4 seconds
```

### Memory Usage

```
Memory per job: ~5-10 KB (Python object)
10 jobs: 50-100 KB
100 jobs: 500KB-1MB
1000 jobs: 5-10 MB
```

### Network Bandwidth

```
Request size: ~500 bytes per request
Response size: ~5-10 KB per job
100 jobs: 500KB-1MB download
```

### Optimization Tips

1. **Use pagination:** Request num_pages parameter to control results
2. **Filter early:** Use search filters (employment_type, date_posted) instead of filtering results
3. **Batch details:** Get job details only for promising candidates
4. **Cache results:** Save to CSV/JSON for later reference
5. **Schedule searches:** Run during off-peak hours if possible

---

## Logging

The scraper includes comprehensive logging:

```python
import logging
logger = logging.getLogger(__name__)

# Logs are written to: logs/linkedin_scraper.log

# Log levels:
logger.debug()    # Detailed info for debugging
logger.info()     # General information
logger.warning()  # Warning messages
logger.error()    # Error messages
logger.critical() # Critical errors
```

**Log Examples:**

```
2024-12-08 15:29:20 INFO     JSearchClient inicializado para api.openwebninja.com
2024-12-08 15:29:20 INFO     Buscando trabajos: python developer en us
2024-12-08 15:29:21 INFO     Encontrados 150 trabajos
2024-12-08 15:29:21 INFO     Parsed 148 jobs from 150 results
2024-12-08 15:29:21 WARNING  Error parsing job #3: validation error
2024-12-08 15:29:21 INFO     Filtered 42 remote jobs from 148
2024-12-08 15:29:22 INFO     Saved to: output/python_developer_20241208_152922.csv
```

---

## Summary

LinkedIN-Scraper is a production-grade job aggregation tool that demonstrates:

1. **Robust API Integration:** Secure authentication, proper error handling, retry logic
2. **Data Validation:** Pydantic models ensure data integrity at every step
3. **Rate Limiting:** Prevents API saturation and respects service limits
4. **Error Recovery:** Exponential backoff and graceful degradation
5. **Data Transformation:** Comprehensive field mapping and formatting
6. **Export Capabilities:** Multiple output formats (CSV, JSON)
7. **Rich User Interface:** Professional console display with formatted tables

The architecture can be directly integrated into JobIntel's backend services for job scraping and data normalization.
