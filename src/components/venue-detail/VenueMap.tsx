import React from 'react';

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
        dangerouslySetInnerHTML={{ __html: mapEmbedCode }}
      />
    </div>
  );
};

export default VenueMap; 