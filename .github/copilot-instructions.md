# SerpBear - Search Engine Results Position Tracking
SerpBear is a Next.js web application for tracking search engine ranking positions with SQLite database, automated cron job scraping, email notifications, and comprehensive SEO insights. It features Google Search Console integration, keyword research capabilities, and supports multiple SERP scraping services.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, build, and test the repository:
- **Prerequisites Check**: Verify Node.js 18.18 or newer: `node --version`
- **Install Dependencies**: `npm install` -- takes 16 seconds. Install Python 3 and build tools first if compilation fails.
- **Build Application**: `npm run build` -- takes 31 seconds. **NEVER CANCEL: Set timeout to 90+ seconds.**
- **Run Tests**: `npm test` -- takes 6 seconds. **NEVER CANCEL: Set timeout to 30+ seconds.** All 136 tests must pass.
- **Lint Code**: `npm run lint` -- takes 8.5 seconds. Always run before committing.
- **Lint CSS**: `npm run lint:css` -- takes 0.6 seconds. Run after updating global CSS files.

### Run the application:
- **Development**: `npm run dev` -- starts in 2 seconds on http://localhost:3000 (or next available port)
- **Production**: `npm run build && npm run start` -- requires build first, starts on http://localhost:3000
- **With Background Jobs**: `npm run start:all` -- starts both web server and cron worker concurrently

### Database operations:
- **Apply Migrations**: `npm run db:migrate` -- applies pending schema changes to SQLite database
- **Rollback Migration**: `npm run db:revert` -- rolls back the most recent migration
- **Database Location**: `./data/database.sqlite` (auto-created on first run)

## Validation

### Always manually validate changes via these scenarios:
1. **Login Flow**: Start dev server, visit http://localhost:3000/login, verify login page renders without errors
2. **Domain Management**: After login, verify you can access /domains and the domain listing loads
3. **API Health Check**: Test `curl http://localhost:3000/api/domains` returns JSON response (may be empty initially)
4. **Build Integrity**: Always run `npm run build` after changes to ensure production build succeeds
5. **Test Coverage**: Run `npm test` to verify all 136 tests pass - any failures indicate regression issues

### Critical validation commands to run before finishing:
- `npm run lint` -- ESLint must pass with zero errors
- `npm run lint:css` -- Stylelint must pass (may show deprecation warnings, ignore those)
- `npm test` -- All tests must pass (136 tests across 29 suites)
- `npm run build` -- Production build must succeed

## Build Times and Timeouts

**CRITICAL**: All time-consuming operations require explicit timeout settings:
- **npm install**: 16 seconds typical, **set timeout to 120+ seconds** (may compile native modules)
- **npm run build**: 31 seconds typical, **NEVER CANCEL - set timeout to 90+ seconds**
- **npm test**: 6 seconds typical, **set timeout to 30+ seconds**
- **npm run lint**: 8.5 seconds typical, set timeout to 30+ seconds
- **Database migrations**: Usually under 1 second, set timeout to 30+ seconds

## Repository Structure

### Key directories and their purpose:
- **`pages/`** - Next.js pages (routes) including API endpoints
- **`components/`** - React UI components (keywords, domains, settings, insight, common)
- **`utils/`** - Utility functions (scraper, email, security, database helpers)
- **`database/`** - Sequelize models, migrations, and config
- **`__tests__/`** - Jest test suites (components, API, database, utilities)
- **`scrapers/`** - SERP data collection integrations
- **`email/`** - Email notification templates and sending logic
- **`styles/`** - Global CSS and Tailwind styles
- **`public/`** - Static assets and favicons

### Configuration files:
- **`package.json`** - Dependencies and npm scripts
- **`next.config.js`** - Next.js configuration with security headers and optimizations
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`eslint.config.mjs`** - ESLint flat configuration with React, security, and import rules
- **`.sequelizerc`** - Sequelize CLI configuration
- **`jest.config.js`** - Jest testing framework configuration
- **`.env.example`** - Environment variables template
- **`Dockerfile`** - Multi-stage Docker build configuration

### Important files to check after changes:
- Always run linting after editing any `.js`, `.jsx`, `.ts`, `.tsx` files
- Check `types.d.ts` when adding new TypeScript definitions
- Update tests in `__tests__/` when modifying functionality
- Review `database/migrations/` when changing data schemas
- Check `utils/security.ts` when handling user input or authentication

## Environment Setup

### Required environment variables (copy from .env.example to .env.local):
```bash
USER=admin
PASSWORD=0123456789  
SECRET=4715aed3216f7b0a38e6b534a958362654e96d10fbc04700770d572af3dce43625dd
APIKEY=5saedXklbslhnapihe2pihp3pih4fdnakhjwq5
SCREENSHOT_API=your_screenshot_api_key_here  # REQUIRED for keyword screenshots
```

### Optional but commonly used:
- **Google Search Console**: Set `SEARCH_CONSOLE_CLIENT_EMAIL` and `SEARCH_CONSOLE_PRIVATE_KEY`
- **Email Notifications**: Configure SMTP settings for email alerts
- **Cron Scheduling**: Customize `CRON_TIMEZONE`, `CRON_MAIN_SCHEDULE`, etc.

## Common Development Tasks

### Adding a new feature:
1. Create/update React components in `components/`
2. Add API endpoints in `pages/api/`
3. Update database models/migrations if needed
4. Write tests in `__tests__/` matching existing patterns
5. Update TypeScript types in `types.d.ts` if needed
6. Run `npm run lint && npm test && npm run build` to validate

### Debugging database issues:
- Check `database/models/` for Sequelize model definitions
- Review `database/migrations/` for schema changes
- Use `npm run db:migrate` to apply pending migrations
- SQLite database is in `./data/database.sqlite`

### Updating dependencies:
- Run `npm install` after pulling changes (may rebuild native modules)
- Check for Python 3 and build tools if `better-sqlite3` compilation fails
- Always test build and tests after dependency updates

## Frequently Referenced Outputs

### Repository root files:
```
.env.example .sequelizerc eslint.config.mjs jest.config.js 
next.config.js package.json tailwind.config.js tsconfig.json
Dockerfile docker-compose.yml entrypoint.sh cron.js
components/ pages/ utils/ database/ __tests__/ styles/ public/
```

### package.json scripts (most commonly used):
```json
{
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "test": "jest --verbose",
  "lint": "eslint .",
  "lint:css": "stylelint styles/*.css",
  "db:migrate": "sequelize-cli db:migrate --env production",
  "start:all": "concurrently npm:start npm:cron"
}
```

### Test structure:
- **29 test suites** covering components, API endpoints, utilities, and database operations
- **136 total tests** with good coverage of core functionality
- Tests use Jest + React Testing Library + msw for mocking
- Run tests with `npm test` (takes ~6 seconds)

## Known Issues and Workarounds

### Database migration errors:
- Some migrations may fail with "Use run() instead" error - this is related to better-sqlite3 compatibility
- The application will still function correctly for development
- Docker deployment handles migrations automatically via entrypoint.sh

### TypeScript conflicts:
- May see peer dependency warnings about TypeScript versions - these are safe to ignore
- The project uses TypeScript 4.8.4 which works correctly with the build process

### Port conflicts:
- Development server automatically uses next available port (3001, 3002, etc.) if 3000 is busy
- Check console output for actual port when starting `npm run dev`

## Security Considerations

### Authentication and validation:
- User authentication handled via JWT tokens with configurable session duration
- Input sanitization utilities in `utils/security.ts` 
- ESLint security plugin catches common vulnerabilities
- Next.js security headers configured in `next.config.js`

### Environment security:
- Never commit real credentials - use `.env.local` for local development
- SCREENSHOT_API key is required in production for full functionality
- Use strong SECRET and APIKEY values in production environments

This covers the complete development workflow for the SerpBear application. Always validate changes with the test suite and linting before committing.