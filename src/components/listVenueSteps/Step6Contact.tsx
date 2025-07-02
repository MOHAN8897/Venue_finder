import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, Mail, Phone, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step6ContactProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step6Contact: React.FC<Step6ContactProps> = ({
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
          <CardTitle className="text-2xl font-bold">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="contact-name" className="text-base font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Contact Name *</Label>
              <Input
                id="contact-name"
                type="text"
                value={formData.contactName}
                onChange={e => onChange('contactName', e.target.value)}
                className={`mt-2 ${errors.contactName ? 'border-red-500 ring-2 ring-red-200' : isValid('contactName') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="Full name"
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('contactName') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {errors.contactName && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.contactName}</span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="contact-phone" className="text-base font-semibold mb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Phone *</Label>
              <Input
                id="contact-phone"
                type="text"
                value={formData.contactPhone}
                onChange={e => onChange('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={`mt-2 ${errors.contactPhone ? 'border-red-500 ring-2 ring-red-200' : isValid('contactPhone') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="10-digit phone number"
                maxLength={10}
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('contactPhone') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {errors.contactPhone && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.contactPhone}</span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="contact-email" className="text-base font-semibold mb-2 flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Email *</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.contactEmail}
                onChange={e => onChange('contactEmail', e.target.value)}
                className={`mt-2 ${errors.contactEmail ? 'border-red-500 ring-2 ring-red-200' : isValid('contactEmail') ? 'border-green-500 ring-2 ring-green-200' : ''}`}
                placeholder="Email address"
              />
              <div className="flex items-center gap-2 mt-1">
                {isValid('contactEmail') && <span className="flex items-center gap-1 text-green-500 text-sm"><CheckCircle className="h-4 w-4" /> Verified</span>}
                {errors.contactEmail && (
                  <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="h-4 w-4" />{errors.contactEmail}</span>
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

export default Step6Contact; 