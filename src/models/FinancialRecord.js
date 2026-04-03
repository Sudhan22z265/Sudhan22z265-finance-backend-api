const { Model } = require('objection');

class FinancialRecord extends Model {
    static get tableName() {
        return 'financial_records';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['amount', 'transactionType', 'category', 'date'],

            properties: {
                id: { type: 'integer' },
                amount: {
                    type: 'number',
                    minimum: 0.01,
                    maximum: 999999999999.99
                },
                transactionType: {
                    type: 'string',
                    enum: ['income', 'expense']
                },
                category: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255
                },
                date: {
                    type: 'string',
                    format: 'date'
                },
                notes: {
                    type: ['string', 'null']
                },
                createdBy: {
                    type: ['integer', 'null']
                },
                isDeleted: {
                    type: 'boolean',
                    default: false
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
                    amount: obj.amount,
                    transactionType: obj.transaction_type,
                    category: obj.category,
                    date: obj.date,
                    notes: obj.notes,
                    createdBy: obj.created_by,
                    isDeleted: obj.is_deleted,
                    createdAt: obj.created_at,
                    updatedAt: obj.updated_at
                };
            },
            format(obj) {
                return {
                    id: obj.id,
                    amount: obj.amount,
                    transaction_type: obj.transactionType,
                    category: obj.category,
                    date: obj.date,
                    notes: obj.notes,
                    created_by: obj.createdBy,
                    is_deleted: obj.isDeleted,
                    created_at: obj.createdAt,
                    updated_at: obj.updatedAt
                };
            }
        };
    }

    // Define relationships
    static get relationMappings() {
        const User = require('./User');

        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'financial_records.created_by',
                    to: 'users.id'
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

    // Custom validation for amount
    $beforeInsert(queryContext) {
        super.$beforeInsert(queryContext);

        if (this.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
    }

    $beforeUpdate(opt, queryContext) {
        super.$beforeUpdate(opt, queryContext);

        if (this.amount !== undefined && this.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
    }
}

module.exports = FinancialRecord;
