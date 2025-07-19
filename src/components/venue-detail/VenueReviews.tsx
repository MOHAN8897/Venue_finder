import React from 'react';
import { Star, UserCircle } from 'lucide-react';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface VenueReviewsProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

const VenueReviews: React.FC<VenueReviewsProps> = ({ reviews, averageRating, reviewCount }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Reviews & Ratings</h2>
      <div className="flex items-center mb-6">
        <Star className="w-8 h-8 text-yellow-400 fill-current" />
        <span className="text-4xl font-bold ml-2">{averageRating.toFixed(1)}</span>
        <span className="text-gray-500 ml-4 mt-2">
          based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4">
            <div className="flex items-center mb-2">
              <UserCircle className="w-8 h-8 text-gray-400" />
              <div className="ml-3">
                <p className="font-semibold">{review.user_name}</p>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 text-yellow-400 ${
                        i < review.rating ? 'fill-current' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueReviews; 