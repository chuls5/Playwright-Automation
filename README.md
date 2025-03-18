# Playwright Testing Project

## Overview
This project uses Playwright for end-to-end testing. It's set up to automate browser tests across multiple environments and includes configuration for test reporting and environment variables.

## Project Structure
- `.github/workflows`: Contains GitHub Actions workflow configurations
- `node_modules`: Project dependencies
- `playwright-report`: Generated test reports from Playwright runs
- `test-results`: Test execution artifacts and results
- `tests`: Contains your test scripts
  - `e3.111709_E3loginscreenmatchesFigma.spec.js-snapshots`: Visual comparison snapshots
  - `screenshots`: Test screenshots
- `tests-examples`: Example tests provided by Playwright

## Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install
```

### Setting up Environment Variables
Copy the example environment file to create your own:
```bash
cp .env.example .env
```
Then edit the `.env` file with your specific configuration values.

### Running Tests
```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/[testname].spec.js

# Run tests in UI mode
npx playwright test --ui
```

## Test Reports
After running tests, reports are generated in the `playwright-report` directory. Open them with:
```bash
npx playwright show-report
```

## Visual Testing
This project includes visual comparison testing capabilities. Reference snapshots are stored in the test directories with `-snapshots` suffix.

## Configuration
The project uses `playwright.config.ts` for configuring test execution parameters, including:
- Browsers to test
- Test timeouts
- Parallel execution settings
- Reporter configurations

## Additional Resources
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)