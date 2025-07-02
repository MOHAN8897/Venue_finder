import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Loader2, CheckCircle, Edit, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step7ReviewSubmitProps {
  formData: any;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  loading: boolean;
  errors: Record<string, string>;
  success: boolean;
  onPrev: () => void;
}

const groupTitles = [
  'Venue Details',
  'Description',
  'Location',
  'Specifications',
  'Media',
  'Contact'
];

const Step7ReviewSubmit: React.FC<Step7ReviewSubmitProps> = ({
  formData,
  onEditStep,
  onSubmit,
  loading,
  errors,
  success,
  onPrev
}) => {
  // For brevity, only a summary of each group is shown. You can expand as needed.
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Review & Submit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Venue Details */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Venue Name</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.name}</div>
              <div className="font-semibold text-lg mt-2">Venue Type</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.venueType}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(1)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Description */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Description</div>
              <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{formData.description}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(2)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Location */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Address</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.address}</div>
              <div className="font-semibold text-lg mt-2">Google Maps Link</div>
              <div className="text-blue-600 dark:text-blue-400 underline break-all">{formData.googleMapsLink}</div>
              <div className="font-semibold text-lg mt-2">City/State/Pincode</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.city}, {formData.state}, {formData.pincode}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(3)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Specifications */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Capacity</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.capacity}</div>
              <div className="font-semibold text-lg mt-2">Area</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.area}</div>
              <div className="font-semibold text-lg mt-2">Hourly Rate</div>
              <div className="text-gray-700 dark:text-gray-200">₹{formData.hourlyRate}</div>
              <div className="font-semibold text-lg mt-2">Daily Rate</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.dailyRate ? `₹${formData.dailyRate}` : 'N/A'}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(4)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Media */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Images</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.images && formData.images.length > 0 ? formData.images.map((img: any, idx: number) => (
                  <img key={idx} src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt={`img-${idx}`} className="w-16 h-16 object-cover rounded-lg border" />
                )) : <span className="text-gray-400">No images</span>}
              </div>
              <div className="font-semibold text-lg mt-2">Videos</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.videos && formData.videos.length > 0 ? formData.videos.map((vid: any, idx: number) => (
                  <video key={idx} src={typeof vid === 'string' ? vid : URL.createObjectURL(vid)} className="w-16 h-16 object-cover rounded-lg border" controls />
                )) : <span className="text-gray-400">No videos</span>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(5)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Contact */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">Contact Name</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.contactName}</div>
              <div className="font-semibold text-lg mt-2">Contact Phone</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.contactPhone}</div>
              <div className="font-semibold text-lg mt-2">Contact Email</div>
              <div className="text-gray-700 dark:text-gray-200">{formData.contactEmail}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEditStep(6)}><Edit className="h-5 w-5" /></Button>
          </div>
          <Separator />
          {/* Submit Button */}
          <div className="flex justify-between mt-8">
            <Button onClick={onPrev} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-blue-600 dark:bg-blue-400 text-white px-8 py-2 rounded-lg shadow hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
              type="button"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit'}
            </Button>
          </div>
          {/* Success Animation */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center mt-8"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
                <div className="text-2xl font-bold text-green-600">Venue Submitted Successfully!</div>
                <div className="text-gray-600 dark:text-gray-300 mt-2">Our team will review your venue and notify you once it's approved.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step7ReviewSubmit; 