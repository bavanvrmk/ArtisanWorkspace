@echo off
cd /d "%~dp0"
python dev.py
if errorlevel 1 pause
