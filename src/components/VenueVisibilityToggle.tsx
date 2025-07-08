import React, { useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface VenueVisibilityToggleProps {
  venueId: string;
  isVisible: boolean;
  onToggle: (venueId: string, isVisible: boolean) => Promise<boolean>;
}

const VenueVisibilityToggle: React.FC<VenueVisibilityToggleProps> = ({
  venueId,
  isVisible,
  onToggle
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleToggle = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const success = await onToggle(venueId, !isVisible);
      
      if (success) {
        setSuccess(`Venue ${!isVisible ? 'made visible' : 'hidden'} successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update venue visibility. Please try again.');
      }
    } catch (err) {
      console.error('Error toggling venue visibility:', err);
      setError('Failed to update venue visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Status */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Visibility:</span>
        <Badge 
          className={isVisible 
            ? "bg-green-100 text-green-800 border-green-200" 
            : "bg-gray-100 text-gray-800 border-gray-200"
          }
        >
          {isVisible ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Visible
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hidden
            </>
          )}
        </Badge>
      </div>

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className={isVisible 
          ? "border-orange-200 text-orange-700 hover:bg-orange-50" 
          : "border-green-200 text-green-700 hover:bg-green-50"
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            {isVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Venue
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Make Visible
              </>
            )}
          </>
        )}
      </Button>

      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 text-sm">{success}</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        {isVisible 
          ? "Your venue is currently visible to the public and accepting bookings."
          : "Your venue is hidden from public searches and cannot receive bookings."
        }
      </p>
    </div>
  );
};

export default VenueVisibilityToggle;
