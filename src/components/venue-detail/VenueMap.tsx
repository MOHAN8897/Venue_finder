import React from 'react';

// Sanitize map embed code to prevent XSS
const sanitizeMapEmbedCode = (embedCode: string): string => {
  // Only allow iframe tags with specific attributes for map embeds
  const allowedTags = /<iframe[^>]*src="[^"]*"[^>]*><\/iframe>/gi;
  const match = embedCode.match(allowedTags);
  
  if (match && match[0]) {
    // Further sanitize by only allowing specific domains
    const srcMatch = match[0].match(/src="([^"]*)"/);
    if (srcMatch && srcMatch[1]) {
      const url = srcMatch[1];
      const allowedDomains = [
        'maps.google.com',
        'www.google.com',
        'www.google.co.in',
        'maps.googleapis.com',
        'openstreetmap.org',
        'www.openstreetmap.org'
      ];
      
      const isAllowed = allowedDomains.some(domain => url.includes(domain));
      if (isAllowed) {
        return match[0];
      }
    }
  }
  
  // Return safe fallback if not valid
  return '<div class="bg-gray-100 p-4 text-center">Map not available</div>';
};

interface VenueMapProps {
  mapEmbedCode: string;
}

const VenueMap: React.FC<VenueMapProps> = ({ mapEmbedCode }) => {
  if (!mapEmbedCode) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Location</h2>
        <p>Map data is not available for this venue.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Location</h2>
      <div
        className="w-full h-80 rounded-lg overflow-hidden"
        dangerouslySetInnerHTML={{ __html: sanitizeMapEmbedCode(mapEmbedCode) }}
      />
    </div>
  );
};

export default VenueMap; 