import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step1VenueDetailsProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSpecificOptionChange: (optionType: string, value: string[]) => void;
  onNext: () => void;
  venueTypes: Record<string, any>;
}

const Step1VenueDetails: React.FC<Step1VenueDetailsProps> = ({
  formData,
  errors,
  onChange,
  onSpecificOptionChange,
  onNext,
  venueTypes
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
          <CardTitle className="text-2xl font-bold">Venue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="venue-name" className="text-base font-semibold mb-2">Venue Name *</Label>
              <Input
                id="venue-name"
                type="text"
                value={formData.name}
                onChange={e => onChange('name', e.target.value)}
                className={`mt-2 ${errors.name ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                placeholder="Enter your venue name"
                autoFocus
              />
              {errors.name && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <Label className="text-base font-semibold mb-2">Venue Type *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {Object.entries(venueTypes).map(([key, type]) => {
                  const selected = formData.venueType === key;
                  const Icon = type.icon;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => onChange('venueType', key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400'}`}
                    >
                      <span className={`flex items-center justify-center w-12 h-12 rounded-full ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-blue-600'}`}>
                        <Icon className="h-7 w-7" />
                      </span>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-lg mb-1">{type.name}</div>
                        <div className="text-gray-500 dark:text-gray-300 text-sm">{type.description}</div>
                      </div>
                      {selected && <CheckCircle className="h-6 w-6 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
              {errors.venueType && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.venueType}
                </div>
              )}
            </div>
          </div>
          {/* Venue type specific options */}
          {formData.venueType && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(venueTypes[formData.venueType].specificOptions).map(([optionKey, options]) => (
                <div key={optionKey}>
                  <Label className="text-base font-semibold mb-2 capitalize">{optionKey.replace(/([A-Z])/g, ' $1')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {options.map(opt => {
                      const checked = formData.specificOptions[optionKey]?.includes(opt) || false;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const prev = formData.specificOptions[optionKey] || [];
                            onSpecificOptionChange(optionKey, checked ? prev.filter(o => o !== opt) : [...prev, opt]);
                          }}
                          className={`px-4 py-2 rounded-lg border transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${checked ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:border-blue-400'}`}
                        >
                          {checked && <CheckCircle className="h-4 w-4 text-white" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {errors[optionKey] && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors[optionKey]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-8">
            <Button onClick={onNext} className="bg-blue-600 dark:bg-blue-400 text-white px-8 py-2 rounded-lg shadow hover:scale-105 transition-transform disabled:opacity-50" type="button">
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step1VenueDetails; 