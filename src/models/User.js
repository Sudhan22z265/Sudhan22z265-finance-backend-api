const { Model } = require('objection');

class User extends Model {
    static get tableName() {
        return 'users';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['username', 'email', 'role'],

            properties: {
                id: { type: 'integer' },
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 255
                },
                email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 255
                },
                passwordHash: {
                    type: ['string', 'null'],
                    maxLength: 255
                },
                role: {
                    type: 'string',
                    enum: ['viewer', 'analyst', 'admin']
                },
                isActive: {
                    type: 'boolean',
                    default: true
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        };
    }

    // Map camelCase to snake_case for database columns
    static get columnNameMappers() {
        return {
            parse(obj) {
                return {
                    id: obj.id,
                    username: obj.username,
                    email: obj.email,
                    passwordHash: obj.password_hash,
                    role: obj.role,
                    isActive: obj.is_active,
                    createdAt: obj.created_at,
                    updatedAt: obj.updated_at
                };
            },
            format(obj) {
                return {
                    id: obj.id,
                    username: obj.username,
                    email: obj.email,
                    password_hash: obj.passwordHash,
                    role: obj.role,
                    is_active: obj.isActive,
                    created_at: obj.createdAt,
                    updated_at: obj.updatedAt
                };
            }
        };
    }

    // Define relationships
    static get relationMappings() {
        const FinancialRecord = require('./FinancialRecord');

        return {
            financialRecords: {
                relation: Model.HasManyRelation,
                modelClass: FinancialRecord,
                join: {
                    from: 'users.id',
                    to: 'financial_records.created_by'
                }
            }
        };
    }

    // Automatically update timestamps
    $beforeInsert() {
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    $beforeUpdate() {
        this.updatedAt = new Date().toISOString();
    }

    // Hide password hash in JSON responses
    $formatJson(json) {
        json = super.$formatJson(json);
        delete json.passwordHash;
        return json;
    }
}

module.exports = User;
