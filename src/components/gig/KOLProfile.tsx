interface KOLProfileProps {
  kol: {
    id: string
    username: string
    full_name: string
    profile_image: string
    followers: number
    rating: number
    total_orders: number
    response_time: string
    bio: string
  }
}

export default function KOLProfile({ kol }: KOLProfileProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`
    }
    return count.toString()
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-900 mb-6">About the KOL</h2>
      
      <div className="flex items-start space-x-4 mb-6">
        <img
          src={kol.profile_image}
          alt={kol.full_name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{kol.full_name}</h3>
          <p className="text-blue-600 mb-2">@{kol.username}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{kol.rating}</span>
              <span>({kol.total_orders} reviews)</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>{formatFollowers(kol.followers)} followers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">{kol.bio}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{kol.total_orders}</div>
          <div className="text-sm text-gray-600">Orders Completed</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{kol.response_time}</div>
          <div className="text-sm text-gray-600">Avg. Response Time</div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
          View Profile
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
          Contact KOL
        </button>
      </div>
    </div>
  )
}