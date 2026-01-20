#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: file_utils.py
Description: Utilities for file handling including name cleaning,
             timestamp filename generation, and directory management.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
import re
from pathlib import Path
from datetime import datetime
from typing import Union


def clean_filename(filename: str) -> str:
    """
    Cleans a filename by removing invalid characters

    Args:
        filename: Filename to clean

    Returns:
        Clean filename
    """
    # Remove non-alphanumeric characters except spaces and hyphens
    cleaned = re.sub(r'[^\w\s-]', '', filename)
    # Replace spaces and multiple hyphens with single underscore
    cleaned = re.sub(r'[-\s]+', '_', cleaned)
    # Remove hyphens from start and end
    cleaned = cleaned.strip('_-')
    return cleaned


def generate_filename(
    base_name: str,
    extension: str,
    include_timestamp: bool = True
) -> str:
    """
    Generates a filename with optional timestamp

    Args:
        base_name: File base name
        extension: File extension (without dot)
        include_timestamp: Whether to include timestamp

    Returns:
        Generated filename
    """
    clean_base = clean_filename(base_name)

    if include_timestamp:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{clean_base}_{timestamp}.{extension}"

    return f"{clean_base}.{extension}"


def ensure_dir_exists(directory: Union[str, Path]) -> Path:
    """
    Ensures a directory exists, creating it if necessary

    Args:
        directory: Directory path

    Returns:
        Directory Path
    """
    dir_path = Path(directory)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def get_file_size(file_path: Union[str, Path]) -> int:
    """
    Gets file size in bytes

    Args:
        file_path: File path

    Returns:
        Size in bytes
    """
    return Path(file_path).stat().st_size


def format_file_size(size_bytes: int) -> str:
    """
    Formats file size in readable format

    Args:
        size_bytes: Size in bytes

    Returns:
        Formatted size (e.g.: "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
