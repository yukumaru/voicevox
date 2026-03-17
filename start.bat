@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    npm install
)

start /b npm start
exit
