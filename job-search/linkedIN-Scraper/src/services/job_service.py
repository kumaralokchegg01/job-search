#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: job_service.py
Description: Business logic service for job search and management.
             Includes search, detail retrieval, filtering, and sorting of offers.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
import logging
from typing import List
from pydantic import ValidationError
from src.api.jsearch_client import JSearchClient
from src.models.job import Job
from src.models.search_params import SearchParameters

logger = logging.getLogger(__name__)


class JobService:
    """Service for job search and management"""

    def __init__(self, api_client: JSearchClient):
        """
        Args:
            api_client: JSearch API Client
        """
        self.api_client = api_client
        logger.debug("JobService initialized")

    def search_jobs(self, params: SearchParameters) -> List[Job]:
        """
        Searches for jobs and returns validated Job objects

        Args:
            params: Search parameters

        Returns:
            List of Job objects

        Raises:
            Exception: If search error occurs
        """
        logger.info(f"Searching for jobs: '{params.query}' in {params.country}")

        try:
            # Call the API
            raw_results = self.api_client.search_jobs(params)

            # Parse results to Job objects
            jobs = []
            for i, job_data in enumerate(raw_results):
                try:
                    job = Job.model_validate(job_data)
                    jobs.append(job)
                except ValidationError as e:
                    logger.warning(f"Error parsing job #{i+1}: {e}")
                    # Continue with rest of jobs
                    continue

            logger.info(f"Parsed {len(jobs)} jobs from {len(raw_results)} results")
            return jobs

        except Exception as e:
            logger.error(f"Search error: {e}")
            raise

    def get_job_details(self, job_id: str, country: str = "us") -> Job:
        """
        Gets complete job details

        Args:
            job_id: Job ID
            country: Country code

        Returns:
            Job object with complete details

        Raises:
            Exception: If error getting details
        """
        logger.info(f"Getting job details: {job_id}")

        try:
            raw_data = self.api_client.get_job_details(job_id, country)
            job = Job.model_validate(raw_data)

            logger.info(f"Details obtained: {job.title}")
            return job

        except ValidationError as e:
            logger.error(f"Error parsing job details: {e}")
            raise ValueError(f"Invalid job data: {e}")
        except Exception as e:
            logger.error(f"Error getting details: {e}")
            raise

    def filter_remote_jobs(self, jobs: List[Job]) -> List[Job]:
        """
        Filters only remote jobs

        Args:
            jobs: List of jobs

        Returns:
            List of remote jobs
        """
        remote_jobs = [job for job in jobs if job.is_remote]
        logger.debug(f"Filtered {len(remote_jobs)} remote jobs from {len(jobs)}")
        return remote_jobs

    def filter_by_salary(
        self,
        jobs: List[Job],
        min_salary: float,
        currency: str = "USD"
    ) -> List[Job]:
        """
        Filters jobs by minimum salary

        Args:
            jobs: List of jobs
            min_salary: Minimum salary
            currency: Currency

        Returns:
            List of jobs meeting criteria
        """
        filtered = [
            job for job in jobs
            if job.min_salary and job.salary_currency == currency and job.min_salary >= min_salary
        ]
        logger.debug(f"Filtered {len(filtered)} jobs with salary >= {min_salary} {currency}")
        return filtered

    def sort_by_salary(self, jobs: List[Job], descending: bool = True) -> List[Job]:
        """
        Sorts jobs by salary

        Args:
            jobs: List of jobs
            descending: Whether to sort descending

        Returns:
            Sorted list
        """
        def get_salary_key(job: Job) -> float:
            if job.max_salary:
                return job.max_salary
            elif job.min_salary:
                return job.min_salary
            return 0

        sorted_jobs = sorted(jobs, key=get_salary_key, reverse=descending)
        logger.debug(f"Jobs sorted by salary")
        return sorted_jobs
