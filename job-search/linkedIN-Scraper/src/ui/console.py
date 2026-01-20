#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File name: console.py
Description: Custom Rich Console wrapper providing colored and formatted output
             in terminal with themes and convenience methods.

Author: Hex686f6c61
Repository: https://github.com/Hex686f6c61/linkedIN-Scraper
Version: 3.0.0
Date: 2025-12-08
"""
from rich.console import Console as RichConsole
from rich.theme import Theme


# Custom theme
custom_theme = Theme({
    "success": "bold green",
    "error": "bold red",
    "warning": "bold yellow",
    "info": "bold cyan",
    "highlight": "bold magenta",
    "dim": "dim"
})


class Console:
    """Rich Console wrapper with convenience methods"""

    def __init__(self):
        self.console = RichConsole(theme=custom_theme)

    def print_success(self, message: str):
        """Prints success message"""
        self.console.print(f"[success][OK][/success] {message}")

    def print_error(self, message: str):
        """Prints error message"""
        self.console.print(f"[error][ERROR][/error] {message}")

    def print_warning(self, message: str):
        """Prints warning message"""
        self.console.print(f"[warning][WARNING][/warning] {message}")

    def print_info(self, message: str):
        """Prints informative message"""
        self.console.print(f"[info][INFO][/info] {message}")

    def print_header(self, title: str):
        """Prints header with decorative line"""
        self.console.rule(f"[bold]{title}[/bold]")

    def print_separator(self):
        """Prints separator line"""
        self.console.print("─" * 80, style="dim")

    def print(self, *args, **kwargs):
        """Wrapper for Rich Console print"""
        self.console.print(*args, **kwargs)

    def clear(self):
        """Clears the console"""
        self.console.clear()
