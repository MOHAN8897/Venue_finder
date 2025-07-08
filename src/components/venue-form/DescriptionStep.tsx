import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface DescriptionStepProps {
  description: string;
  setDescription: (desc: string) => void;
  isValid: boolean;
}

const MAX_CHARS = 1000;

export default function DescriptionStep({ description, setDescription }: DescriptionStepProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Venue Description</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="space-y-2">
          <Label htmlFor="venueDescription" className="text-sm font-medium">
            Describe your venue (max {MAX_CHARS} characters)
        </Label>
        <Textarea
            id="venueDescription"
            value={description}
            onChange={e => {
              if (e.target.value.length <= MAX_CHARS) setDescription(e.target.value);
            }}
            placeholder="Share what makes your venue unique, amenities, ambiance, etc."
            rows={6}
            className="resize-vertical transition-all duration-200 focus:shadow-md"
        />
          <div className="text-xs text-muted-foreground text-right">
            {description.length} / {MAX_CHARS} characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
}