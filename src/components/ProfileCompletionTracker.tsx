import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Lightbulb, CheckCircle } from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  isCompleted: boolean;
}

// --- FAKE DATA ---
const fakeSuggestions: Suggestion[] = [
  { id: 'add_images', text: 'Add at least 5 high-quality photos', isCompleted: true },
  { id: 'add_amenities', text: 'List all available amenities', isCompleted: true },
  { id: 'add_description', text: 'Write a detailed venue description (at least 200 characters)', isCompleted: false },
  { id: 'set_rates', text: 'Define both hourly and daily rates', isCompleted: false },
  { id: 'add_contact', text: 'Add a secondary contact person', isCompleted: false },
];

const calculateProgress = (suggestions: Suggestion[]): number => {
  const completedCount = suggestions.filter(s => s.isCompleted).length;
  return (completedCount / suggestions.length) * 100;
};

const ProfileCompletionTracker: React.FC = () => {
  const progress = calculateProgress(fakeSuggestions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Listing</CardTitle>
        <CardDescription>
          A complete profile attracts more customers. Here's how you can improve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <Progress value={progress} className="w-full" />
          <span className="text-lg font-bold text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600">Suggestions:</h4>
          {fakeSuggestions.map(suggestion => (
            <div key={suggestion.id} className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-gray-50">
              <div className="flex items-center">
                {suggestion.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-yellow-500 mr-3" />
                )}
                <span className={`text-sm ${suggestion.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {suggestion.text}
                </span>
              </div>
              {!suggestion.isCompleted && (
                 <Button size="sm" variant="link" className="text-sm">
                    Go fix
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionTracker; 