#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: salary_service.py
Description: Business logic service for salary queries.
             Provides salary estimates, company salaries, and comparisons.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
import logging
from typing import List, Optional
from pydantic import ValidationError
from src.api.jsearch_client import JSearchClient
from src.models.salary import SalaryInfo

logger = logging.getLogger(__name__)


class SalaryService:
    """Service for salary queries"""

    def __init__(self, api_client: JSearchClient):
        """
        Args:
            api_client: JSearch API Client
        """
        self.api_client = api_client
        logger.debug("SalaryService initialized")

    def get_estimated_salary(
        self,
        job_title: str,
        location: str,
        years_of_experience: str = "ALL"
    ) -> List[SalaryInfo]:
        """
        Gets salary estimates

        Args:
            job_title: Job title
            location: Location
            years_of_experience: Experience level

        Returns:
            List of SalaryInfo

        Raises:
            Exception: If query error occurs
        """
        logger.info(f"Querying salaries: {job_title} in {location} ({years_of_experience})")

        try:
            raw_results = self.api_client.get_estimated_salary(
                job_title=job_title,
                location=location,
                years_of_experience=years_of_experience
            )

            # Parse results
            salaries = []
            for i, salary_data in enumerate(raw_results):
                try:
                    salary = SalaryInfo.model_validate(salary_data)
                    if salary.has_salary_data():  # Only include if has data
                        salaries.append(salary)
                except ValidationError as e:
                    logger.warning(f"Error parsing salary #{i+1}: {e}")
                    continue

            logger.info(f"Obtained {len(salaries)} salary records")
            return salaries

        except Exception as e:
            logger.error(f"Error querying salaries: {e}")
            raise

    def get_company_salary(
        self,
        company: str,
        job_title: str,
        location: Optional[str] = None,
        years_of_experience: str = "ALL"
    ) -> List[SalaryInfo]:
        """
        Gets salaries for a specific company

        Args:
            company: Company name
            job_title: Job title
            location: Location (optional)
            years_of_experience: Experience level

        Returns:
            List of SalaryInfo

        Raises:
            Exception: If query error occurs
        """
        logger.info(f"Querying salaries of {company} for {job_title}")

        try:
            raw_results = self.api_client.get_company_salary(
                company=company,
                job_title=job_title,
                location=location,
                years_of_experience=years_of_experience
            )

            # Parse results
            salaries = []
            for i, salary_data in enumerate(raw_results):
                try:
                    salary = SalaryInfo.model_validate(salary_data)
                    if salary.has_salary_data():
                        salaries.append(salary)
                except ValidationError as e:
                    logger.warning(f"Error parsing company salary #{i+1}: {e}")
                    continue

            logger.info(f"Obtained {len(salaries)} salary records from {company}")
            return salaries

        except Exception as e:
            logger.error(f"Error querying company salaries: {e}")
            raise

    def compare_locations(
        self,
        job_title: str,
        locations: List[str],
        years_of_experience: str = "ALL"
    ) -> dict:
        """
        Compares salaries across different locations

        Args:
            job_title: Job title
            locations: List of locations
            years_of_experience: Experience level

        Returns:
            Dictionary with comparison by location
        """
        logger.info(f"Comparing salaries for {job_title} in {len(locations)} locations")

        comparison = {}
        for location in locations:
            try:
                salaries = self.get_estimated_salary(job_title, location, years_of_experience)
                if salaries:
                    # Calculate average of medians
                    medians = [s.median_salary for s in salaries if s.median_salary]
                    avg_median = sum(medians) / len(medians) if medians else None
                    comparison[location] = {
                        'count': len(salaries),
                        'average_median': avg_median,
                        'salaries': salaries
                    }
            except Exception as e:
                logger.warning(f"Error comparing {location}: {e}")
                continue

        return comparison
