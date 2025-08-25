interface GigSpecsProps {
  gig: {
    platform?: string
    platforms?: string[]
    content_type: string
    genre_category?: string
    category?: string
    country?: string
    language?: string[]
    delivery_days: number
    revisions_included: number
    fast_delivery: boolean
    fast_delivery_days?: number
    avg_views_per_content?: number
  }
}

export default function GigSpecs({ gig }: GigSpecsProps) {
  const formatGenreCategory = (category: string) => {
    return category.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase())
  }

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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Gig Specifications</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Platform</h3>
          <p className="text-gray-600 text-sm">
            {gig.platform || (gig.platforms ? gig.platforms.join(', ') : 'Multi')}
          </p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Content Type</h3>
          <p className="text-gray-600 text-sm capitalize">{gig.content_type}</p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Category</h3>
          <p className="text-gray-600 text-sm">
            {gig.category || (gig.genre_category ? formatGenreCategory(gig.genre_category) : 'General')}
          </p>
        </div>

        <div className="text-center">
          <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Delivery</h3>
          <p className="text-gray-600 text-sm">{gig.delivery_days} days</p>
        </div>

{gig.country && (
          <div className="text-center">
            <div className="bg-amber-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Location</h3>
            <p className="text-gray-600 text-sm">{gig.country}</p>
          </div>
        )}

        {gig.language && gig.language.length > 0 && (
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Languages</h3>
            <p className="text-gray-600 text-sm">{gig.language.join(', ')}</p>
          </div>
        )}

        {gig.avg_views_per_content && (
          <div className="text-center">
            <div className="bg-teal-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Avg Views</h3>
            <p className="text-gray-600 text-sm">{formatViews(gig.avg_views_per_content)}</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium text-gray-900">Revisions Included</span>
            </div>
            <span className="text-gray-600 font-semibold">{gig.revisions_included}</span>
          </div>

          {gig.fast_delivery && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium text-gray-900">Fast Delivery Available</span>
              </div>
              <span className="text-yellow-600 font-semibold">{gig.fast_delivery_days} day</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}