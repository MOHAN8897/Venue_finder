import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  venueName: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, venueName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const imageWidth = container.scrollWidth / images.length;
      container.scrollTo({
        left: index * imageWidth,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToImage(newIndex);
  };

  const scrollRight = () => {
    const newIndex = Math.min(images.length - 1, currentIndex + 1);
    scrollToImage(newIndex);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const imageWidth = container.scrollWidth / images.length;
      const currentScrollIndex = Math.round(container.scrollLeft / imageWidth);
      setCurrentIndex(currentScrollIndex);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Venue Name Header */}
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="text-xl font-bold text-gray-900">{venueName}</h1>
      </div>
      
      {/* Horizontal Scrolling Carousel */}
      <div className="relative bg-gray-100 p-6">
        <div className="w-full">
          <div className="relative w-full">
            {/* Left Navigation */}
            {images.length > 1 && currentIndex > 0 && (
          <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 -ml-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
            )}

            {/* Scrollable Images Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={handleScroll}
            >
              {images.map((image, index) => (
                                  <div
                    key={index}
                    className="relative flex-shrink-0"
                    style={{ 
                      width: 'calc((100vw - 12rem) / 3)',
                      minWidth: '400px',
                      maxWidth: '600px'
                    }}
                  >
                  <div className="relative overflow-hidden rounded-lg shadow-lg h-full border-2 border-gray-200" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={image}
                      alt={`${venueName} - image ${index + 1}`}
                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Navigation */}
            {images.length > 1 && currentIndex < images.length - 1 && (
          <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 -mr-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
            )}
          </div>
        </div>

        {/* Dots Indicator */}
      {images.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
                onClick={() => scrollToImage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentIndex === index 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}


      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ImageCarousel; 