import { useState, useEffect } from 'react'
import { categoriesAPI } from '../services/api'
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesAPI.getAll()
      if (response.success) {
        setCategories(response.data)
      }
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await categoriesAPI.delete(categoryId)
      if (response.success) {
        setCategories(categories.filter(category => category.id !== categoryId))
        toast.success('Category deleted successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const canDelete = (category) => {
    // Can't delete default categories (those without user_id) or categories with tasks
    return category.user_id && category.task_count === 0
  }

  const canEdit = (category) => {
    // Can only edit user-created categories
    return category.user_id
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your tasks with categories</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="card">
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new category.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 btn-primary btn-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {category.task_count} task{category.task_count !== 1 ? 's' : ''}
                        </p>
                        {!category.user_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {category.user_id && (
                      <div className="flex items-center space-x-1">
                        {canEdit(category) && (
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                        {canDelete(category) && (
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {category.task_count > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Tasks in this category</span>
                        <span className="font-medium">{category.task_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Category Modal */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-gray-500 mb-4">
              Category creation/editing form would go here. This is a placeholder for the modal.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingCategory(null)
                }}
                className="btn-secondary btn-md"
              >
                Cancel
              </button>
              <button className="btn-primary btn-md">
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
