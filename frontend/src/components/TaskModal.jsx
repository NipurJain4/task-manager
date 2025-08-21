import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Calendar, Tag, AlertCircle } from 'lucide-react'
import { tasksAPI } from '../services/api'
import toast from 'react-hot-toast'

const TaskModal = ({ isOpen, onClose, task, categories, onTaskSaved }) => {
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      category_id: ''
    }
  })

  useEffect(() => {
    if (task) {
      // Editing existing task
      setValue('title', task.title || '')
      setValue('description', task.description || '')
      setValue('status', task.status || 'pending')
      setValue('priority', task.priority || 'medium')
      setValue('due_date', task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '')
      setValue('category_id', task.category_id || '')
    } else {
      // Creating new task
      reset({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        category_id: ''
      })
    }
  }, [task, setValue, reset])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Clean the data
      const taskData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        status: data.status,
        priority: data.priority,
        due_date: data.due_date || null,
        category_id: data.category_id || null
      }

      let response
      if (task) {
        // Update existing task
        response = await tasksAPI.update(task.id, taskData)
      } else {
        // Create new task
        response = await tasksAPI.create(taskData)
      }

      if (response.success) {
        toast.success(task ? 'Task updated successfully!' : 'Task created successfully!')
        onTaskSaved()
        onClose()
      } else {
        toast.error(response.message || 'Failed to save task')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(error.response?.data?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {task ? 'Edit Task' : 'Create New Task'}
                </h3>
                <p className="text-sm text-gray-600">
                  {task ? 'Update your task details' : 'Add a new task to your list'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body space-y-6">
          {/* Title */}
          <div>
            <label className="form-label">
              Task Title *
            </label>
            <input
              {...register('title', {
                required: 'Task title is required',
                minLength: { value: 1, message: 'Title must not be empty' },
                maxLength: { value: 200, message: 'Title must be less than 200 characters' }
              })}
              type="text"
              className="form-input"
              placeholder="Enter task title..."
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">
              Description
            </label>
            <textarea
              {...register('description', {
                maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
              })}
              className="form-textarea"
              rows={3}
              placeholder="Enter task description (optional)..."
            />
            {errors.description && (
              <p className="form-error">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Status
              </label>
              <select {...register('status')} className="form-select">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Priority
              </label>
              <select {...register('priority')} className="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              <input
                {...register('due_date')}
                type="date"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                <Tag className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select {...register('category_id')} className="form-select">
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-md"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="btn btn-primary btn-md"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="spinner spinner-sm mr-2"></div>
                {task ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              task ? 'Update Task' : 'Create Task'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskModal
