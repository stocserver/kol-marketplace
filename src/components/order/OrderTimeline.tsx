interface Activity {
  id: number
  type: string
  title: string
  description: string
  timestamp: string | null
  status: 'completed' | 'current' | 'pending'
  submissionData?: {
    number: number
    ordinal: string
    message: string
    sender: string
  }
  fileData?: {
    message: string
    sender: string
  }
}

interface OrderTimelineProps {
  activities: Activity[]
}

export default function OrderTimeline({ activities }: OrderTimelineProps) {
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

              {/* Show submission message if it exists and is not generic */}
              {activity.type === 'work_submitted' && activity.submissionData &&
               activity.submissionData.message &&
               !activity.submissionData.message.includes('✅ I have submitted the work') && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    📋 {activity.submissionData.ordinal} Submission Message
                  </h4>
                  <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded">
                    {activity.submissionData.message}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    By: {activity.submissionData.sender}
                  </p>
                </div>
              )}


              {/* Show file upload details */}
              {activity.type === 'file_uploaded' && activity.fileData && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-1">File Upload</h4>
                  <p className="text-sm text-green-800 bg-green-100 p-2 rounded">
                    {activity.fileData.message}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    By: {activity.fileData.sender}
                  </p>
                </div>
              )}


              {activity.type === 'revision' && activity.status === 'completed' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Revision Requested</h4>
                  <p className="text-xs text-yellow-700">
                    &quot;Could you make the background music a bit louder and add the brand logo in the corner?&quot;
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