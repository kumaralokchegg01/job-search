#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: config.py
Description: Centralized application configuration loaded from .env file.
             Manages API keys, timeouts, directories, and logging configuration.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Config(BaseSettings):
    """Application configuration loaded from .env"""

    # API Settings
    api_key: str = Field(..., description="OpenWeb Ninja API Key")
    api_host: str = Field(default="api.openwebninja.com", description="API Host")

    # Request Settings
    max_retries: int = Field(default=3, ge=1, le=10, description="Maximum number of retries")
    retry_delay: int = Field(default=2, ge=1, le=10, description="Delay between retries (seconds)")
    request_timeout: int = Field(default=30, ge=10, le=120, description="Request timeout (seconds)")
    rate_limit_delay: float = Field(default=1.0, ge=0.1, le=5.0, description="Delay between requests (seconds)")

    # Paths
    output_dir: Path = Field(default=Path("output"), description="Output directory")
    log_dir: Path = Field(default=Path("logs"), description="Logs directory")

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_to_file: bool = Field(default=True, description="Save logs to file")
    log_to_console: bool = Field(default=True, description="Show logs in console")

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False
    )

    def validate_and_setup(self) -> None:
        """Validates configuration and creates necessary directories"""
        if not self.api_key or self.api_key == "YOUR_API_KEY_HERE":
            raise ValueError(
                "API_KEY not configured. "
                "Please configure your API key in the .env file"
            )

        # Create directories if they don't exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    @classmethod
    def load(cls) -> "Config":
        """Loads and validates configuration"""
        config = cls()
        config.validate_and_setup()
        return config
