# Changelog

All notable changes to this project are documented in this file.

## [3.0.0] - 2025-12-08

### COMPLETE REFACTORING

**Breaking Changes**:
- Completely new structure organized in directories (src/)
- Requires Python 3.7+ (previously 3.6+)
- New dependencies: Pydantic 2.x, Rich 13.x, pydantic-settings 2.x
- Main file replaced: use `./run.sh` or `python -m src.main`
- Automatic installation with `./run.sh`

**Added**:
- **Rich UI**: Colored tables, panels, progress bars and spinners
- **Pydantic Models**: Automatic data validation with Job, SalaryInfo and SearchParameters
- **Organized Code**: Approximately 30 files organized in src/ (api/, models/, services/, ui/, utils/)
- **Testing System**: Tests with pytest, fixtures and coverage target above 80%
- **Simplified Installation**: Script `./run.sh` configures everything automatically
- **Improved Logging**: Logging system without duplicates with Rich
- **Full Type Hints**: Better IDE support and mypy
- **Interactive Prompts**: Input validation with Rich Prompt

**Improved**:
- **Shorter Code**: Code duplication eliminated (approximately 200 lines)
- **Separation of Concerns**: Each module smaller than 300 lines
- **Easy Maintenance**: One file per responsibility
- **Testable**: Each component independently testable
- **Better Documentation**: Complete docstrings in all modules
- **Better UX**: Visual interface, spinners, interactive confirmations

**Migration from v2.x**:
1. Configure .env file with your API_KEY
2. Run: `./run.sh` (automatically installs dependencies)
3. Old file was deleted (no longer needed)

---

## [2.0.0] - 2025-12-08

### Changed
- Migration from RapidAPI to OpenWeb Ninja API
- Environment variables renamed: `RAPIDAPI_KEY` to `API_KEY`, `RAPIDAPI_HOST` to `API_HOST`
- API endpoint updated to `https://api.openwebninja.com/jsearch/search`
- Main menu reorganized with sections: "Predefined Searches" and "Additional Functions"

### Added
- **NEW API FEATURES**:
  - **Option 11 - Job Details by ID**: Get complete information for any job using its Job ID
  - **Option 12 - Salary Estimation**: Query salary ranges by position, location and experience level
  - **Option 13 - Company Salaries**: Research salaries at specific companies for specific roles
  - `get_job_details()` function: Endpoint `/jsearch/job-details`
  - `get_estimated_salary()` function: Endpoint `/jsearch/estimated-salary` with 6 experience levels
  - `get_company_salary()` function: Endpoint `/jsearch/company-job-salary`
  - `print_salary_info()` function: Formatted display of salary information
  - Interactive functions for each new feature with input validation

- **Complete logging system**: Logs saved in `logs/` folder with daily format
- **JSON export**: In addition to CSV, results can be saved in JSON format
- **Automatic rate limiting**: 1 second wait between requests to avoid API limits
- **Automatic retries**: Retry system (maximum 3) with exponential backoff
- **Better error handling**:
  - Input parameter validation
  - Specific HTTP error handling (429 Too Many Requests, etc.)
  - 30 second timeout on HTTP requests
  - More descriptive error messages
- **Improved logging**: Detailed logging of all operations (searches, errors, file saving)

### Improved
- **.gitignore**: Added entries for logs, cache and sensitive data
- **Documentation**: README updated with new API and features
- **More robust code**: Use of `pathlib.Path` for path handling
- **No emojis**: Emojis removed from code and documentation

### Security
- Better protection of sensitive files in .gitignore
- API key validation before making requests

---

## [1.0.0] - Original Version

### Initial
- Basic LinkedIn job scraping script
- Interactive menu in Spanish
- 10 predefined searches
- CSV export
- RapidAPI integration
