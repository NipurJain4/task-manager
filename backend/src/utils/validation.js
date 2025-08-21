const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    avatar_url: Joi.string().uri().allow('')
  })
};

// Task validation schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    status: Joi.string().valid('pending', 'in_progress', 'completed').default('pending'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    due_date: Joi.date().iso().allow(null),
    category_id: Joi.number().integer().positive().allow(null)
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000).allow(''),
    status: Joi.string().valid('pending', 'in_progress', 'completed'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    due_date: Joi.date().iso().allow(null),
    category_id: Joi.number().integer().positive().allow(null)
  })
};

// Category validation schemas
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6')
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(50),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i)
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = value;
    next();
  };
};

// Common query schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('created_at', 'updated_at', 'title', 'due_date', 'priority').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  taskFilters: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    category_id: Joi.number().integer().positive(),
    due_date_from: Joi.date().iso(),
    due_date_to: Joi.date().iso(),
    search: Joi.string().max(100)
  })
};

module.exports = {
  userSchemas,
  taskSchemas,
  categorySchemas,
  querySchemas,
  validate,
  validateQuery
};
