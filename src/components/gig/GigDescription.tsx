interface GigDescriptionProps {
  gig: {
    description: string
    deliverables: string
    requirements: string
  }
}

export default function GigDescription({ gig }: GigDescriptionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-900 mb-4">About This Gig</h2>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed mb-6">
          {gig.description}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Get</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <ul className="space-y-2">
              {gig.deliverables.split('\n').map((deliverable, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">What I Need From You</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <ul className="space-y-2">
              {gig.requirements.split('\n').map((requirement, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}