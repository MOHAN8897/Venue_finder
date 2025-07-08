import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star } from 'lucide-react';

// --- FAKE DATA ---
const fakeReviews = [
  {
    id: 1,
    reviewer_name: 'Alice Johnson',
    reviewer_avatar: 'https://github.com/shadcn.png',
    rating: 5,
    comment: 'Absolutely stunning venue! The staff was incredibly helpful and the space was perfect for our event. Highly recommend!',
    created_at: '2024-07-28T10:30:00Z',
    reply: null,
  },
  {
    id: 2,
    reviewer_name: 'Bob Williams',
    reviewer_avatar: 'https://github.com/shadcn.png',
    rating: 4,
    comment: 'Great location and very spacious. We had a wonderful time. Only minor issue was with the parking, but it was manageable.',
    created_at: '2024-07-25T14:00:00Z',
    reply: 'Thank you for your feedback, Bob! We are actively working on improving the parking situation and hope to see you again soon.',
  },
  {
    id: 3,
    reviewer_name: 'Charlie Brown',
    reviewer_avatar: 'https://github.com/shadcn.png',
    rating: 3,
    comment: 'The venue was nice, but the A/C was not working properly during our event, which made it a bit uncomfortable.',
    created_at: '2024-07-22T18:45:00Z',
    reply: null,
  }
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

interface ReviewItemProps {
  review: typeof fakeReviews[0];
  replyingTo: number | null;
  replyText: string;
  setReplyingTo: React.Dispatch<React.SetStateAction<number | null>>;
  setReplyText: React.Dispatch<React.SetStateAction<string>>;
  handleReplySubmit: (reviewId: number) => void;
}

const ReviewItem = React.memo(({ review, replyingTo, replyText, setReplyingTo, setReplyText, handleReplySubmit }: ReviewItemProps) => (
  <div>
    <div className="flex items-start space-x-4">
      <Avatar>
        <AvatarImage src={review.reviewer_avatar} alt={review.reviewer_name} />
        <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{review.reviewer_name}</span>
          <StarRating rating={review.rating} />
        </div>
        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
        <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
        {review.reply && (
          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-gray-800">Your Reply</p>
            <p className="text-sm text-gray-600">{review.reply}</p>
          </div>
        )}
        {!review.reply && replyingTo !== review.id && (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setReplyingTo(review.id)}>
            Reply
          </Button>
        )}
        {replyingTo === review.id && (
          <div className="mt-3">
            <Textarea 
              placeholder={`Replying to ${review.reviewer_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
              <Button size="sm" onClick={() => handleReplySubmit(review.id)}>Submit Reply</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
));

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState(fakeReviews);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const memoizedReviews = useMemo(() => reviews, [reviews]);
  const memoizedSetReplyingTo = useCallback(setReplyingTo, []);
  const memoizedSetReplyText = useCallback(setReplyText, []);
  const memoizedHandleReplySubmit = useCallback((reviewId: number) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? {...r, reply: replyText} : r));
    setReplyingTo(null);
    setReplyText('');
  }, [replyText]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews & Ratings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {memoizedReviews.map(review => (
          <ReviewItem
            key={review.id}
            review={review}
            replyingTo={replyingTo}
            replyText={replyText}
            setReplyingTo={memoizedSetReplyingTo}
            setReplyText={memoizedSetReplyText}
            handleReplySubmit={memoizedHandleReplySubmit}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default ReviewManagement; 