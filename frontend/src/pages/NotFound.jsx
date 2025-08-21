import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-2 text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary btn-md inline-flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-outline btn-md inline-flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you think this is an error, please{' '}
            <a href="mailto:support@taskmanager.com" className="text-primary-600 hover:text-primary-500">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
