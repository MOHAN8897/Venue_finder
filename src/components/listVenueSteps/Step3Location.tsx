import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, ExternalLink, ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step3LocationProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step3Location: React.FC<Step3LocationProps> = ({
  formData,
  errors,
  onChange,
  onNext,
  onPrev
}) => {
  const isValid = (field: string) => formData[field] && !errors[field];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-blue-500" /> Venue Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label htmlFor="venue-address" className="text-base font-semibold mb-2">Complete Address *</Label>
            <Input
              id="venue-address"
              type="text"
              value={formData.address}
              onChange={e => onChange('address', e.target.value)}
              className={`mt-2 ${errors.address ? 'border-red-500 ring-2 ring-red-200' : isValid('address') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
              placeholder="Street address, building name, etc."
            />
            <div className="flex items-center gap-2 mt-1">
              {isValid('address') && <CheckCircle className="h-4 w-4 text-green-500" />}
              {errors.address && (
                <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.address}</span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="venue-maps-link" className="text-base font-semibold mb-2">Paste your Google Maps Link <span className='text-red-500'>*</span></Label>
            <div className="relative flex items-center">
              <Input
                id="venue-maps-link"
                type="url"
                value={formData.googleMapsLink}
                onChange={e => onChange('googleMapsLink', e.target.value)}
                className={`mt-2 pr-10 ${errors.googleMapsLink ? 'border-red-500 ring-2 ring-red-200' : isValid('googleMapsLink') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="https://maps.google.com/..."
                required
              />
              <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>How to get your Google Maps link: Search your venue on Google Maps, click "Share", then copy the link</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isValid('googleMapsLink') && <CheckCircle className="h-4 w-4 text-green-500" />}
              {errors.googleMapsLink && (
                <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.googleMapsLink}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="venue-city" className="text-base font-semibold mb-2">City *</Label>
              <Input
                id="venue-city"
                type="text"
                value={formData.city}
                onChange={e => onChange('city', e.target.value)}
                className={`mt-2 ${errors.city ? 'border-red-500 ring-2 ring-red-200' : isValid('city') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="City"
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('city') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {errors.city && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.city}</span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="venue-state" className="text-base font-semibold mb-2">State *</Label>
              <Input
                id="venue-state"
                type="text"
                value={formData.state}
                onChange={e => onChange('state', e.target.value)}
                className={`mt-2 ${errors.state ? 'border-red-500 ring-2 ring-red-200' : isValid('state') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="State"
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('state') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {errors.state && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.state}</span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="venue-pincode" className="text-base font-semibold mb-2">Pincode *</Label>
              <Input
                id="venue-pincode"
                type="text"
                value={formData.pincode}
                onChange={e => onChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`mt-2 ${errors.pincode ? 'border-red-500 ring-2 ring-red-200' : isValid('pincode') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="6-digit pincode"
                maxLength={6}
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('pincode') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {errors.pincode && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.pincode}</span>
                )}
              </div>
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

export default Step3Location; 