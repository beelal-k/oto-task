# OTO-Fulfilment Task 

## What is this project?
This is a NestJS-based application that manages users and transactions.

## Prerequisites
Before you begin, make sure you have:
- Node.js installed (version 16 or higher)
- PNPM package manager installed (you can install it with `npm install -g pnpm`)

## Quick Start Guide

### 1. Install Dependencies
First, install all the required packages:
```bash
pnpm install
```

### 2. Running the Application
You have several options to run the application:

```bash
# For development with auto-reload:
pnpm run start:dev

# For production:
pnpm run start:prod

# For regular development:
pnpm run start
```

## Project Structure
Here's a breakdown of the main components and their responsibilities:

```
src/
├── user/              # User-related features
│   ├── user.service.ts    # Contains business logic for user operations
│   ├── user.controller.ts # Handles HTTP requests and defines API endpoints
│   └── user.module.ts     # Entry point that binds controllers and services
├── transaction/       # Transaction-related features
│   ├── transaction.service.ts    # Business logic for transaction operations
│   ├── transaction.controller.ts # API endpoints for transaction management
│   └── transaction.module.ts     # Module configuration and dependency binding
└── app.module.ts      # Main application module that imports all feature modules
```

Each feature module follows NestJS's architectural pattern:
- **Services (.service.ts)**: Contain the business logic and data manipulation
- **Controllers (.controller.ts)**: Handle HTTP requests and define API endpoints
- **Modules (.module.ts)**: Act as entry points, connecting controllers with their required services

## Main Features

### User System
The application includes a user management system with basic operations:
- Create users
- Get user information
- Update user details
- Delete users

### Transaction System
Manage transactions with features like:
- Create new transactions
- View transaction history
- Process transaction data

## Testing
To ensure everything works correctly, you can run tests:

```bash
# Run unit tests
pnpm run test

# Run end-to-end tests
pnpm run test:e2e

# Check test coverage
pnpm run test:cov
```

## Need Help?

### Common Issues
1. **Port already in use**: Stop any running instances or change the port in `src/main.ts`
2. **Module not found**: Run `pnpm install` again

### Development Tips
- Use `pnpm run start:dev` during development for auto-reload
- Check the console for error messages
- Review the NestJS documentation for detailed explanations