# Database Schema Documentation

This document provides comprehensive documentation of the database schema for the Finance Backend system, including table structures, relationships, constraints, indexes, and migration strategy.

## Overview

The Finance Backend uses PostgreSQL as the primary database with a simple but robust schema designed for financial data integrity and performance. The schema consists of two main tables with a clear relationship structure.

## Database Configuration

- **Database Engine**: PostgreSQL 12+
- **ORM**: Objection.js with Knex.js
- **Migration Tool**: Knex.js migrations
- **Character Set**: UTF-8
- **Timezone**: UTC for all timestamps

---

## Tables

### 1. Users Table

The `users` table stores user account information and authentication data.

#### Table Structure

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enum type for user roles
CREATE TYPE user_role AS ENUM ('viewer', 'analyst', 'admin');
```

#### Column Details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `username` | VARCHAR(255) | NOT NULL, UNIQUE | Unique username for login |
| `email` | VARCHAR(255) | NOT NULL | User's email address |
| `password_hash` | VARCHAR(255) | NULL | bcrypt hashed password (optional for auth) |
| `role` | ENUM | NOT NULL | User role: 'viewer', 'analyst', or 'admin' |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Constraints

- **Primary Key**: `id`
- **Unique Constraints**: `username`
- **Check Constraints**: `role` must be one of: 'viewer', 'analyst', 'admin'
- **Not Null**: `username`, `email`, `role`

#### Indexes

```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### Business Rules

1. **Username Uniqueness**: Each username must be unique across the system
2. **Role Hierarchy**: viewer < analyst < admin (in terms of permissions)
3. **Active Status**: Inactive users cannot access protected endpoints
4. **Email Format**: Must be validated at application level
5. **Password Security**: Passwords hashed with bcrypt (salt rounds ≥ 10)

---

### 2. Financial Records Table

The `financial_records` table stores all financial transaction data.

#### Table Structure

```sql
CREATE TABLE financial_records (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type transaction_type NOT NULL,
    category VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enum type for transaction types
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
```

#### Column Details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `amount` | DECIMAL(15,2) | NOT NULL, > 0 | Transaction amount (positive values only) |
| `transaction_type` | ENUM | NOT NULL | Type: 'income' or 'expense' |
| `category` | VARCHAR(255) | NOT NULL | Transaction category (e.g., 'salary', 'groceries') |
| `date` | DATE | NOT NULL | Transaction date |
| `notes` | TEXT | NULL | Optional transaction notes/description |
| `created_by` | INTEGER | FK to users(id) | User who created the record |
| `is_deleted` | BOOLEAN | DEFAULT false | Soft delete flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Constraints

- **Primary Key**: `id`
- **Foreign Keys**: `created_by` → `users(id)` (ON DELETE SET NULL)
- **Check Constraints**: `amount > 0`
- **Not Null**: `amount`, `transaction_type`, `category`, `date`

#### Indexes

```sql
CREATE INDEX idx_financial_records_date ON financial_records(date);
CREATE INDEX idx_financial_records_category ON financial_records(category);
CREATE INDEX idx_financial_records_type ON financial_records(transaction_type);
CREATE INDEX idx_financial_records_created_by ON financial_records(created_by);
CREATE INDEX idx_financial_records_is_deleted ON financial_records(is_deleted);
```

#### Business Rules

1. **Positive Amounts**: All amounts must be positive (> 0)
2. **Transaction Types**: Only 'income' or 'expense' allowed
3. **Date Validation**: Must be valid date format (YYYY-MM-DD)
4. **Soft Delete**: Records marked as deleted are excluded from normal queries
5. **Audit Trail**: Created by user is tracked for accountability
6. **Categories**: Free-form text for flexibility

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────┐
│     users       │         │  financial_records   │
├─────────────────┤         ├──────────────────────┤
│ id (PK)         │◄────────┤ created_by (FK)      │
│ username        │         │ id (PK)              │
│ email           │         │ amount               │
│ password_hash   │         │ transaction_type     │
│ role            │         │ category             │
│ is_active       │         │ date                 │
│ created_at      │         │ notes                │
│ updated_at      │         │ is_deleted           │
└─────────────────┘         │ created_at           │
                            │ updated_at           │
                            └──────────────────────┘
```

### Relationship Details

#### Users → Financial Records (One-to-Many)

- **Type**: One-to-Many
- **Foreign Key**: `financial_records.created_by` → `users.id`
- **Delete Behavior**: SET NULL (preserve records when user is deleted)
- **Description**: Each user can create multiple financial records

**Relationship Rules:**
- A user can have zero or many financial records
- A financial record belongs to at most one user (can be NULL if user deleted)
- When a user is deleted, their records remain but `created_by` is set to NULL

---

## Data Types and Precision

### Numeric Data

- **Amount**: `DECIMAL(15, 2)` - Supports up to 999,999,999,999.99
- **IDs**: `SERIAL` (32-bit integer, auto-incrementing)
- **Boolean**: `BOOLEAN` for flags

### Text Data

- **Short Text**: `VARCHAR(255)` for usernames, emails, categories
- **Long Text**: `TEXT` for notes (unlimited length)
- **Enums**: Native PostgreSQL ENUMs for constrained values

### Date/Time Data

- **Dates**: `DATE` for transaction dates (YYYY-MM-DD)
- **Timestamps**: `TIMESTAMP` with timezone for audit fields

---

## Indexes and Performance

### Index Strategy

The database uses strategic indexing to optimize common query patterns:

#### Users Table Indexes

```sql
-- Primary key (automatic)
CREATE UNIQUE INDEX users_pkey ON users(id);

-- Authentication lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### Financial Records Table Indexes

```sql
-- Primary key (automatic)
CREATE UNIQUE INDEX financial_records_pkey ON financial_records(id);

-- Date-based queries (dashboard, filtering)
CREATE INDEX idx_financial_records_date ON financial_records(date);

-- Category filtering
CREATE INDEX idx_financial_records_category ON financial_records(category);

-- Transaction type filtering
CREATE INDEX idx_financial_records_type ON financial_records(transaction_type);

-- User-based queries
CREATE INDEX idx_financial_records_created_by ON financial_records(created_by);

-- Soft delete filtering
CREATE INDEX idx_financial_records_is_deleted ON financial_records(is_deleted);
```

### Query Performance Optimization

#### Common Query Patterns

1. **Dashboard Summaries**: Aggregations by date range and transaction type
2. **Record Filtering**: Date ranges, categories, transaction types
3. **User Authentication**: Username/email lookups
4. **Audit Queries**: Records by creator

#### Composite Index Considerations

For future optimization, consider composite indexes for common filter combinations:

```sql
-- Date + transaction type (for dashboard queries)
CREATE INDEX idx_records_date_type ON financial_records(date, transaction_type);

-- Date + category (for category trends)
CREATE INDEX idx_records_date_category ON financial_records(date, category);

-- Active records only (excluding soft deleted)
CREATE INDEX idx_records_active ON financial_records(date, transaction_type) 
WHERE is_deleted = false;
```

---

## Migration Strategy

### Migration Management

The system uses Knex.js for database migrations with the following strategy:

#### Migration Files

```
migrations/
├── 20240101000001_create_users_table.js
├── 20240101000002_create_financial_records_table.js
└── [future migrations...]
```

#### Migration Commands

```bash
# Run all pending migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

### Migration Best Practices

1. **Incremental Changes**: Each migration should be atomic and reversible
2. **Data Preservation**: Always include rollback logic that preserves data
3. **Index Management**: Create indexes in separate migrations for large tables
4. **Constraint Addition**: Add constraints carefully to avoid blocking operations
5. **Testing**: Test migrations on copy of production data

### Example Migration Structure

```javascript
// Migration template
exports.up = function(knex) {
    // Forward migration logic
    return knex.schema.createTable('table_name', (table) => {
        // Table definition
    });
};

exports.down = function(knex) {
    // Rollback logic
    return knex.schema.dropTableIfExists('table_name');
};
```

---

## Data Integrity and Constraints

### Referential Integrity

#### Foreign Key Constraints

```sql
-- Financial records reference users
ALTER TABLE financial_records 
ADD CONSTRAINT fk_financial_records_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
```

#### Constraint Behavior

- **ON DELETE SET NULL**: Preserve financial records when user is deleted
- **ON UPDATE CASCADE**: Update references when primary key changes (rare)

### Data Validation Constraints

#### Database-Level Constraints

```sql
-- Amount must be positive
ALTER TABLE financial_records 
ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);

-- Role must be valid
ALTER TABLE users 
ADD CONSTRAINT chk_role_valid CHECK (role IN ('viewer', 'analyst', 'admin'));

-- Transaction type must be valid
ALTER TABLE financial_records 
ADD CONSTRAINT chk_transaction_type_valid 
CHECK (transaction_type IN ('income', 'expense'));
```

#### Application-Level Validation

Additional validation is performed at the application level:

- Email format validation
- Username format and length
- Date format validation
- Category length limits
- Notes length limits

---

## Security Considerations

### Data Protection

#### Sensitive Data Handling

- **Passwords**: Never stored in plain text, always hashed with bcrypt
- **Personal Information**: Email addresses are stored but not exposed in logs
- **Financial Data**: All amounts stored with proper precision

#### Access Control

- **Row-Level Security**: Can be implemented for multi-tenant scenarios
- **Column-Level Security**: Sensitive columns can be restricted
- **Audit Logging**: All changes tracked with timestamps and user IDs

### SQL Injection Prevention

- **Parameterized Queries**: All queries use parameter binding
- **ORM Protection**: Objection.js provides built-in SQL injection protection
- **Input Validation**: All inputs validated before database operations

---

## Backup and Recovery

### Backup Strategy

#### Regular Backups

```bash
# Full database backup
pg_dump -h localhost -U postgres -d finance_backend > backup.sql

# Schema-only backup
pg_dump -h localhost -U postgres -d finance_backend --schema-only > schema.sql

# Data-only backup
pg_dump -h localhost -U postgres -d finance_backend --data-only > data.sql
```

#### Point-in-Time Recovery

PostgreSQL supports point-in-time recovery with Write-Ahead Logging (WAL):

```bash
# Enable WAL archiving in postgresql.conf
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
```

### Disaster Recovery

1. **Regular Backups**: Automated daily backups
2. **Offsite Storage**: Backups stored in different location
3. **Recovery Testing**: Regular recovery procedure testing
4. **Documentation**: Clear recovery procedures documented

---

## Monitoring and Maintenance

### Performance Monitoring

#### Key Metrics to Monitor

- **Query Performance**: Slow query log analysis
- **Index Usage**: Monitor index hit ratios
- **Connection Pool**: Monitor connection usage
- **Disk Usage**: Monitor table and index sizes

#### Monitoring Queries

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';

-- Check index usage
SELECT 
    indexrelname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes;

-- Check slow queries
SELECT 
    query,
    mean_time,
    calls
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

### Maintenance Tasks

#### Regular Maintenance

```sql
-- Update table statistics
ANALYZE users;
ANALYZE financial_records;

-- Vacuum tables (reclaim space)
VACUUM users;
VACUUM financial_records;

-- Reindex if needed
REINDEX TABLE users;
REINDEX TABLE financial_records;
```

#### Automated Maintenance

```bash
# Add to cron for regular maintenance
0 2 * * 0 psql -d finance_backend -c "VACUUM ANALYZE;"
```

---

## Future Schema Considerations

### Potential Enhancements

#### Additional Tables

1. **Categories Table**: Normalize categories with predefined list
2. **Audit Log Table**: Track all changes for compliance
3. **Sessions Table**: Store user sessions if moving away from JWT
4. **Files Table**: Support for receipt/document attachments

#### Schema Evolution

1. **Partitioning**: Partition financial_records by date for large datasets
2. **Archiving**: Move old records to archive tables
3. **Multi-tenancy**: Add organization/tenant support
4. **Internationalization**: Support for multiple currencies

#### Example Future Migration

```javascript
// Example: Add categories table
exports.up = function(knex) {
    return knex.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable().unique();
        table.string('description', 500);
        table.enum('type', ['income', 'expense', 'both']).notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });
};
```

---

## Conclusion

The Finance Backend database schema is designed with simplicity, integrity, and performance in mind. The two-table structure provides a solid foundation that can be extended as requirements evolve while maintaining data consistency and query performance.

Key strengths of the current schema:

- **Data Integrity**: Strong constraints and foreign key relationships
- **Performance**: Strategic indexing for common query patterns
- **Flexibility**: Extensible design that can accommodate future requirements
- **Security**: Proper handling of sensitive data with audit trails
- **Maintainability**: Clear structure with comprehensive documentation

The migration strategy and monitoring recommendations ensure the database can be maintained and evolved safely over time.