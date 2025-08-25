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
    category?: string
    platforms?: string[]
    country?: string
    language?: string[]
    avg_views_per_content?: number
    social_links?: {
      [platform: string]: string
    }
    kol: {
      username: string
      full_name: string
      profile_image: string
      rating: number
      total_orders: number
    }
  }
}

export default function GigHeader({ gig }: GigHeaderProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`
    }
    return views.toString()
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
            {gig.category && (
              <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                📁 {gig.category}
              </span>
            )}
            {gig.platforms?.map(platformName => {
              const platform = PLATFORMS.find(p => p.name === platformName)
              return platform ? (
                <span
                  key={platformName}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${platform.color}`}
                >
                  <span className="mr-2">{platform.logo}</span>
                  {platform.name}
                </span>
              ) : null
            })}
            {gig.country && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                🌍 {gig.country}
              </span>
            )}
            {gig.language?.map(lang => (
              <span key={lang} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                💬 {lang}
              </span>
            ))}
            {gig.avg_views_per_content && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {formatViews(gig.avg_views_per_content)} avg views
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img
                src={gig.kol.profile_image}
                alt={gig.kol.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{gig.kol.full_name}</h3>
                <p className="text-sm text-gray-600">@{gig.kol.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(gig.kol.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium">{gig.kol.rating}</span>
                <span>({gig.kol.total_orders} orders)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}