# Finance Backend API

A RESTful API backend for managing financial records with role-based access control. Built with Node.js, Express.js, PostgreSQL, and Objection.js.

## Overview

This system provides a comprehensive backend for a finance dashboard where users with different roles (Viewer, Analyst, Admin) interact with financial records according to their permissions. The system manages users, enforces role-based access control, processes financial transactions, and provides aggregated dashboard summaries.

### Key Features

- **Role-Based Access Control**: Three user roles with distinct permissions
  - **Viewer**: Dashboard summaries only
  - **Analyst**: View financial records + dashboard analytics  
  - **Admin**: Full CRUD operations + user management
- **Financial Record Management**: Complete CRUD operations for financial transactions
- **Dashboard Analytics**: Aggregated summaries, trends, and category analysis
- **Authentication**: JWT-based stateless authentication
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: Protection against API abuse
- **Comprehensive Testing**: Unit tests and property-based testing

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Objection.js with Knex.js
- **Authentication**: JSON Web Tokens (JWT) with bcrypt
- **Validation**: express-validator
- **Testing**: Jest with fast-check for property-based testing
- **Logging**: Winston

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=finance_backend
   DB_USER=postgres
   DB_PASSWORD=your_password_here

   # Test Database Configuration
   TEST_DB_NAME=finance_backend_test

   # Authentication (JWT)
   JWT_SECRET=your_secret_key_here_change_in_production
   JWT_EXPIRATION=24h

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## Database Setup

1. **Create PostgreSQL databases**
   ```sql
   CREATE DATABASE finance_backend;
   CREATE DATABASE finance_backend_test;
   ```

2. **Run database migrations**
   ```bash
   npm run migrate:latest
   ```

3. **Verify database setup**
   ```bash
   # Check if tables were created
   psql -d finance_backend -c "\dt"
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with auto-reload enabled.

### Production Mode
```bash
npm start
```

### Health Check
Visit `http://localhost:3000/health` to verify the server is running.

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# Property-based tests only
npm run test:properties

# Watch mode (development)
npm run test:watch
```

### Test Coverage
```bash
npm test
```
Coverage reports are generated in the `coverage/` directory.

## Deployment

This application can be deployed for **FREE** on several platforms. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy (Railway - Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repo
   - Add PostgreSQL database
   - Set environment variables
   - Deploy automatically!

3. **Check deployment readiness**
   ```bash
   npm run deploy:check
   ```

### Other Free Options
- **Render** + Supabase (free PostgreSQL)
- **Vercel** (serverless) + Neon DB
- **Fly.io** + external database

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide with all platforms.

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── authorization.js     # Role-based access control
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── rateLimit.js         # Rate limiting middleware
│   │   └── validator.js         # Request validation helpers
│   ├── models/
│   │   ├── User.js              # User model with Objection.js
│   │   └── FinancialRecord.js   # Financial record model
│   ├── services/
│   │   ├── userService.js       # User business logic
│   │   ├── recordService.js     # Financial record operations
│   │   ├── dashboardService.js  # Dashboard calculations
│   │   └── authService.js       # Authentication logic
│   ├── routes/
│   │   ├── users.js             # User management endpoints
│   │   ├── records.js           # Financial record endpoints
│   │   ├── dashboard.js         # Dashboard endpoints
│   │   └── auth.js              # Authentication endpoints
│   ├── utils/
│   │   ├── logger.js            # Winston logging configuration
│   │   ├── errors.js            # Custom error classes
│   │   └── asyncHandler.js      # Async error handling wrapper
│   ├── migrations/              # Database migrations
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # API integration tests
│   └── properties/              # Property-based tests
├── .env.example                 # Environment variables template
├── knexfile.js                  # Knex configuration
├── jest.config.js               # Jest configuration
└── README.md
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 5432 | Yes |
| `DB_NAME` | Database name | - | Yes |
| `DB_USER` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `TEST_DB_NAME` | Test database name | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRATION` | JWT expiration time | 24h | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | No |

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Financial Records Table
```sql
CREATE TABLE financial_records (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed endpoint documentation with request/response examples.

## Design Documentation

See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for architectural decisions, technology choices, and design rationale.

## Database Schema Documentation

See [SCHEMA.md](SCHEMA.md) for detailed database schema documentation including relationships, constraints, and migration strategy.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support or questions, please open an issue in the repository.