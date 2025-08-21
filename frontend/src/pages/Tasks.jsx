import { useState, useEffect, useCallback } from 'react'
import { tasksAPI, categoriesAPI } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  CheckSquare,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskModal from '../components/TaskModal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Tasks = () => {
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category_id: ''
  })

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching tasks with filters:', filters)
      
      // Clean filters - remove empty values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value.trim()
        }
        return acc
      }, {})
      
      console.log('Clean filters being sent:', cleanFilters)
      const response = await tasksAPI.getAll(cleanFilters)
      console.log('Tasks API response:', response)
      
      if (response && response.success) {
        setTasks(response.data.tasks || [])
        console.log('Tasks loaded successfully:', response.data.tasks?.length || 0)
      } else {
        console.error('Tasks API returned unsuccessful response:', response)
        toast.error(response?.message || 'Failed to load tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.')
      } else {
        toast.error('Failed to load tasks: ' + (error.response?.data?.message || error.message || 'Unknown error'))
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...')
      const response = await categoriesAPI.getAll()
      console.log('Categories API response:', response)
      
      if (response && response.success) {
        setCategories(response.data || [])
        console.log('Categories loaded successfully:', response.data?.length || 0)
      } else {
        console.error('Categories API returned unsuccessful response:', response)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchCategories()
  }, [fetchTasks, fetchCategories])

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await tasksAPI.delete(taskId)
      if (response.success) {
        setTasks(tasks.filter(task => task.id !== taskId))
        toast.success('Task deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await tasksAPI.update(taskId, { status: newStatus })
      if (response.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ))
        toast.success('Task status updated')
      }
    } catch (error) {
      toast.error('Failed to update task status')
    }
  }

  const handleTaskSaved = () => {
    // Refresh tasks after creating/updating
    fetchTasks()
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return badges[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Tasks
          </h1>
          <p className="text-gray-600 mt-1">Manage and organize your tasks</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={fetchTasks}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="form-input pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="form-select"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            className="form-select"
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <CheckSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Tasks</h3>
                <p className="text-sm text-gray-600">{tasks.length} tasks found</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first task.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <button
                      onClick={() => handleStatusChange(
                        task.id, 
                        task.status === 'completed' ? 'pending' : 'completed'
                      )}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-white transition-colors"
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.category_name && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: task.category_color }}
                          >
                            {task.category_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.due_date && (
                      <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-white transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false)
          setEditingTask(null)
        }}
        task={editingTask}
        categories={categories}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  )
}

export default Tasks
