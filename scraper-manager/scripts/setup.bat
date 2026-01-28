@echo off
echo ====================================
echo Scraper Manager - Setup Script
echo ====================================
echo.

echo [1/7] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo.

echo [2/7] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/7] Checking for .env file...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file with your credentials!
    echo Press any key to open .env file...
    pause >nul
    notepad .env
)
echo.

echo [4/7] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client!
    pause
    exit /b 1
)
echo.

echo [5/7] Setting up database...
echo Please ensure PostgreSQL is running and credentials in .env are correct.
pause
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup database!
    echo Please check your DATABASE_URL in .env
    pause
    exit /b 1
)
echo.

echo [6/7] Seeding database with scrapers...
call npx ts-node scripts/seed-scrapers.ts
if %errorlevel% neq 0 (
    echo WARNING: Failed to seed database. You can run this later.
)
echo.

echo [7/7] Creating required directories...
if not exist recordings mkdir recordings
if not exist logs mkdir logs
if not exist data mkdir data
if not exist screenshots mkdir screenshots
echo.

echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo Next steps:
echo 1. Verify your .env configuration
echo 2. Start Redis: docker run -p 6379:6379 redis
echo 3. Start Elasticsearch: docker run -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.13.0
echo 4. Run: npm run dev
echo 5. Open: http://localhost:3000
echo.
echo Or use Docker Compose:
echo   docker-compose up -d
echo.
pause
