#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: export_service.py
Description: Service for exporting job and salary data to CSV and JSON formats.
             Manages file creation with auto-generated names.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
import csv
import json
import logging
from pathlib import Path
from typing import List, Union
from src.models.job import Job
from src.models.salary import SalaryInfo
from src.utils.file_utils import generate_filename, ensure_dir_exists

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting data to different formats"""

    def __init__(self, output_dir: Union[str, Path] = "output"):
        """
        Args:
            output_dir: Output directory
        """
        self.output_dir = ensure_dir_exists(output_dir)
        logger.debug(f"ExportService initialized: {self.output_dir}")

    def export_jobs_to_csv(self, jobs: List[Job], base_name: str) -> Path:
        """
        Exports jobs to CSV

        Args:
            jobs: List of jobs
            base_name: File base name

        Returns:
            Path of created file

        Raises:
            Exception: If write error occurs
        """
        filename = generate_filename(base_name, "csv")
        filepath = self.output_dir / filename

        logger.info(f"Exporting {len(jobs)} jobs to CSV: {filepath}")

        try:
            # Define columns
            fieldnames = [
                'job_id', 'title', 'employer_name', 'city', 'state', 'country',
                'is_remote', 'employment_type', 'min_salary', 'max_salary',
                'salary_currency', 'salary_period', 'description', 'apply_link',
                'posted_at_datetime', 'job_publisher', 'required_experience',
                'required_skills', 'required_education', 'benefits', 'google_link',
                'expiration_datetime'
            ]

            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()

                for job in jobs:
                    # Convert job to dict
                    job_dict = job.model_dump()

                    # Clean description
                    if job_dict.get('description'):
                        job_dict['description'] = job.get_short_description(500)

                    # Convert lists to strings
                    if job_dict.get('required_skills') and isinstance(job_dict['required_skills'], list):
                        job_dict['required_skills'] = ', '.join(job_dict['required_skills'])

                    if job_dict.get('benefits') and isinstance(job_dict['benefits'], list):
                        job_dict['benefits'] = ', '.join(job_dict['benefits'])

                    writer.writerow(job_dict)

            logger.info(f"CSV created successfully: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting to CSV: {e}")
            raise

    def export_jobs_to_json(self, jobs: List[Job], base_name: str) -> Path:
        """
        Exports jobs to JSON

        Args:
            jobs: List of jobs
            base_name: File base name

        Returns:
            Path of created file

        Raises:
            Exception: If write error occurs
        """
        filename = generate_filename(base_name, "json")
        filepath = self.output_dir / filename

        logger.info(f"Exporting {len(jobs)} jobs to JSON: {filepath}")

        try:
            # Convert jobs to dicts
            jobs_data = [job.model_dump() for job in jobs]

            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(jobs_data, jsonfile, ensure_ascii=False, indent=2)

            logger.info(f"JSON created successfully: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            raise

    def export_salaries_to_json(self, salaries: List[SalaryInfo], base_name: str) -> Path:
        """
        Exports salary information to JSON

        Args:
            salaries: List of salary information
            base_name: File base name

        Returns:
            Path of created file

        Raises:
            Exception: If write error occurs
        """
        filename = generate_filename(base_name, "json")
        filepath = self.output_dir / filename

        logger.info(f"Exporting {len(salaries)} salary records to JSON: {filepath}")

        try:
            # Convert salaries to dicts
            salaries_data = [salary.model_dump() for salary in salaries]

            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(salaries_data, jsonfile, ensure_ascii=False, indent=2)

            logger.info(f"JSON salarial creado exitosamente: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting salaries to JSON: {e}")
            raise

    def export_salaries_to_csv(self, salaries: List[SalaryInfo], base_name: str) -> Path:
        """
        Exports salary information to CSV

        Args:
            salaries: List of salary information
            base_name: File base name

        Returns:
            Path of created file
        """
        filename = generate_filename(base_name, "csv")
        filepath = self.output_dir / filename

        logger.info(f"Exporting {len(salaries)} salary records to CSV: {filepath}")

        try:
            fieldnames = [
                'job_title', 'location', 'publisher_name', 'min_salary',
                'max_salary', 'median_salary', 'salary_currency',
                'salary_period', 'additional_pay'
            ]

            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                for salary in salaries:
                    writer.writerow(salary.model_dump())

            logger.info(f"Salary CSV created successfully: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting salaries to CSV: {e}")
            raise
