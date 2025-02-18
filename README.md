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
│   ├── user.service.ts    
│   ├── user.controller.ts 
│   └── user.module.ts     
├── transaction/       # Transaction-related features
│   ├── transaction.service.ts    
│   ├── transaction.controller.ts 
│   └── transaction.module.ts     
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

```
Note: On initialization, a default user is created with the following credentials:

Email:  bilalk@gmail.com
Password: password123
```

### Transaction System
Manage transactions with features like:
- Create new transactions
- View transaction history
- Process transaction data

```
Note: On initialization, a few transactions are created (same as task document)
```

## Need Help?

### Common Issues
1. **Port already in use**: Stop any running instances or change the port in `src/main.ts`
2. **Module not found**: Run `pnpm install` again