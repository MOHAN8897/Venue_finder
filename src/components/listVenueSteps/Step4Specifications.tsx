import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertCircle, ArrowLeft, ArrowRight, Info, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step4SpecificationsProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step4Specifications: React.FC<Step4SpecificationsProps> = ({
  formData,
  errors,
  onChange,
  onNext,
  onPrev
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Venue Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="venue-capacity" className="text-base font-semibold mb-2">Capacity (People) *</Label>
              <Input
                id="venue-capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={e => onChange('capacity', e.target.value)}
                className={`mt-2 ${errors.capacity ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                placeholder="Maximum number of people"
              />
              {errors.capacity && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.capacity}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="venue-area" className="text-base font-semibold mb-2">Area *</Label>
              <Input
                id="venue-area"
                type="text"
                value={formData.area}
                onChange={e => onChange('area', e.target.value)}
                className={`mt-2 ${errors.area ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                placeholder="e.g., 2000 sq ft"
              />
              {errors.area && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.area}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="venue-hourly-rate" className="text-base font-semibold mb-2">Hourly Rate (₹) *</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400"><IndianRupee className="h-4 w-4" /></span>
                <Input
                  id="venue-hourly-rate"
                  type="number"
                  min="100"
                  value={formData.hourlyRate}
                  onChange={e => onChange('hourlyRate', e.target.value)}
                  className={`pl-8 mt-2 ${errors.hourlyRate ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Hourly rate (min ₹100)"
                />
              </div>
              {errors.hourlyRate && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.hourlyRate}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="venue-daily-rate" className="text-base font-semibold mb-2 flex items-center gap-1">Daily Rate (₹) <span className="text-xs text-gray-400">(optional)</span>
                <span className="ml-1" title="Leave blank if not applicable"><Info className="h-4 w-4 text-gray-400" /></span>
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400"><IndianRupee className="h-4 w-4" /></span>
                <Input
                  id="venue-daily-rate"
                  type="number"
                  min="0"
                  value={formData.dailyRate}
                  onChange={e => onChange('dailyRate', e.target.value)}
                  className={`pl-8 mt-2 ${errors.dailyRate ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Daily rate (optional)"
                />
              </div>
              {errors.dailyRate && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.dailyRate}
                </div>
              )}
            </div>
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

export default Step4Specifications; 