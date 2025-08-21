import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Plus,
  Calendar,
  Target,
  Zap,
  Award,
  Activity,
  BarChart3,
  ArrowUpRight
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getDashboard()
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          Try again
        </button>
      </div>
    )
  }

  const { stats, recentTasks, upcomingTasks } = dashboardData || {}

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: Target,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Completed',
      value: stats?.completed_tasks || 0,
      icon: Award,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'In Progress',
      value: stats?.in_progress_tasks || 0,
      icon: Activity,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-700',
      change: '+3%',
      changeType: 'positive'
    },
    {
      name: 'Overdue',
      value: stats?.overdue_tasks || 0,
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      change: '-5%',
      changeType: 'negative'
    }
  ]

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your productivity overview.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link 
            to="/tasks" 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgGradient}`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <ArrowUpRight className={`h-4 w-4 mr-1 ${
                      stat.changeType === 'negative' ? 'rotate-180' : ''
                    }`} />
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                  <p className="text-sm text-gray-600">Your latest activity</p>
                </div>
              </div>
              <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTasks && recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.category_name && (
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {task.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">
                          {format(new Date(task.due_date), 'MMM dd')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-gray-500 mb-4">No recent tasks</p>
                <Link 
                  to="/tasks" 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  Create your first task
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                  <p className="text-sm text-gray-600">Due in the next 7 days</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {upcomingTasks && upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.category_name && (
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {task.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">
                        {format(new Date(task.due_date), 'MMM dd')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(task.due_date), 'EEEE')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-500">No upcoming tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Get started with these common tasks</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/tasks"
              className="group flex items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">Create Task</h4>
                <p className="text-xs text-gray-600">Add a new task to your list</p>
              </div>
            </Link>
            
            <Link
              to="/categories"
              className="group flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Manage Categories</h4>
                <p className="text-xs text-gray-600">Organize your tasks</p>
              </div>
            </Link>
            
            <Link
              to="/profile"
              className="group flex items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">Update Profile</h4>
                <p className="text-xs text-gray-600">Manage your account</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
