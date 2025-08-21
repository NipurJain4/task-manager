const express = require('express');
const { query } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { categorySchemas, validate } = require('../utils/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/categories
 * @desc    Get all categories for authenticated user
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        c.id, c.name, c.color, c.created_at,
        COUNT(t.id) as task_count
      FROM categories c
      LEFT JOIN tasks t ON c.id = t.category_id AND t.user_id = $1
      WHERE c.user_id = $1 OR c.user_id IS NULL
      GROUP BY c.id, c.name, c.color, c.created_at
      ORDER BY c.created_at ASC`,
      [userId]
    );

    // Convert task_count to number
    const categories = result.rows.map(category => ({
      ...category,
      task_count: parseInt(category.task_count)
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        c.id, c.name, c.color, c.created_at,
        COUNT(t.id) as task_count
      FROM categories c
      LEFT JOIN tasks t ON c.id = t.category_id AND t.user_id = $2
      WHERE c.id = $1 AND (c.user_id = $2 OR c.user_id IS NULL)
      GROUP BY c.id, c.name, c.color, c.created_at`,
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = {
      ...result.rows[0],
      task_count: parseInt(result.rows[0].task_count)
    };

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
router.post('/', validate(categorySchemas.create), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    // Check if category with same name already exists for user
    const existingCategory = await query(
      'SELECT id FROM categories WHERE name = $1 AND user_id = $2',
      [name, userId]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const result = await query(
      'INSERT INTO categories (name, color, user_id) VALUES ($1, $2, $3) RETURNING id, name, color, created_at',
      [name, color, userId]
    );

    const category = {
      ...result.rows[0],
      task_count: 0
    };

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put('/:id', validate(categorySchemas.update), async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    // Check if category exists and belongs to user
    const existingCategory = await query(
      'SELECT id, user_id FROM categories WHERE id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if user owns the category (can't update default categories)
    if (existingCategory.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update default categories'
      });
    }

    // Check if name is being updated and if it already exists
    if (updates.name) {
      const duplicateCategory = await query(
        'SELECT id FROM categories WHERE name = $1 AND user_id = $2 AND id != $3',
        [updates.name, userId, categoryId]
      );

      if (duplicateCategory.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add WHERE clause parameters
    updateValues.push(categoryId, userId);

    const result = await query(
      `UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
      RETURNING id, name, color, created_at`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;

    // Check if category exists and belongs to user
    const existingCategory = await query(
      'SELECT id, user_id FROM categories WHERE id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if user owns the category (can't delete default categories)
    if (existingCategory.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default categories'
      });
    }

    // Check if category has tasks
    const tasksResult = await query(
      'SELECT COUNT(*) FROM tasks WHERE category_id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    const taskCount = parseInt(tasksResult.rows[0].count);

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${taskCount} task(s). Please reassign or delete the tasks first.`
      });
    }

    // Delete category
    await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/categories/:id/tasks
 * @desc    Get all tasks in a category
 * @access  Private
 */
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;

    // Check if category exists and user has access
    const categoryResult = await query(
      'SELECT id, name FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
      [categoryId, userId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get tasks in category
    const tasksResult = await query(
      `SELECT 
        id, title, description, status, priority, due_date, 
        created_at, updated_at, completed_at
      FROM tasks 
      WHERE category_id = $1 AND user_id = $2
      ORDER BY created_at DESC`,
      [categoryId, userId]
    );

    res.json({
      success: true,
      data: {
        category: categoryResult.rows[0],
        tasks: tasksResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
