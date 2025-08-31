import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface KOLProfileProps {
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    country?: string
    followers?: number
    avg_views_per_content?: number
  }
}

export default function KOLProfile({ kol }: KOLProfileProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`
    }
    return count.toString()
  }

  const handleContactKOL = () => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/messages?recipient=${kol.id}`)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-900 mb-6">About the KOL</h2>
      
      <div className="flex items-start space-x-4 mb-6">
        <img
          src={kol.avatar_url || '/api/placeholder/64/64'}
          alt={kol.full_name}
          className="w-16 h-16 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/api/placeholder/64/64'
          }}
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{kol.full_name}</h3>
          <Link 
            href={`/profile/${kol.username}`}
            className="text-blue-600 hover:text-blue-800 transition-colors mb-2 block"
          >
            @{kol.username}
          </Link>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {kol.followers && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>{formatFollowers(kol.followers)} followers</span>
              </div>
            )}
            
            {kol.country && (
              <div className="flex items-center space-x-1">
                <span>🌍</span>
                <span>{kol.country}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {kol.bio && (
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{kol.bio}</p>
        </div>
      )}

      {(kol.followers || kol.avg_views_per_content) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {kol.followers && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatFollowers(kol.followers)}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
          )}
          
          {kol.avg_views_per_content && (
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatFollowers(kol.avg_views_per_content)}</div>
              <div className="text-sm text-gray-600">Avg. Views</div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-3">
        <Link 
          href={`/profile/${kol.username}`}
          className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          View Profile
        </Link>
        <button 
          onClick={handleContactKOL}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
          <span>Contact KOL</span>
        </button>
      </div>
    </div>
  )
}