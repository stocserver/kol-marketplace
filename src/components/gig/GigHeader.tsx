import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const PLATFORMS = [
  {
    name: 'Instagram',
    logo: '📷',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    name: 'TikTok',
    logo: '🎵',
    color: 'bg-black text-white'
  },
  {
    name: 'YouTube',
    logo: '▶️',
    color: 'bg-red-100 text-red-800'
  },
  {
    name: 'Twitter',
    logo: '🐦',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'LinkedIn',
    logo: '💼',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'Twitch',
    logo: '🎮',
    color: 'bg-purple-100 text-purple-800'
  }
]

interface GigHeaderProps {
  gig: {
    title: string
    genre_category: string
    platform: string
    content_type: string
    kol: {
      id: string
      username: string
      full_name: string
      avatar_url?: string
      bio?: string
      country?: string
      languages?: string[]
      followers?: number
      avg_views_per_content?: number
    }
  }
}

export default function GigHeader({ gig }: GigHeaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`
    }
    return views.toString()
  }

  const handleContactKOL = () => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/messages?recipient=${gig.kol.id}`)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            {gig.title}
          </h1>

          {/* Category, Platform Tags, and Views */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              📁 {gig.genre_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            
            {(() => {
              const platform = PLATFORMS.find(p => p.name === gig.platform)
              return platform ? (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${platform.color}`}
                >
                  <span className="mr-2">{platform.logo}</span>
                  {platform.name}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {gig.platform}
                </span>
              )
            })()}
            
            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              📹 {gig.content_type}
            </span>
            
            {gig.kol.country && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                🌍 {gig.kol.country}
              </span>
            )}
            {gig.kol.languages?.map(lang => (
              <span key={lang} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                💬 {lang}
              </span>
            ))}
            {gig.kol.avg_views_per_content && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {formatViews(gig.kol.avg_views_per_content)} avg views
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={gig.kol.avatar_url || '/api/placeholder/48/48'}
                alt={gig.kol.full_name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder/48/48'
                }}
              />
              <div>
                <h3 className="font-semibold text-gray-900">{gig.kol.full_name}</h3>
                <Link 
                  href={`/profile/${gig.kol.username}`}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  @{gig.kol.username}
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {gig.kol.followers && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{gig.kol.followers.toLocaleString()}</span> followers
                </div>
              )}
              
              <button
                onClick={handleContactKOL}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}