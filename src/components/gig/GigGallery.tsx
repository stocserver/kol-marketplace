interface GigGalleryProps {
  gig: {
    preview_image_url: string
    title: string
  }
}

export default function GigGallery({ gig }: GigGalleryProps) {
  // Mock additional images for gallery
  const images = [
    gig.preview_image_url,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500'
  ]

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
      <div className="aspect-video bg-gray-100">
        <img
          src={images[0]}
          alt={gig.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {images.slice(1).map((image, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={image}
                alt={`Preview ${index + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}