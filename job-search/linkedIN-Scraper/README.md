# LinkedIn Job Scraper v3.0

Interactive script for searching LinkedIn job offers through the JSearch API from OpenWeb Ninja. The project uses Pydantic for data validation and Rich for the console interface.

**Author:** Hex686f6c61
**Version:** 3.0.0
**Python:** 3.7+

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Features

This project offers a complete solution for searching and analyzing LinkedIn job offers, with advanced filtering and data export capabilities.

### Job Search

The scraper's main functionality allows for custom and predefined searches with multiple filtering options:

- Interactive menu with 10 predefined searches
- API Key stored securely in .env file
- Export results in CSV and JSON formats
- Search by country (Spain, United States, United Kingdom, etc.)
- Filters by employment type (full-time, part-time, contractor)
- Filters by publication date
- Remote work filters

### Advanced Functions

In addition to basic searches, the system includes advanced features to obtain detailed information:

- Get complete job details by ID
- Query salary ranges by position and location
- Query salaries for specific companies
- Salary comparison by experience level

### System

The scraper is designed with robustness and reliability in mind, implementing multiple protective measures:

- Complete logging with log files
- Automatic rate limiting
- Automatic retries (up to 3 attempts)
- Parameter validation
- 30-second timeout on HTTP requests

## Requirements

To run this project you need to have Python installed and a valid OpenWeb Ninja API Key:

- Python 3.7 or higher
- OpenWeb Ninja API Key ([Get it here](https://www.openwebninja.com/))

## Installation

```bash
# 1. Clone the project
git clone <repository>
cd linkedIN-Jobs-Scrapper

# 2. Configure API key
cp .env.example .env
# Edit .env and add your API_KEY

# 3. Run
./run.sh
```

The `run.sh` script automatically performs the following operations:
- Creates the virtual environment if it doesn't exist
- Installs required dependencies
- Verifies configuration
- Executes the application

## Usage

### Execution

```bash
# Recommended option
./run.sh

# Alternative: manual execution
source venv/bin/activate
python -m src.main
```

### Screenshots

Below are visual examples of the scraper's user interface in operation, showing the different available features:

**Main menu:**

![Main Menu](assets/01%20LinkedIN%20Job%20Scraper%20CLI.png)

**Predefined search - Project Manager:**

![Project Manager Spain](assets/02%20Project%20Manager%20Spain.png)

**Salary query:**

![Software Engineer Salary](assets/03%20Software%20Engineer%20Salario.png)

**Custom search:**

![Custom Search](assets/04%20Busqueda%20personalizada.png)

### Main Menu

When executing the script, the main menu is displayed with the following options:

**Predefined searches:**
1. Custom search
2. Project Manager - Spain
3. Software Engineer - Spain
4. Data Scientist - Spain
5. Frontend Developer - Spain
6. Backend Developer - United States
7. Machine Learning Engineer - United States
8. Full Stack Developer - United States
9. DevOps Engineer - United Kingdom
10. Senior Software Engineer - Global Remote

**Additional functions:**
11. Get job details by ID
12. Query estimated salaries by position
13. Query salaries by specific company

0. Exit

### Custom Search

Option 1 from the menu allows you to create completely customized searches by adjusting each parameter according to your specific needs:

- Search query
- Country code (es, us, gb, etc.)
- Publication period (all, today, 3 days, week, month)
- Remote work filter
- Employment type (FULLTIME, CONTRACTOR, PARTTIME, INTERN)
- Number of pages (1-10)

### Job Details (Option 11)

This function allows you to obtain complete and detailed information about a specific job offer using its unique Job ID. Details include:

- Complete job description
- Requirements (experience, education, skills)
- Benefits
- Application links
- Salary information (if available)
- Publication dates

### Salary Queries (Options 12 and 13)

The system offers two modalities for querying salary information, allowing you to compare ranges according to different criteria:

**Option 12 - Estimated salaries:**

Obtains general market salary estimates for a specific position:

- Job title
- Location
- Years of experience (all, less than 1 year, 1-3, 4-6, 7-9, 10+)

**Option 13 - Salaries by company:**

Queries specific salary information from a particular company:

- Company name
- Job title
- Location (optional)
- Years of experience

## Project Structure

The project follows a well-organized modular architecture that separates responsibilities across different directories:

```
linkedin-job-scraper/
├── src/              # Source code
├── config/           # Predefined searches
├── tests/            # Tests with pytest
├── output/           # Exported results
└── logs/             # Log files
```

## Testing

The project includes a complete test suite with pytest and 100% coverage.

### Running Tests

To run the project's tests, first install the development dependencies and then use pytest with the following options:

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Recommended option: use the automated script
./tests/run_tests.sh

# Alternative: run all tests manually
pytest

# Run with coverage report
pytest --cov=src --cov-report=html

# Run specific tests
pytest tests/test_models/
pytest tests/test_services/
pytest tests/test_api/
pytest tests/test_ui/
```

### Test Structure

Tests are organized in modules that reflect the source code structure, facilitating maintenance and identification of specific tests:

```
tests/
├── conftest.py              # Shared fixtures
├── test_api/                # API layer tests
│   ├── test_client.py
│   ├── test_jsearch_client.py
│   └── test_rate_limiter.py
├── test_models/             # Pydantic models tests
│   ├── test_job.py
│   ├── test_salary.py
│   └── test_search_params.py
├── test_services/           # Services tests
│   ├── test_job_service.py
│   ├── test_salary_service.py
│   └── test_export_service.py
├── test_ui/                 # Interface tests
│   ├── test_console.py
│   ├── test_formatters.py
│   ├── test_menu.py
│   └── test_prompts.py
└── test_utils/              # Utility tests
    ├── test_config.py
    ├── test_file_utils.py
    └── test_logger.py
```

### Coverage Statistics

The project maintains 100% code coverage in all testable modules, guaranteeing code quality and reliability:

- Total tests: 291
- Code coverage: 100% (excluding main.py)
- Lines covered: 805/805
- All modules with complete coverage

## Available Parameters

Below are the parameters you can use to customize your searches and filter results according to your needs.

### Country Codes

The API supports searches in multiple countries using two-letter ISO codes:

| Code | Country |
|------|---------|
| es | Spain |
| us | United States |
| gb | United Kingdom |
| de | Germany |
| fr | France |
| nl | Netherlands |
| ca | Canada |
| au | Australia |
| mx | Mexico |
| ar | Argentina |
| co | Colombia |
| cl | Chile |

### Employment Types

You can filter offers according to the type of contract you are interested in:

- FULLTIME: Full-time
- CONTRACTOR: Contractor
- PARTTIME: Part-time
- INTERN: Internship

### Publication Periods

Filter offers based on when they were published to get more recent results:

- all: All
- today: Today
- 3days: Last 3 days
- week: Last week
- month: Last month

## Output File Structure

The system automatically exports search results in CSV and JSON formats, facilitating further data analysis.

### Naming Format

Files are automatically saved in the `output/` directory with the following format:

```
{query}_{timestamp}.{format}
```

Each file includes the query performed and a timestamp to prevent overwrites. Real examples of generated files:

```
output/project_manager_scrum_agile_20251208_140810.csv
output/python_developer_spain_20251208_141212.csv
output/python_developer_spain_20251208_141213.json
output/salary_Software_Engineer_20251208_140922.json
```

### CSV Files

CSV files are ideal for analysis in spreadsheets or Business Intelligence tools. They include the following columns:

- job_id: Unique job identifier
- job_title: Job title
- employer_name: Company name
- job_city, job_state, job_country: Location
- job_is_remote: Remote work indicator
- job_employment_type: Employment type (FULLTIME, PARTTIME, etc.)
- job_min_salary, job_max_salary: Salary range
- job_salary_currency, job_salary_period: Salary currency and period
- job_description: Complete job description
- job_apply_link: URL to apply
- job_posted_at_datetime: Publication date

Example CSV content:

```csv
job_id,job_title,employer_name,job_city,job_country,job_is_remote,job_employment_type
abc123,Senior Python Developer,Tech Corp,Madrid,Spain,False,FULLTIME
```

### JSON Files

JSON files provide a richer and nested data structure, ideal for programmatic processing. They contain the same information as CSVs but with better readability and support for complex structures:

```json
[
  {
    "job_id": "abc123xyz",
    "title": "Senior Python Developer",
    "employer_name": "Tech Corp",
    "city": "Madrid",
    "country": "Spain",
    "is_remote": false,
    "employment_type": "FULLTIME",
    "min_salary": 45000.0,
    "max_salary": 65000.0,
    "salary_currency": "EUR",
    "salary_period": "YEAR",
    "description": "We are looking for a Senior Python developer...",
    "apply_link": "https://example.com/apply",
    "posted_at_datetime": "2025-12-08T10:00:00Z"
  }
]
```

### Salary Files

Salary information queries are exported exclusively in JSON format, including aggregated data from multiple sources:

```json
[
  {
    "job_title": "Software Engineer",
    "location": "Madrid, Spain",
    "publisher_name": "Glassdoor",
    "min_salary": 35000.0,
    "max_salary": 65000.0,
    "median_salary": 50000.0,
    "salary_currency": "EUR",
    "salary_period": "YEAR"
  }
]
```

## Troubleshooting

Below are the most common errors and their solutions to facilitate problem resolution.

### Error: "API Key not configured"

This error indicates that the .env file is not configured correctly. Verify that the .env file exists and contains the API key:

```bash
ls -la .env
cat .env
```

Make sure there are no extra spaces in the configuration.

### Error: "No module named 'pydantic_settings'"

This error indicates that dependencies are missing and need to be installed. Run the following commands:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Error: "No jobs found"

If no results are found, you can try the following solutions:

- Use a more general search
- Verify the country code
- Try with a broader time period
- Some countries have fewer available offers

### Connection or timeout error

Connection errors can be due to several factors. Check the following:

- Verify internet connection
- Confirm that the API key is valid
- Review plan limits on OpenWeb Ninja
- Try with fewer pages

### API Limits

The system implements protective measures to avoid exceeding API limits:

- The system implements automatic 1-second wait between requests
- Automatic retries: 3 attempts by default
- Multi-page searches consume more credits

## Security

It is important to maintain the security of your API key and sensitive data by following these recommendations:

- Do not upload the .env file to Git
- Do not share the API key publicly
- The .gitignore file protects sensitive files

## Notes

Please keep the following considerations in mind when using the scraper:

- Results depend on what Google Jobs indexes
- Not all jobs include salary information
- Remote work information may not be accurate
- Some jobs may appear in multiple searches

## License

Free for educational and personal use.
