import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedImageCarouselProps {
  images: string[];
  venueName: string;
}

const EnhancedImageCarousel: React.FC<EnhancedImageCarouselProps> = ({ images, venueName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate how many images to show based on screen size
  const getImagesToShow = () => {
    if (isMobile) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4; // Always show 4 images on larger screens
  };

  const imagesToShow = getImagesToShow();
  
  // Create infinite array by duplicating images when needed
  const createInfiniteImages = () => {
    if (images.length === 0) return [];
    if (images.length >= imagesToShow) return images;
    
    // Duplicate images to fill the display
    const repetitions = Math.ceil(imagesToShow / images.length) + 1;
    return Array.from({ length: repetitions }, () => images).flat();
  };
  
  const infiniteImages = createInfiniteImages();
  const maxIndex = Math.max(0, infiniteImages.length - imagesToShow);

  const nextSlide = () => {
    setCurrentIndex(prev => {
      if (prev >= maxIndex) {
        // Infinite scroll - loop back to start
        return 0;
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex(prev => {
      if (prev <= 0) {
        // Infinite scroll - loop to end
        return maxIndex;
      }
      return prev - 1;
    });
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxIndex]);

  // Handle touch/swipe for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full bg-gray-100" style={{ height: '400px' }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No images available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-100 overflow-hidden" style={{ height: '400px' }}>
      {/* Image Container */}
      <div 
        ref={containerRef}
        className="flex transition-transform duration-500 ease-out h-full"
        style={{
          transform: `translateX(-${currentIndex * (100 / imagesToShow)}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render infinite images */}
        {infiniteImages.map((image, index) => (
          <div
            key={`${index}-${image}`}
            className="relative flex-shrink-0 px-2"
            style={{
              width: `${100 / imagesToShow}%`,
            }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-100 shadow-md">
              <img
                src={image}
                alt={`${venueName} - image ${(index % images.length) + 1}`}
                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                loading={index < 4 ? 'eager' : 'lazy'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback for failed images */}
              <div className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${index < 4 ? 'hidden' : ''}`}>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-500 text-sm">Image {(index % images.length) + 1}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Always Visible for Better UX */}
      {images.length > 0 && (
        <>
          {/* Left Arrow */}
          <Button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-3 shadow-lg transition-all duration-300 bg-white/95 hover:bg-white text-gray-800 hover:shadow-xl hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Right Arrow */}
          <Button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-3 shadow-lg transition-all duration-300 bg-white/95 hover:bg-white text-gray-800 hover:shadow-xl hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator - Enhanced with Better Visibility */}
      {images.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
            {Array.from({ length: Math.max(1, Math.ceil(infiniteImages.length / imagesToShow)) }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index * imagesToShow)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  Math.floor(currentIndex / imagesToShow) === index 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to image group ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Counter - Enhanced */}
      <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
        {(currentIndex % images.length) + 1} of {images.length}
      </div>

      {/* Venue Name Overlay - Enhanced */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
        <h1 className="text-lg font-semibold">{venueName}</h1>
      </div>
    </div>
  );
};

export default EnhancedImageCarousel; 