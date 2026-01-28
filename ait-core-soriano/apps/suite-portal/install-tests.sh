#!/bin/bash
# Bash script to install and setup Playwright tests
# Run with: chmod +x install-tests.sh && ./install-tests.sh

set -e

echo -e "\033[0;32mInstalling Playwright Testing Infrastructure...\033[0m"

# Check if pnpm is installed
echo -e "\n\033[0;33mChecking for pnpm...\033[0m"
if ! command -v pnpm &> /dev/null; then
    echo -e "\033[0;33mpnpm not found. Installing pnpm...\033[0m"
    npm install -g pnpm
else
    echo -e "\033[0;32mpnpm is already installed\033[0m"
fi

# Install dependencies
echo -e "\n\033[0;33mInstalling dependencies...\033[0m"
pnpm install

# Install Playwright browsers
echo -e "\n\033[0;33mInstalling Playwright browsers...\033[0m"
echo -e "\033[0;36mThis may take a few minutes...\033[0m"
npx playwright install --with-deps

# Create directories for test artifacts
echo -e "\n\033[0;33mCreating test directories...\033[0m"
directories=("test-results" "playwright-report" "tests/screenshots")

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "\033[0;32mCreated: $dir\033[0m"
    else
        echo -e "\033[0;36mAlready exists: $dir\033[0m"
    fi
done

# Update .gitignore
echo -e "\n\033[0;33mUpdating .gitignore...\033[0m"
if [ -f ".gitignore" ]; then
    cat .gitignore.tests >> .gitignore
    echo -e "\033[0;32m.gitignore updated\033[0m"
else
    echo -e "\033[0;33mWarning: .gitignore not found\033[0m"
fi

# Make scripts executable
chmod +x install-tests.sh 2>/dev/null || true

echo -e "\n\033[0;32m✅ Installation successful!\033[0m"
echo -e "\n\033[0;33mNext steps:\033[0m"
echo -e "\033[0;37m1. Start the dev server: pnpm dev\033[0m"
echo -e "\033[0;37m2. Run all tests: pnpm test\033[0m"
echo -e "\033[0;37m3. Run tests with UI: pnpm test:ui\033[0m"
echo -e "\033[0;37m4. View test report: pnpm test:report\033[0m"

echo -e "\n\033[0;33mDocumentation:\033[0m"
echo -e "\033[0;37m- Full guide: docs/TESTING_GUIDE.md\033[0m"
echo -e "\033[0;37m- Quick start: tests/README.md\033[0m"

echo -e "\n\033[0;36m============================================\033[0m"
echo -e "\033[0;32m  Playwright Testing Infrastructure Ready  \033[0m"
echo -e "\033[0;36m============================================\033[0m"
echo ""
