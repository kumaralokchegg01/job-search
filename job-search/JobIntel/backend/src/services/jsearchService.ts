/**
 * JSearch API Service
 * Integrates with OpenWeb Ninja JSearch API for real job data
 * Replaces simulated Math.random() with actual API calls
 * 
 * Enhanced with:
 * - Multi-page scraping (up to 100+ pages)
 * - Multi-country job filtering with location detection
 * - Proper pagination support
 * - Rate limiting and exponential backoff
 */

import fetch from 'node-fetch';
import { logger } from '../utils/logger';

export interface JobSearchParams {
  query: string;
  location?: string;
  country?: string;
  numPages?: number;
  pageSize?: number;
  page?: number;
}

export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryPeriod?: string;
  jobType?: string;
  postedDate?: string;
  externalLink?: string;
  jobId?: string;
  source: string;
  rawData?: any;
  isRemote?: boolean;
}

// Country-specific locations and keywords for filtering
const COUNTRY_LOCATIONS: { [key: string]: string[] } = {
  'in': [ // India
    'bangalore', 'bengaluru', 'mumbai', 'delhi', 'gurgaon', 'gurugram',
    'pune', 'hyderabad', 'kolkata', 'chennai', 'jaipur', 'lucknow', 'ahmedabad',
    'chandigarh', 'indore', 'bhopal', 'visakhapatnam', 'kochi', 'vadodara',
    'surat', 'nagpur', 'coimbatore', 'ghaziabad', 'ludhiana', 'noida', 'faridabad',
    'trivandrum', 'thiruvananthapuram', 'kottayam', 'thrissur', 'ernakulam',
    'kozhikode', 'kannur', 'palakkad', 'malappuram', 'pathanamthitta',
  ],
  'us': [ // United States
    'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
    'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
    'fort worth', 'columbus', 'indianapolis', 'charlotte', 'san francisco',
    'seattle', 'denver', 'boston', 'el paso', 'detroit', 'nashville', 'portland',
    'memphis', 'oklahoma city', 'las vegas', 'louisville', 'baltimore', 'milwaukee',
    'albuquerque', 'tucson', 'fresno', 'mesa', 'sacramento', 'atlanta', 'kansas city',
    'colorado springs', 'miami', 'raleigh', 'omaha', 'long beach', 'virginia beach',
    'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans',
  ],
  'uk': [ // United Kingdom
    'london', 'birmingham', 'manchester', 'leeds', 'glasgow', 'newcastle',
    'sheffield', 'liverpool', 'bristol', 'nottingham', 'leicester', 'brighton',
    'plymouth', 'southampton', 'reading', 'derby', 'dundee', 'cardiff', 'edinburgh',
    'belfast', 'oxford', 'cambridge', 'york', 'bath', 'norwich', 'portsmouth',
  ],
  'ca': [ // Canada
    'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa',
    'winnipeg', 'quebec city', 'hamilton', 'kitchener', 'london', 'halifax',
    'victoria', 'saskatoon', 'regina', 'sherbrooke', 'kelowna', 'abbotsford',
    'sudbury', 'kingston', 'sault ste marie', 'thunder bay', 'north bay',
  ],
  'au': [ // Australia
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold coast',
    'canberra', 'newcastle', 'wollongong', 'logan', 'geelong', 'hobart',
    'townsville', 'cairns', 'darwin', 'toowoomba', 'ballarat', 'bendigo',
  ],
  'de': [ // Germany
    'berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'stuttgart',
    'düsseldorf', 'dortmund', 'essen', 'leipzig', 'bremen', 'dresden',
    'hanover', 'nuremberg', 'duisburg', 'bochum', 'wuppertal', 'bielefeld',
  ],
  'fr': [ // France
    'paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'strasbourg',
    'montpellier', 'bordeaux', 'lille', 'rennes', 'reims', 'le havre', 'saint-etienne',
    'toulon', 'grenoble', 'dijon', 'angers', 'nîmes', 'villeurbanne',
  ],
  'nl': [ // Netherlands
    'amsterdam', 'rotterdam', 'the hague', 'utrecht', 'eindhoven', 'tilburg',
    'groningen', 'almere', 'breda', 'nijmegen', 'enschede', 'haarlem', 'arnhem',
    'amersfoort', 'zwolle', 'zoetermeer', 'den haag', 'apeldoorn', 'heerlen',
  ],
  'sg': [ // Singapore
    'singapore', 'jurong', 'tampines', 'yishun', 'bedok', 'woodlands', 'ang mo kio',
    'hougang', 'choa chu kang', 'sengkang', 'punggol', 'bukit batok', 'bukit panjang',
  ],
  'es': [ // Spain
    'madrid', 'barcelona', 'valencia', 'seville', 'zaragoza', 'málaga', 'murcia',
    'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'valladolid', 'vigo',
    'gijón', 'hospitalet de llobregat', 'la coruña', 'granada', 'vitoria-gasteiz',
  ],
};

const COUNTRY_STATE_CODES: { [key: string]: string[] } = {
  'in': ['in', 'in-ka', 'in-tn', 'in-mh', 'in-dl', 'in-hr', 'in-up', 'in-ap', 'in-jk', 'in-hp', 'in-pb', 'in-gj'],
  'us': ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'],
  'uk': ['england', 'scotland', 'wales', 'northern ireland'],
  'ca': ['on', 'qc', 'bc', 'ab', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'yt', 'nu'],
  'au': ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'],
  'de': ['bw', 'by', 'be', 'bb', 'hb', 'hh', 'he', 'mv', 'ni', 'nw', 'rp', 'sl', 'sn', 'st', 'sh', 'th'],
  'fr': ['ara', 'bfc', 'bre', 'cvl', 'cor', 'ges', 'hdf', 'idf', 'nor', 'nau', 'occ', 'pac', 'pdl'],
  'nl': ['dr', 'fl', 'fr', 'ge', 'gr', 'li', 'nb', 'nh', 'ov', 'ut', 'ze', 'zh'],
  'sg': ['central', 'north', 'north-east', 'east', 'west'],
  'es': ['an', 'ar', 'as', 'ib', 'cn', 'cb', 'cl', 'cm', 'ct', 'ce', 'ga', 'ri', 'md', 'mc', 'nc', 'pv', 'vc'],
};

// US state exclusions (to avoid false positives when filtering for other countries)
const EXCLUDE_US_STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'hampshire', 'jersey', 'mexico', 'york', 'carolina', 'dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode', 'south', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'wisconsin', 'wyoming'];

function isLocationInCountry(targetCountryIso: string, location: string, city?: string, state?: string, country?: string): boolean {
  if (!location && !city && !state && !country) return false;
  
  const locLower = location?.toLowerCase() || '';
  const fullLocation = [city, state, country].filter(Boolean).join(' ').toLowerCase();
  const targetCountryLower = targetCountryIso.toLowerCase();
  
  // STRICT: If country is explicitly mentioned and it doesn't match target country, reject immediately
  if (country) {
    const countryLower = country.toLowerCase().trim();
    
    // Check for exact country match
    if (countryLower === targetCountryLower || 
        countryLower === targetCountryIso ||
        (targetCountryIso === 'in' && (countryLower === 'india' || countryLower.startsWith('in-') || countryLower === 'in,')) ||
        (targetCountryIso === 'us' && (countryLower === 'united states' || countryLower === 'usa' || countryLower === 'us,' || countryLower === 'u.s.')) ||
        (targetCountryIso === 'uk' && (countryLower === 'united kingdom' || countryLower === 'uk,' || countryLower === 'great britain')) ||
        (targetCountryIso === 'ca' && (countryLower === 'canada' || countryLower === 'ca,')) ||
        (targetCountryIso === 'au' && (countryLower === 'australia' || countryLower === 'au,')) ||
        (targetCountryIso === 'de' && (countryLower === 'germany' || countryLower === 'deutschland' || countryLower === 'de,')) ||
        (targetCountryIso === 'fr' && (countryLower === 'france' || countryLower === 'fr,')) ||
        (targetCountryIso === 'nl' && (countryLower === 'netherlands' || countryLower === 'holland' || countryLower === 'nl,')) ||
        (targetCountryIso === 'sg' && (countryLower === 'singapore' || countryLower === 'sg,')) ||
        (targetCountryIso === 'es' && (countryLower === 'spain' || countryLower === 'españa' || countryLower === 'es,'))) {
      return true;
    }
    
    // If country is explicitly set and doesn't match, reject
    return false;
  }
  
  // For US filtering, exclude US state names to avoid false positives
  if (targetCountryIso !== 'us') {
    for (const usState of EXCLUDE_US_STATES) {
      if (locLower.includes(`, ${usState}`) || locLower.includes(`, ${usState.toUpperCase()}`) || locLower.endsWith(`, ${usState}`)) {
        return false;
      }
    }
  }
  
  // Check country-specific state codes  
  const stateCodes = COUNTRY_STATE_CODES[targetCountryIso] || [];
  for (const stateCode of stateCodes) {
    if (locLower.includes(stateCode) || fullLocation.includes(stateCode)) {
      return true;
    }
  }
  
  // Check country-specific city names (exact word match, not substring)
  const cities = COUNTRY_LOCATIONS[targetCountryIso] || [];
  for (const cityName of cities) {
    const pattern = new RegExp(`(^|\\s|,)${cityName}(\\s|,|$)`, 'i');
    if (pattern.test(locLower) || pattern.test(fullLocation)) {
      return true;
    }
  }
  
  // Check for explicit country name in location string
  const countryNames = {
    'in': ['india'],
    'us': ['united states', 'usa', 'america'],
    'uk': ['united kingdom', 'uk', 'britain', 'england', 'scotland', 'wales'],
    'ca': ['canada'],
    'au': ['australia'],
    'de': ['germany', 'deutschland'],
    'fr': ['france'],
    'nl': ['netherlands', 'holland'],
    'sg': ['singapore'],
    'es': ['spain', 'españa']
  };
  
  const countryKeywords = countryNames[targetCountryIso as keyof typeof countryNames] || [];
  for (const keyword of countryKeywords) {
    if (locLower.includes(`, ${keyword}`) || locLower.endsWith(`, ${keyword}`) || 
        locLower === keyword || fullLocation === keyword) {
      return true;
    }
  }
  
  // Default: if no specific location info but we're targeting this country, accept it
  // This handles cases where location data is incomplete
  return false;
}

class JSearchService {
  private apiKey: string;
  private apiHost: string;
  private baseUrl: string;
  private requestDelay: number;
  private maxRetries: number;
  private debugLogCount = 0; // Track first API response logged

  constructor() {
    this.apiKey = process.env.OPENWEBNINJA_API_KEY || process.env.API_KEY || '';
    this.apiHost = process.env.API_HOST || 'api.openwebninja.com';
    this.baseUrl = `https://${this.apiHost}`;
    this.requestDelay = parseInt(process.env.API_REQUEST_DELAY_MS || '1000');
    this.maxRetries = parseInt(process.env.API_RETRY_ATTEMPTS || '3');

    if (!this.apiKey) {
      logger.warn('⚠️  JSearch API Key not configured. Scraping will use fallback data.');
    }
  }

  /**
   * Search jobs using JSearch API with multi-page support
   * Implements rate limiting and retry logic
   * Supports multi-country job filtering
   */
  async searchJobs(params: JobSearchParams): Promise<ParsedJob[]> {
    try {
      logger.info(`🔍 Searching jobs: ${params.query} in ${params.location || 'All locations'}`);
      logger.info(`🔑 API Key Status: ${this.apiKey ? '✅ LOADED' : '❌ NOT LOADED'}`);
      if (this.apiKey) {
        logger.info(`🔐 API Key (first 20 chars): ${this.apiKey.substring(0, 20)}...`);
        logger.info(`🌐 API Host: ${this.apiHost}`);
      }

      const jobs: ParsedJob[] = [];

      // If no API key, fall back to simulated data
      if (!this.apiKey) {
        logger.error('❌ CRITICAL: No API key found in environment variables!');
        logger.error('   Checked: OPENWEBNINJA_API_KEY, API_KEY');
        logger.warn('📊 Using fallback simulated data (no API key configured)');
        return this.generateFallbackJobs(params);
      }

      // Multi-page scraping support (default: up to 5 pages, can be increased to 20-100)
      const numPages = params.numPages || 5;
      const pageSize = params.pageSize || 50;
      
      logger.info(`📄 Fetching up to ${numPages} pages with ${pageSize} jobs per page`);
      logger.info(`� Multi-Country Job Filter Enabled: YES - Will only keep jobs from ${params.country?.toUpperCase() || 'IN'}`);

      for (let page = 1; page <= numPages; page++) {
        try {
          logger.debug(`📖 Fetching page ${page}/${numPages}...`);
          logger.debug(`   Query: "${params.query}"`);
          logger.debug(`   Location: "${params.location || 'All'}"`);

          // Make API request for this page with retry logic
          // Now using proper ISO country codes (from LinkedIn scraper logic)
          const requestParams = {
            query: params.query,
            country: params.country,  // Send ISO country code (e.g., 'in' for India)
            page: page,
            num_pages: 1,
            page_size: pageSize,
          };
          
          logger.info(`🔹 REQUEST PARAMS being sent to API: ${JSON.stringify(requestParams)}`);
          logger.info(`📌 STRATEGY: Using ISO country code "${params.country}" for targeted search`);
          
          const response = await this.makeRequestWithRetry('search', requestParams);

          if (response && response.data) {
            const apiJobs = Array.isArray(response.data) ? response.data : response.data.jobs || [];
            logger.debug(`   Response received: ${apiJobs.length} jobs on page ${page}`);

            if (apiJobs.length === 0) {
              logger.info(`✅ No more jobs found on page ${page}, stopping pagination`);
              break;
            }

            let countryJobsCount = 0;
            for (const job of apiJobs) {
              const parsed = this.parseJobData(job);
              if (parsed) {
                // DEBUG: Log every job location
                logger.debug(`   Job: "${parsed.title}" | Location: "${parsed.location}" | City: "${parsed.city}" | State: "${parsed.state}" | Country: "${parsed.country}"`);
                
                // Filter to only jobs in the target country
                if (isLocationInCountry(params.country || 'in', parsed.location, parsed.city, parsed.state, parsed.country)) {
                  jobs.push(parsed);
                  countryJobsCount++;
                  logger.debug(`   ✅ ACCEPTED ${params.country || 'in'} job: ${parsed.title} at ${parsed.company} (${parsed.location})`);
                } else {
                  logger.debug(`   ❌ REJECTED non-${params.country || 'in'}: ${parsed.title} (${parsed.location})`);
                }
              }
            }

            logger.info(`✅ Page ${page}: Found ${apiJobs.length} jobs, kept ${countryJobsCount} ${params.country?.toUpperCase() || 'IN'} (Total: ${jobs.length})`);

            // Rate limiting between pages
            await this.delay(this.requestDelay * 2);
          } else {
            logger.warn(`⚠️  Empty response for page ${page}`);
            break;
          }
        } catch (pageError: any) {
          logger.warn(`⚠️  Error fetching page ${page}: ${pageError?.message || pageError}`);
          if (page === 1) {
            // If first page fails, fall back to simulated data
            logger.warn('⚠️  First page failed, using fallback data');
            return this.generateFallbackJobs(params);
          }
          // For subsequent pages, just stop pagination
          break;
        }
      }

      if (jobs.length === 0) {
        logger.warn('⚠️  No jobs returned from API for target country, using fallback data');
        return this.generateFallbackJobs(params);
      }

      logger.info(`✅ Successfully scraped ${jobs.length} jobs from ${params.country?.toUpperCase() || 'IN'} via JSearch API`);
      logger.info(`✅ Source: Real JSearch API data (NOT FALLBACK)`);
      return jobs;
    } catch (error: any) {
      logger.error(`❌ Error searching jobs: ${error?.message || error}`);
      if (error?.stack) logger.error(`Error stack: ${error.stack}`);
      // Fallback to simulated data on error
      logger.warn('⚠️  Falling back to simulated data due to API error');
      return this.generateFallbackJobs(params);
    }
  }

  /**
   * Get detailed information for a specific job
   */
  async getJobDetails(jobId: string): Promise<ParsedJob | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await this.makeRequestWithRetry('job_details', {
        job_id: jobId,
        country: 'US',
      });

      if (response && response.data) {
        const jobData = Array.isArray(response.data) ? response.data[0] : response.data;
        return this.parseJobData(jobData);
      }

      return null;
    } catch (error) {
      logger.error(`❌ Error getting job details: ${error}`);
      return null;
    }
  }

  /**
   * Get salary estimates for a job title
   */
  async getSalaryEstimate(jobTitle: string, location: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return this.generateFallbackSalary(jobTitle);
      }

      const response = await this.makeRequestWithRetry('salary_estimate', {
        job_title: jobTitle,
        location: location,
        location_type: 'ANY',
        years_of_experience: 'ALL',
      });

      return response?.data || this.generateFallbackSalary(jobTitle);
    } catch (error) {
      logger.error(`❌ Error getting salary estimate: ${error}`);
      return this.generateFallbackSalary(jobTitle);
    }
  }

  /**
   * Make HTTP request to JSearch API with retry logic
   */
  private async makeRequestWithRetry(endpoint: string, params: any, retryCount = 0): Promise<any> {
    try {
      // Rate limiting
      await this.delay(this.requestDelay);

      const url = new URL(`${this.baseUrl}/jsearch/${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      logger.info(`📡 MAKING API REQUEST:`);
      logger.info(`   Endpoint: ${endpoint}`);
      logger.info(`   URL: ${url.toString().substring(0, 150)}...`);
      logger.info(`   API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 10)}`);
      logger.info(`   Params: ${JSON.stringify(params)}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        timeout: 30000,
      } as any);

      logger.info(`   Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`   ❌ HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`   ✅ API Response received: ${JSON.stringify(data).substring(0, 200)}...`);
      
      // DEBUG: Log the jobs array from API
      const apiJobs = (data as any).data || [];
      logger.info(`🔍 API RESPONSE: Status="${(data as any).status}" | Total Jobs in Array: ${apiJobs.length}`);
      if (apiJobs.length > 0) {
        logger.info(`📊 First job from API: ${JSON.stringify(apiJobs[0]).substring(0, 300)}`);
      } else {
        logger.warn(`⚠️  API returned 0 jobs! Full response: ${JSON.stringify(data)}`);
      }

      if ((data as any).error) {
        logger.error(`   ❌ API Error: ${(data as any).error}`);
        throw new Error((data as any).error);
      }

      logger.info(`✅ API Call successful!`);
      return data;
    } catch (error: any) {
      if (retryCount < this.maxRetries) {
        logger.warn(`⚠️  API Error (attempt ${retryCount + 1}/${this.maxRetries}): ${error?.message}`);
        logger.warn(`   Retrying after ${2000 * (retryCount + 1)}ms with exponential backoff...`);
        await this.delay(2000 * (retryCount + 1)); // Exponential backoff
        return this.makeRequestWithRetry(endpoint, params, retryCount + 1);
      }
      logger.error(`❌ API Request failed after ${this.maxRetries} retries: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Parse raw job data from API into standardized format
   * Using OpenWeb Ninja JSearch API field names (based on LinkedIn scraper reference)
   * Includes multi-country job detection and location validation
   */
  private parseJobData(jobData: any): ParsedJob | null {
    try {
      if (!jobData) return null;

      // DEBUG: Log raw API response structure (first job only)
      if (this.debugLogCount === 0) {
        logger.info(`🔍 RAW API Job Structure (First): ${JSON.stringify(jobData).substring(0, 600)}`);
        logger.info(`🔑 All available fields in API response: ${Object.keys(jobData).join(', ')}`);
        this.debugLogCount++;
      }

      // Extract location fields separately for better control
      let city = jobData.job_city || jobData.city || '';
      let state = jobData.job_state || jobData.state || '';
      let country = jobData.job_country || jobData.country || '';
      
      // Log what fields we found
      logger.info(`📌 API Fields - job_city: "${jobData.job_city}" | job_state: "${jobData.job_state}" | job_country: "${jobData.job_country}" | job_location: "${jobData.job_location}"`);
      
      // If we have a raw location string, parse it to extract city, state, country
      let rawLocation = jobData.job_location || '';
      if (rawLocation && !city && !state) {
        // Try to parse raw location like "Indiana, US" or "San Francisco, CA, US"
        const parts = rawLocation.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          // Assume last part is country
          country = country || parts[parts.length - 1];
          // Second to last is state
          state = state || parts[parts.length - 2];
          // Everything else is city
          city = city || parts.slice(0, -2).join(', ');
        } else if (parts.length === 1) {
          // Single part could be city or state
          city = city || parts[0];
        }
      }
      
      // Build the display location string with city and state
      const locationParts = [];
      if (city) locationParts.push(city);
      if (state) locationParts.push(state);
      if (country) locationParts.push(country);
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'Remote';
      
      // DEBUG: Log extracted location for each job
      logger.info(`   📍 Extracted: city="${city}" | state="${state}" | country="${country}" | FINAL="${location}"`);

      // Extract company name - be more aggressive in finding it
      let companyName = '';
      
      // Try multiple possible fields for company name
      const possibleCompanyFields = [
        'employer_name',
        'company', 
        'employer',
        'job_publisher',
        'employer_name_simple',
        'publisher_name',
        'hiring_company',
        'job_company',
        'business_name',
        'employer_company',
        'company_name'
      ];
      
      for (const field of possibleCompanyFields) {
        if (jobData[field] && typeof jobData[field] === 'string' && jobData[field].trim()) {
          companyName = jobData[field].trim();
          logger.debug(`   🏢 Found company in field '${field}': "${companyName}"`);
          break;
        }
      }
      
      // Validate company name - filter out obvious test values or invalid names
      const invalidCompanyPatterns = [
        /^test/i,
        /^example/i,
        /^unknown$/i,
        /^bebe/i,  // Specific case mentioned by user
        /^[a-z]{1,2}$/,  // Too short
        /^.{50,}$/,  // Too long
        /^\d+$/,  // Only numbers
        /^http/i,  // URLs
        /^confidential$/i,  // Hidden companies
        /^private$/i,  // Private listings
      ];
      
      const isValidCompany = companyName && !invalidCompanyPatterns.some(pattern => pattern.test(companyName));
      
      if (!isValidCompany) {
        logger.debug(`   ⚠️ Invalid company name detected: "${companyName}" - trying to extract from title/description`);
        companyName = '';
      }
      // If company name is still invalid, try to extract from title and description
      if (!companyName) {
        // Try to extract from job title (e.g., "Senior Developer at Google")
        if (jobData.job_title) {
          const titleMatch = jobData.job_title.match(/(?:at|for|with|@)\s+([A-Z][A-Za-z\s&,\.]+?)(?:\s|$)/i);
          if (titleMatch && titleMatch[1]) {
            companyName = titleMatch[1].trim();
            logger.debug(`   🏢 Extracted company from title: "${companyName}"`);
          }
        }
        
        // Try to extract from description
        if (!companyName && jobData.job_description) {
          const descMatch = jobData.job_description.match(/(?:At|About|Join|For|Working at|Company:|Employer:) ([A-Z][A-Za-z\s&,\.]+?)(?:\,|\.|\s(?:is|we|are|has|offers))/);
          if (descMatch && descMatch[1]) {
            companyName = descMatch[1].trim();
            logger.debug(`   🏢 Extracted company from description: "${companyName}"`);
          }
        }
      }
      
      // Final fallback
      if (!companyName) {
        companyName = 'Unknown Company';
        logger.debug(`   ⚠️ No valid company name found, using fallback`);
      }
      
      // Trim whitespace and remove quotes
      companyName = companyName.trim().replace(/^["']|["']$/g, '');

      // Handle various API response formats - prioritize real JSearch API fields
      // IMPORTANT: Use the actual apply link from the API
      const applyLink = jobData.job_apply_link || jobData.apply_link || jobData.job_url || jobData.google_link || jobData.link || '';
      
      const parsed: ParsedJob = {
        title: jobData.job_title || jobData.title || 'Untitled',
        company: companyName || 'Unknown Company',
        location,
        city,
        state,
        country,
        description: jobData.job_description || jobData.description || '',
        minSalary: jobData.job_min_salary || jobData.min_salary || jobData.minSalary,
        maxSalary: jobData.job_max_salary || jobData.max_salary || jobData.maxSalary,
        salaryPeriod: jobData.job_salary_period || jobData.salary_period || 'YEARLY',
        jobType: jobData.job_employment_type || jobData.jobType || 'Full-time',
        postedDate: jobData.job_posted_at_datetime_utc || jobData.job_posted_at_timestamp || jobData.posted_date,
        externalLink: applyLink,
        jobId: jobData.job_id || jobData.id,
        source: applyLink && !applyLink.includes('example.com') ? 'JSearch API' : 'Fallback Data',
        isRemote: jobData.job_is_remote || jobData.is_remote || location.toLowerCase().includes('remote'),
        rawData: jobData,
      };

      // Log parsed job for debugging
      if (parsed.source === 'JSearch API') {
        logger.debug(`✅ Parsed real API job: "${parsed.title}" from ${parsed.company} (${parsed.location})`);
      } else {
        logger.debug(`⚠️  Parsed fallback job: "${parsed.title}" (likely fake apply link: ${parsed.externalLink})`);
      }

      return parsed;
    } catch (error) {
      logger.warn(`⚠️  Error parsing job data: ${error}`);
      return null;
    }
  }

  /**
   * Filter jobs to only locations in the specified country
   * Used during scraping to collect country-specific jobs
   */
  filterJobsByCountry(jobs: ParsedJob[], targetCountryIso: string = 'in'): ParsedJob[] {
    const filteredJobs = jobs.filter(job => 
      isLocationInCountry(targetCountryIso, job.location, job.city, job.state, job.country)
    );

    logger.info(`🌍 Filtered: ${filteredJobs.length}/${jobs.length} jobs are in ${targetCountryIso.toUpperCase()}`);
    return filteredJobs;
  }

  /**
   * Get statistics about job locations
   */
  getLocationStats(jobs: ParsedJob[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const job of jobs) {
      const country = job.country || 'Unknown';
      stats[country] = (stats[country] || 0) + 1;
    }

    return stats;
  }

  /**
   * Generate fallback job data when API is unavailable
   * Uses realistic job titles and companies
   */
  private generateFallbackJobs(params: JobSearchParams): ParsedJob[] {
    const companies = [
      'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Netflix',
      'Uber', 'Airbnb', 'Tesla', 'SpaceX', 'Meta', 'LinkedIn',
      'Adobe', 'Salesforce', 'Cisco', 'Intel', 'Oracle', 'IBM',
      'GitHub', 'Stripe', 'Figma', 'Slack', 'Zoom', 'Notion',
    ];

    const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote'];

    const jobTypes = ['Full-time', 'Contract', 'Part-time'];

    const jobs: ParsedJob[] = [];
    const count = Math.floor(Math.random() * 30) + 20; // 20-50 jobs

    for (let i = 0; i < count; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      jobs.push({
        title: `${params.query} - Level ${Math.floor(Math.random() * 3) + 1}`,
        company,
        location,
        description: `${params.query} position at ${company}. We are looking for experienced professionals...`,
        minSalary: 80000 + Math.floor(Math.random() * 100000),
        maxSalary: 150000 + Math.floor(Math.random() * 100000),
        salaryPeriod: 'YEARLY',
        jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
        postedDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        externalLink: `https://example.com/jobs/${i}`,
        jobId: `job_${Date.now()}_${i}`,
        source: 'Fallback Data',
      });
    }

    return jobs;
  }

  /**
   * Generate fallback salary data
   */
  private generateFallbackSalary(jobTitle: string): any {
    const baseRanges: any = {
      'developer': { min: 80000, max: 180000 },
      'engineer': { min: 90000, max: 200000 },
      'manager': { min: 100000, max: 250000 },
      'analyst': { min: 70000, max: 150000 },
      'designer': { min: 75000, max: 160000 },
      'default': { min: 60000, max: 120000 },
    };

    const keyword = jobTitle.toLowerCase();
    let range = baseRanges.default;

    for (const [key, value] of Object.entries(baseRanges)) {
      if (keyword.includes(key)) {
        range = value as any;
        break;
      }
    }

    return {
      job_title: jobTitle,
      min_salary: range.min,
      max_salary: range.max,
      salary_period: 'YEARLY',
      currency: 'USD',
    };
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const jsearchService = new JSearchService();
