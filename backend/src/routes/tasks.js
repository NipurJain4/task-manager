const express = require('express');
const { query } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { taskSchemas, querySchemas, validate, validateQuery } = require('../utils/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for authenticated user
 * @access  Private
 */
router.get('/', validateQuery(querySchemas.pagination.concat(querySchemas.taskFilters)), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, sort, order, status, priority, category_id, due_date_from, due_date_to, search } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['t.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`t.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`t.priority = $${paramCount}`);
      queryParams.push(priority);
    }

    if (category_id) {
      paramCount++;
      whereConditions.push(`t.category_id = $${paramCount}`);
      queryParams.push(category_id);
    }

    if (due_date_from) {
      paramCount++;
      whereConditions.push(`t.due_date >= $${paramCount}`);
      queryParams.push(due_date_from);
    }

    if (due_date_to) {
      paramCount++;
      whereConditions.push(`t.due_date <= $${paramCount}`);
      queryParams.push(due_date_to);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM tasks t WHERE ${whereClause}`,
      queryParams
    );
    const totalTasks = parseInt(countResult.rows[0].count);

    // Get tasks with pagination
    const tasksResult = await query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.due_date, 
        t.created_at, t.updated_at, t.completed_at,
        c.id as category_id, c.name as category_name, c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      ORDER BY t.${sort} ${order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      success: true,
      data: {
        tasks: tasksResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalTasks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics for authenticated user
 * @access  Private
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN due_date = CURRENT_DATE AND status != 'completed' THEN 1 END) as due_today_tasks
      FROM tasks 
      WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    // Convert string counts to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]);
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task by ID
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.due_date, 
        t.created_at, t.updated_at, t.completed_at,
        c.id as category_id, c.name as category_name, c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 AND t.user_id = $2`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private
 */
router.post('/', validate(taskSchemas.create), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, status, priority, due_date, category_id } = req.body;

    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, due_date, category_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at`,
      [title, description, status, priority, due_date, category_id, userId]
    );

    const task = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put('/:id', validate(taskSchemas.update), async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    // Check if task exists and belongs to user
    const existingTask = await query(
      'SELECT id, status FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (existingTask.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
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

    // Add completed_at timestamp if status is being changed to completed
    if (updates.status === 'completed' && existingTask.rows[0].status !== 'completed') {
      paramCount++;
      updateFields.push(`completed_at = $${paramCount}`);
      updateValues.push(new Date());
    } else if (updates.status && updates.status !== 'completed') {
      paramCount++;
      updateFields.push(`completed_at = $${paramCount}`);
      updateValues.push(null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add WHERE clause parameters
    updateValues.push(taskId, userId);

    const result = await query(
      `UPDATE tasks 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at, completed_at`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
