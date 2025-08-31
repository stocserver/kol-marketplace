// Shared platform constants for consistency across the app
export const PLATFORMS = [
  'Instagram', 
  'TikTok', 
  'YouTube', 
  'Facebook', 
  'Twitter', 
  'LinkedIn', 
  'Twitch',
  'Snapchat',
  'Pinterest'
]

// Platform categories for gig creation (organized by type)
export const PLATFORM_CATEGORIES = {
  'Social Media Platforms': [
    'Instagram', 'Facebook', 'Snapchat', 'Pinterest', 'TikTok', 'Twitter', 'LinkedIn'
  ],
  'Video Platforms': [
    'YouTube', 'Twitch'
  ]
}

// Flatten all platforms for easy processing
export const ALL_PLATFORMS = [...new Set(Object.values(PLATFORM_CATEGORIES).flat())]

// Industries for sponsor profiles
export const INDUSTRIES = [
  'Fashion & Beauty', 
  'Technology', 
  'Food & Cooking', 
  'Travel', 
  'Fitness & Health',
  'Gaming', 
  'Entertainment', 
  'Business', 
  'Education', 
  'Art & Design', 
  'Music',
  'Finance', 
  'Healthcare', 
  'Real Estate', 
  'Automotive', 
  'Sports'
]

// Content genre categories for gigs
export const GENRE_CATEGORIES = [
  { value: 'fashion_beauty', label: 'Fashion & Beauty' },
  { value: 'health_fitness', label: 'Health & Fitness' },
  { value: 'food_cooking', label: 'Food & Cooking' },
  { value: 'travel', label: 'Travel & Adventure' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'tech', label: 'Technology' },
  { value: 'business', label: 'Business & Finance' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Educational Content' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'music', label: 'Music & Arts' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'parenting', label: 'Parenting & Family' }
]

// Content types for gigs
export const CONTENT_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'post', label: 'Posts' }
]