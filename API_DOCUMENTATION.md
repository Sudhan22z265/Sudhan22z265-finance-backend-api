# API Documentation

This document provides comprehensive documentation for all API endpoints in the Finance Backend system.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. Register a new user or use existing credentials
2. Login to receive a JWT token
3. Include the token in subsequent requests

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "details": {
    // Optional: Additional error context
  }
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 100 requests per 15 minutes  
- **Dashboard endpoints**: 100 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`  
**Access:** Public

#### Request Body

```json
{
  "username": "john_doe",
  "email": "john@example.com", 
  "password": "SecurePass123!",
  "role": "viewer"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (3-50 characters, alphanumeric + underscore) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 8 characters) |
| role | string | Yes | User role: `viewer`, `analyst`, or `admin` |

#### Success Response (201 Created)

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses

```json
// 400 - Validation Error
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}

// 409 - Username Already Exists
{
  "error": "CONFLICT",
  "message": "Username already exists"
}
```

### Login User

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`  
**Access:** Public

#### Request Body

```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

#### Success Response (200 OK)

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses

```json
// 401 - Invalid Credentials
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid username or password"
}

// 403 - Inactive User
{
  "error": "AUTHORIZATION_ERROR", 
  "message": "User account is inactive"
}
```

---

## User Management Endpoints

All user management endpoints require **Admin** role.

### Create User

Create a new user (admin only).

**Endpoint:** `POST /api/users`  
**Access:** Admin only  
**Authentication:** Required

#### Request Body

```json
{
  "username": "jane_analyst",
  "email": "jane@example.com",
  "role": "analyst",
  "password": "SecurePass123!"
}
```

#### Success Response (201 Created)

```json
{
  "id": 2,
  "username": "jane_analyst", 
  "email": "jane@example.com",
  "role": "analyst",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

### Get All Users

Retrieve all users in the system.

**Endpoint:** `GET /api/users`  
**Access:** Admin only  
**Authentication:** Required

#### Success Response (200 OK)

```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com", 
      "role": "viewer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "username": "jane_analyst",
      "email": "jane@example.com",
      "role": "analyst", 
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 2
}
```

### Get User by ID

Retrieve a specific user by ID.

**Endpoint:** `GET /api/users/:id`  
**Access:** Admin only  
**Authentication:** Required

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | User ID |

#### Success Response (200 OK)

```json
{
  "id": 2,
  "username": "jane_analyst",
  "email": "jane@example.com",
  "role": "analyst",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Error Response

```json
// 404 - User Not Found
{
  "error": "NOT_FOUND",
  "message": "User not found"
}
```

### Update User Role

Update a user's role.

**Endpoint:** `PATCH /api/users/:id/role`  
**Access:** Admin only  
**Authentication:** Required

#### Request Body

```json
{
  "role": "admin"
}
```

#### Success Response (200 OK)

```json
{
  "id": 2,
  "username": "jane_analyst",
  "email": "jane@example.com", 
  "role": "admin",
  "isActive": true,
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### Update User Status

Update a user's active status.

**Endpoint:** `PATCH /api/users/:id/status`  
**Access:** Admin only  
**Authentication:** Required

#### Request Body

```json
{
  "isActive": false
}
```

#### Success Response (200 OK)

```json
{
  "id": 2,
  "username": "jane_analyst",
  "email": "jane@example.com",
  "role": "admin",
  "isActive": false,
  "updatedAt": "2024-01-15T12:30:00Z"
}
```

---

## Financial Record Endpoints

### Create Financial Record

Create a new financial record.

**Endpoint:** `POST /api/records`  
**Access:** Admin only  
**Authentication:** Required

#### Request Body

```json
{
  "amount": 5000.00,
  "transactionType": "income",
  "category": "salary",
  "date": "2024-01-15",
  "notes": "January salary payment"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | Yes | Positive amount (min: 0.01) |
| transactionType | string | Yes | Either `income` or `expense` |
| category | string | Yes | Category name (max 255 characters) |
| date | string | Yes | Date in YYYY-MM-DD format |
| notes | string | No | Optional notes (max 500 characters) |

#### Success Response (201 Created)

```json
{
  "id": 1,
  "amount": 5000.00,
  "transactionType": "income",
  "category": "salary",
  "date": "2024-01-15",
  "notes": "January salary payment",
  "createdBy": 2,
  "isDeleted": false,
  "createdAt": "2024-01-15T13:00:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

### Get Financial Records

Retrieve financial records with filtering and pagination.

**Endpoint:** `GET /api/records`  
**Access:** Analyst, Admin  
**Authentication:** Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |
| category | string | No | Filter by category |
| transactionType | string | No | Filter by type (`income` or `expense`) |
| search | string | No | Search in notes (case-insensitive) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Items per page (default: 20, max: 100) |

#### Example Request

```
GET /api/records?dateFrom=2024-01-01&dateTo=2024-01-31&category=salary&page=1&pageSize=10
```

#### Success Response (200 OK)

```json
{
  "records": [
    {
      "id": 1,
      "amount": 5000.00,
      "transactionType": "income",
      "category": "salary",
      "date": "2024-01-15",
      "notes": "January salary payment",
      "createdAt": "2024-01-15T13:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

### Get Financial Record by ID

Retrieve a specific financial record.

**Endpoint:** `GET /api/records/:id`  
**Access:** Analyst, Admin  
**Authentication:** Required

#### Success Response (200 OK)

```json
{
  "id": 1,
  "amount": 5000.00,
  "transactionType": "income",
  "category": "salary",
  "date": "2024-01-15",
  "notes": "January salary payment",
  "createdBy": 2,
  "isDeleted": false,
  "createdAt": "2024-01-15T13:00:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

### Update Financial Record

Update an existing financial record.

**Endpoint:** `PUT /api/records/:id`  
**Access:** Admin only  
**Authentication:** Required

#### Request Body

```json
{
  "amount": 5200.00,
  "notes": "January salary payment with bonus"
}
```

#### Success Response (200 OK)

```json
{
  "id": 1,
  "amount": 5200.00,
  "transactionType": "income",
  "category": "salary",
  "date": "2024-01-15",
  "notes": "January salary payment with bonus",
  "updatedAt": "2024-01-15T14:00:00Z"
}
```

### Delete Financial Record

Delete a financial record (soft delete).

**Endpoint:** `DELETE /api/records/:id`  
**Access:** Admin only  
**Authentication:** Required

#### Success Response (200 OK)

```json
{
  "message": "Record deleted successfully"
}
```

### Restore Financial Record

Restore a soft-deleted financial record.

**Endpoint:** `POST /api/records/:id/restore`  
**Access:** Admin only  
**Authentication:** Required

#### Success Response (200 OK)

```json
{
  "id": 1,
  "amount": 5200.00,
  "transactionType": "income",
  "category": "salary",
  "date": "2024-01-15",
  "notes": "January salary payment with bonus",
  "isDeleted": false,
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

---

## Dashboard Endpoints

All dashboard endpoints are accessible to **Viewer**, **Analyst**, and **Admin** roles.

### Get Financial Summary

Get aggregated financial summary.

**Endpoint:** `GET /api/dashboard/summary`  
**Access:** Viewer, Analyst, Admin  
**Authentication:** Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |

#### Example Request

```
GET /api/dashboard/summary?dateFrom=2024-01-01&dateTo=2024-01-31
```

#### Success Response (200 OK)

```json
{
  "totalIncome": 5200.00,
  "totalExpenses": 1850.00,
  "netBalance": 3350.00,
  "recordCount": 8
}
```

### Get Category Totals

Get category-wise totals grouped by transaction type.

**Endpoint:** `GET /api/dashboard/categories`  
**Access:** Viewer, Analyst, Admin  
**Authentication:** Required

#### Query Parameters

Same as summary endpoint.

#### Success Response (200 OK)

```json
{
  "categories": [
    {
      "category": "salary",
      "total": 5200.00,
      "transactionType": "income",
      "count": 1
    },
    {
      "category": "groceries",
      "total": 450.00,
      "transactionType": "expense",
      "count": 3
    },
    {
      "category": "utilities",
      "total": 200.00,
      "transactionType": "expense",
      "count": 2
    }
  ],
  "count": 3
}
```

### Get Monthly Trends

Get monthly income/expense trends.

**Endpoint:** `GET /api/dashboard/trends/monthly`  
**Access:** Viewer, Analyst, Admin  
**Authentication:** Required

#### Query Parameters

Same as summary endpoint.

#### Success Response (200 OK)

```json
{
  "trends": [
    {
      "period": "2024-01",
      "income": 5200.00,
      "expenses": 1850.00,
      "balance": 3350.00
    },
    {
      "period": "2023-12",
      "income": 5000.00,
      "expenses": 2100.00,
      "balance": 2900.00
    }
  ],
  "count": 2
}
```

### Get Weekly Trends

Get weekly income/expense trends.

**Endpoint:** `GET /api/dashboard/trends/weekly`  
**Access:** Viewer, Analyst, Admin  
**Authentication:** Required

#### Query Parameters

Same as summary endpoint.

#### Success Response (200 OK)

```json
{
  "trends": [
    {
      "period": "2024-W03",
      "income": 5200.00,
      "expenses": 850.00,
      "balance": 4350.00
    },
    {
      "period": "2024-W02",
      "income": 0.00,
      "expenses": 1000.00,
      "balance": -1000.00
    }
  ],
  "count": 2
}
```

### Get Recent Activity

Get recent financial activity.

**Endpoint:** `GET /api/dashboard/recent`  
**Access:** Viewer, Analyst, Admin  
**Authentication:** Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of records (default: 10, max: 50) |
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |

#### Success Response (200 OK)

```json
{
  "records": [
    {
      "id": 8,
      "amount": 150.00,
      "transactionType": "expense",
      "category": "groceries",
      "date": "2024-01-15",
      "notes": "Weekly shopping"
    },
    {
      "id": 7,
      "amount": 5200.00,
      "transactionType": "income",
      "category": "salary",
      "date": "2024-01-15",
      "notes": "January salary"
    }
  ],
  "count": 2
}
```

---

## Role-Based Access Control

### Access Control Matrix

| Endpoint | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| POST /api/auth/register | ✓ | ✓ | ✓ |
| POST /api/auth/login | ✓ | ✓ | ✓ |
| POST /api/users | ✗ | ✗ | ✓ |
| GET /api/users | ✗ | ✗ | ✓ |
| GET /api/users/:id | ✗ | ✗ | ✓ |
| PATCH /api/users/:id/role | ✗ | ✗ | ✓ |
| PATCH /api/users/:id/status | ✗ | ✗ | ✓ |
| POST /api/records | ✗ | ✗ | ✓ |
| GET /api/records | ✗ | ✓ | ✓ |
| GET /api/records/:id | ✗ | ✓ | ✓ |
| PUT /api/records/:id | ✗ | ✗ | ✓ |
| DELETE /api/records/:id | ✗ | ✗ | ✓ |
| POST /api/records/:id/restore | ✗ | ✗ | ✓ |
| GET /api/dashboard/summary | ✓ | ✓ | ✓ |
| GET /api/dashboard/categories | ✓ | ✓ | ✓ |
| GET /api/dashboard/trends/* | ✓ | ✓ | ✓ |
| GET /api/dashboard/recent | ✓ | ✓ | ✓ |

### Role Descriptions

- **Viewer**: Can only access dashboard summaries and aggregated data
- **Analyst**: Can view individual financial records plus all dashboard features
- **Admin**: Full access to all endpoints including user management and record CRUD operations

---

## Health Check

### System Health

Check if the API is running and database is connected.

**Endpoint:** `GET /health`  
**Access:** Public

#### Success Response (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600.5
}
```

---

## Example Usage

### Complete Workflow Example

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "role": "admin"
  }'

# 2. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "SecurePass123!"
  }'

# 3. Create a financial record (use token from login)
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 5000.00,
    "transactionType": "income",
    "category": "salary",
    "date": "2024-01-15",
    "notes": "January salary"
  }'

# 4. Get dashboard summary
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman Collection

A Postman collection with all endpoints and example requests is available in the repository at `postman/Finance-Backend-API.postman_collection.json`.

---

## Support

For questions about the API or to report issues, please refer to the main README.md or open an issue in the repository.