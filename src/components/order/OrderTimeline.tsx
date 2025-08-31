interface Activity {
  id: number
  type: string
  title: string
  description: string
  timestamp: string | null
  status: 'completed' | 'current' | 'pending'
}

interface OrderFile {
  id: string
  filename: string
  file_url: string
  file_size: number
  created_at: string
}

interface OrderTimelineProps {
  activities: Activity[]
  orderFiles?: OrderFile[]
}

export default function OrderTimeline({ activities, orderFiles = [] }: OrderTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'current':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )
      case 'pending':
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        )
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>
      
      <div className="relative">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-start space-x-4 pb-8">
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-4 top-8 w-px h-full bg-gray-200"></div>
            )}
            
            {/* Status icon */}
            {getStatusIcon(activity.status)}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${
                  activity.status === 'completed' ? 'text-green-700' :
                  activity.status === 'current' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  {activity.title}
                </h3>
                
                {activity.timestamp && (
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </span>
                )}
              </div>
              
              <p className={`text-sm mt-1 ${
                activity.status === 'completed' ? 'text-gray-700' :
                activity.status === 'current' ? 'text-gray-700' :
                'text-gray-500'
              }`}>
                {activity.description}
              </p>

              {/* Show actual uploaded files */}
              {activity.type === 'work_submitted' && activity.status === 'completed' && orderFiles.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Deliverables Ready for Review</h4>
                  <div className="space-y-2">
                    {orderFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center text-blue-700">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate max-w-[200px]">{file.filename}</span>
                          <span className="ml-2 text-gray-500">({(file.file_size / 1024 / 1024).toFixed(1)}MB)</span>
                        </div>
                        <a 
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show message if no files uploaded */}
              {activity.type === 'work_submitted' && activity.status === 'completed' && orderFiles.length === 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">No files uploaded yet.</p>
                </div>
              )}

              {activity.type === 'revision' && activity.status === 'completed' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Revision Requested</h4>
                  <p className="text-xs text-yellow-700">
                    "Could you make the background music a bit louder and add the brand logo in the corner?"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}