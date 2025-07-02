import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step2DescriptionProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step2Description: React.FC<Step2DescriptionProps> = ({
  formData,
  errors,
  onChange,
  onNext,
  onPrev
}) => {
  const minChars = 50;
  const chars = formData.description.length;
  const isValid = chars >= minChars;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Venue Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label htmlFor="venue-description" className="text-base font-semibold mb-2">Description *</Label>
            <Textarea
              id="venue-description"
              value={formData.description}
              onChange={e => onChange('description', e.target.value)}
              rows={4}
              className={`mt-2 transition-shadow ${errors.description ? 'border-red-500 ring-2 ring-red-200' : isValid ? 'border-green-500 ring-2 ring-green-200' : ''}`}
              placeholder="Describe your venue, its features, and what makes it special..."
              style={{ minHeight: 100, resize: 'vertical' }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${isValid ? 'text-green-600' : 'text-gray-500'}`}>{chars}/500</span>
              {isValid && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" /> Looks great!
                </span>
              )}
            </div>
            {errors.description && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <Button onClick={onPrev} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={onNext} className="bg-blue-600 dark:bg-blue-400 text-white px-8 py-2 rounded-lg shadow hover:scale-105 transition-transform disabled:opacity-50" type="button">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step2Description; 