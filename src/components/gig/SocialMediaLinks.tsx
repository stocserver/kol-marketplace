const PLATFORMS = [
  {
    name: 'Instagram',
    logo: '📷',
    color: 'bg-pink-100 text-pink-800 hover:bg-pink-200'
  },
  {
    name: 'TikTok',
    logo: '🎵',
    color: 'bg-black text-white hover:bg-gray-800'
  },
  {
    name: 'YouTube',
    logo: '▶️',
    color: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  {
    name: 'Twitter',
    logo: '🐦',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  {
    name: 'LinkedIn',
    logo: '💼',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  {
    name: 'Twitch',
    logo: '🎮',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  }
]

interface SocialMediaLinksProps {
  socialLinks: {
    [platform: string]: string
  }
  kolName: string
}

export default function SocialMediaLinks({ socialLinks, kolName }: SocialMediaLinksProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        📱 {kolName}&apos;s Social Media
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Visit my social media profiles to see my content style and engagement rates before placing your order.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(socialLinks).map(([platformName, url]) => {
          const platform = PLATFORMS.find(p => p.name === platformName)
          if (!platform) return null
          
          return (
            <button
              key={platformName}
              onClick={() => window.open(url, '_blank')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 border-transparent ${platform.color} transition-all duration-200 group`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{platform.logo}</span>
                <div className="text-left">
                  <div className="font-semibold">{platform.name}</div>
                  <div className="text-sm opacity-75">@{kolName.toLowerCase().replace(' ', '_')}</div>
                </div>
              </div>
              <svg 
                className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium">Why check my social media?</p>
            <p className="text-xs text-blue-700 mt-1">
              View my recent posts, engagement rates, and content style to ensure I&apos;m the right fit for your brand collaboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}