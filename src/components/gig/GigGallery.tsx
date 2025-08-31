'use client'

import { useState } from 'react'

interface GigGalleryProps {
  gig: {
    preview_image_url?: string
    image_urls?: string[]
    title: string
  }
}

export default function GigGallery({ gig }: GigGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Get all available images, prioritizing image_urls array
  const allImages = gig.image_urls && gig.image_urls.length > 0 
    ? gig.image_urls 
    : gig.preview_image_url 
    ? [gig.preview_image_url]
    : ['/api/placeholder/800/450']
  
  const currentImage = allImages[selectedImage] || '/api/placeholder/800/450'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
      {/* Main Image Display */}
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={currentImage}
          alt={`${gig.title} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/api/placeholder/800/450'
          }}
        />
        
        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {selectedImage + 1} / {allImages.length}
          </div>
        )}
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            {selectedImage > 0 && (
              <button
                onClick={() => setSelectedImage(selectedImage - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {selectedImage < allImages.length - 1 && (
              <button
                onClick={() => setSelectedImage(selectedImage + 1)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="p-4 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  selectedImage === index 
                    ? 'border-blue-500 opacity-100' 
                    : 'border-gray-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt={`${gig.title} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/800/450'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}