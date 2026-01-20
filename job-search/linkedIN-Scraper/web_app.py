#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web Dashboard for LinkedIn Job Scraper v3.0
Provides a Flask-based web interface for the LinkedIn scraper
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime
from src.utils.config import Config
from src.utils.logger import setup_logger
from src.api.jsearch_client import JSearchClient
from src.services.job_service import JobService
from src.services.salary_service import SalaryService
from src.services.export_service import ExportService
from src.models.search_params import SearchParameters

app = Flask(__name__)
CORS(app)

# Configure app
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# Initialize services
config = Config()
logger = setup_logger()
jsearch_client = JSearchClient(api_key=config.api_key, api_host=config.api_host)
job_service = JobService(jsearch_client)
salary_service = SalaryService(jsearch_client)
export_service = ExportService()

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/search', methods=['POST'])
def search_jobs():
    """API endpoint for job search"""
    try:
        data = request.get_json()
        
        # Country mapping
        country_map = {
            'United States': 'us',
            'Spain': 'es',
            'United Kingdom': 'uk',
            'Canada': 'ca',
            'Australia': 'au',
            'Germany': 'de',
            'France': 'fr',
            'Netherlands': 'nl',
            'India': 'in',
            'Singapore': 'sg'
        }
        
        # Employment type mapping
        employment_type_map = {
            'FULL_TIME': 'FULL_TIME',
            'PART_TIME': 'PART_TIME',
            'CONTRACT': 'CONTRACT',
            'TEMPORARY': 'TEMPORARY',
            '': None
        }
        
        # Date posted mapping
        date_posted_map = {
            '': 'all',
            '24h': '24h',
            '7d': '7d',
            '30d': '30d',
            '90d': '90d'
        }
        
        country_code = country_map.get(data.get('country', 'United States'), 'us')
        employment_type = employment_type_map.get(data.get('employment_type', ''), None)
        date_posted = date_posted_map.get(data.get('date_posted', ''), 'all')
        
        # Create SearchParameters object
        params = SearchParameters(
            query=data.get('query', ''),
            country=country_code,
            employment_types=employment_type,
            date_posted=date_posted,
            work_from_home=data.get('remote', False),
            num_pages=int(data.get('num_pages', 1)),
            page=int(data.get('page', 1))
        )
        
        jobs = job_service.search_jobs(params)
        
        # Convert Job objects to dictionaries
        jobs_list = []
        if jobs:
            for job in jobs:
                if hasattr(job, 'model_dump'):
                    jobs_list.append(job.model_dump())
                elif hasattr(job, 'dict'):
                    jobs_list.append(job.dict())
                elif isinstance(job, dict):
                    jobs_list.append(job)
                else:
                    jobs_list.append(vars(job) if hasattr(job, '__dict__') else str(job))
        
        return jsonify({
            'success': True,
            'count': len(jobs_list),
            'jobs': jobs_list,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/api/job/<job_id>', methods=['GET'])
def get_job_details(job_id):
    """Get detailed information about a specific job"""
    try:
        job = job_service.get_job_details(job_id)
        
        return jsonify({
            'success': True,
            'job': job,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Get job details error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/api/salary/range', methods=['POST'])
def get_salary_range():
    """Get salary range for a position"""
    try:
        data = request.get_json()
        
        position = data.get('position', '')
        location = data.get('location', '')
        
        salary_data = salary_service.query_salary_by_position(position, location)
        
        return jsonify({
            'success': True,
            'salary_data': salary_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Salary query error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/api/export', methods=['POST'])
def export_jobs():
    """Export jobs to CSV or JSON"""
    try:
        data = request.get_json()
        
        jobs = data.get('jobs', [])
        format_type = data.get('format', 'json')  # json or csv
        
        if not jobs:
            return jsonify({
                'success': False,
                'error': 'No jobs to export',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        if format_type == 'csv':
            filename = export_service.export_to_csv(jobs)
        else:
            filename = export_service.export_to_json(jobs)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'LinkedIn Job Scraper Web Dashboard',
        'version': '3.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("LinkedIn Job Scraper - Web Dashboard")
    print("=" * 60)
    print("\n🌐 Starting web server...")
    print("📱 Open your browser and navigate to: http://localhost:3000")
    print("\n" + "=" * 60 + "\n")
    
    app.run(debug=False, host='127.0.0.1', port=3000, threaded=True)
