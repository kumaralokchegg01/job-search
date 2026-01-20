#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: formatters.py
Description: Formatters for presenting job and salary data in tables and Rich
             panels, providing clear and structured visualization.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
from typing import List
from rich.table import Table
from rich.panel import Panel
from src.models.job import Job
from src.models.salary import SalaryInfo


class JobFormatter:
    """Formatter for jobs"""

    @staticmethod
    def format_job_table(jobs: List[Job]) -> Table:
        """
        Creates Rich table of jobs

        Args:
            jobs: List of jobs

        Returns:
            Formatted Rich table
        """
        table = Table(title=f"[bold]Jobs Found: {len(jobs)}[/bold]", show_lines=True)

        # Columns
        table.add_column("ID", style="cyan", no_wrap=True, width=10)
        table.add_column("Title", style="magenta", width=30)
        table.add_column("Company", style="green", width=25)
        table.add_column("Location", width=20)
        table.add_column("Salary", style="yellow", width=20)
        table.add_column("Type", style="blue", width=12)

        for job in jobs:
            # Truncate long texts
            job_id_short = job.job_id[:8] + "..." if len(job.job_id) > 8 else job.job_id
            title_short = (job.title[:27] + "...") if job.title and len(job.title) > 30 else (job.title or "N/A")
            employer_short = (job.employer_name[:22] + "...") if job.employer_name and len(job.employer_name) > 25 else (job.employer_name or "N/A")

            table.add_row(
                job_id_short,
                title_short,
                employer_short,
                job.get_location(),
                job.get_salary_range() or "Not specified",
                job.employment_type or "N/A"
            )

        return table

    @staticmethod
    def format_job_details(job: Job) -> Panel:
        """
        Formats job details in Rich panel

        Args:
            job: Job

        Returns:
            Rich panel with details
        """
        content = f"""
[bold cyan]Title:[/bold cyan] {job.title or 'N/A'}
[bold green]Company:[/bold green] {job.employer_name or 'N/A'}
[bold]Location:[/bold] {job.get_location()}
[bold yellow]Salary:[/bold yellow] {job.get_salary_range() or 'Not specified'}
[bold]Employment Type:[/bold] {job.employment_type or 'N/A'}
[bold]Remote:[/bold] {'Yes' if job.is_remote else 'No'}
[bold]Posted:[/bold] {job.posted_at_datetime or 'N/A'}

[bold]Description:[/bold]
{job.get_short_description(300)}

[bold]Requirements:[/bold]
  • Experience: {job.required_experience or 'Not specified'}
  • Education: {job.required_education or 'Not specified'}

[bold cyan]Application link:[/bold cyan] {job.apply_link or 'N/A'}
        """
        return Panel(
            content.strip(),
            title=f"[bold]Job Details: {job.job_id[:12]}[/bold]",
            border_style="blue"
        )

    @staticmethod
    def format_job_summary(jobs: List[Job]) -> str:
        """
        Formats job summary in plain text

        Args:
            jobs: List of jobs

        Returns:
            Summary in text
        """
        lines = ["\n" + "=" * 80]
        lines.append(f"SEARCH SUMMARY - {len(jobs)} jobs found")
        lines.append("=" * 80 + "\n")

        for i, job in enumerate(jobs, 1):
            lines.append(f"[{i}] {job.title or 'N/A'}")
            lines.append(f"    Company: {job.employer_name or 'N/A'}")
            lines.append(f"    Location: {job.get_location()}")
            lines.append(f"    Salary: {job.get_salary_range() or 'Not specified'}")
            lines.append(f"    Link: {job.apply_link or 'N/A'}")
            lines.append("-" * 40)

        lines.append("=" * 80 + "\n")
        return "\n".join(lines)


class SalaryFormatter:
    """Formatter for salary information"""

    @staticmethod
    def format_salary_table(salaries: List[SalaryInfo]) -> Table:
        """
        Creates Rich table of salaries

        Args:
            salaries: List of salary information

        Returns:
            Formatted Rich table
        """
        table = Table(title="[bold]Salary Information[/bold]", show_lines=True)

        # Columns
        table.add_column("Position", style="magenta", width=25)
        table.add_column("Location", style="cyan", width=20)
        table.add_column("Median", style="green", justify="right", width=15)
        table.add_column("Range", style="yellow", justify="right", width=20)
        table.add_column("Source", style="dim", width=15)

        for salary in salaries:
            # Formatear valores
            title_short = (salary.job_title[:22] + "...") if salary.job_title and len(salary.job_title) > 25 else (salary.job_title or "N/A")
            location_short = (salary.location[:17] + "...") if salary.location and len(salary.location) > 20 else (salary.location or "N/A")

            median = salary.get_formatted_median() if salary.median_salary else "N/A"
            salary_range = salary.get_formatted_range()

            table.add_row(
                title_short,
                location_short,
                median,
                salary_range,
                salary.publisher_name or "N/A"
            )

        return table

    @staticmethod
    def format_salary_details(salaries: List[SalaryInfo]) -> str:
        """
        Formatea detalles de salarios en texto simple

        Args:
            salaries: Lista de información salarial

        Returns:
            Detalles en texto
        """
        lines = ["\n" + "=" * 80]
        lines.append(f"INFORMACIÓN DE SALARIOS - {len(salaries)} resultados")
        lines.append("=" * 80 + "\n")

        for i, salary in enumerate(salaries, 1):
            lines.append(f"[{i}] {salary.job_title or 'N/A'}")
            lines.append(f"    Ubicación: {salary.location or 'N/A'}")

            if salary.median_salary:
                lines.append(f"    Salario Mediano: {salary.get_formatted_median()}")
            if salary.min_salary and salary.max_salary:
                lines.append(f"    Rango: {salary.get_formatted_range()}")
            if salary.additional_pay:
                lines.append(f"    Pago Adicional: {salary.additional_pay}")

            lines.append(f"    Fuente: {salary.publisher_name or 'N/A'}")
            lines.append("-" * 40)

        lines.append("=" * 80 + "\n")
        return "\n".join(lines)
