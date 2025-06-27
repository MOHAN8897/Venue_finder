import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle, 
  Loader2, 
  Building2,
  Home,
  Trophy,
  Music,
  Monitor,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  Camera,
  Video
} from 'lucide-react';

// Venue Type Models with specific options
const venueTypes: Record<string, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  specificOptions: Record<string, string[]>;
}> = {
  'cricket-box': {
    name: 'Cricket Box',
    icon: Trophy,
    description: 'Indoor/outdoor cricket practice facilities',
    color: 'bg-green-500',
    specificOptions: {
      pitchType: ['Turf', 'Concrete', 'Matting', 'Clay'],
      facilities: ['Floodlights', 'Practice Nets', 'Equipment Storage', 'Changing Rooms', 'Washrooms', 'Parking'],
      additionalServices: ['Coach Available', 'Equipment Rental', 'Video Analysis', 'Refreshments']
    }
  },
  'farmhouse': {
    name: 'Farmhouse',
    icon: Home,
    description: 'Spacious farmhouses for events and gatherings',
    color: 'bg-orange-500',
    specificOptions: {
      eventTypes: ['Wedding', 'Corporate Event', 'Birthday Party', 'Family Gathering', 'Photoshoot'],
      facilities: ['Garden', 'Swimming Pool', 'BBQ Area', 'Kitchen', 'Parking', 'Security', 'Bonfire Area'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'Music System', 'Accommodation']
    }
  },
  'banquet-hall': {
    name: 'Banquet Hall',
    icon: Building2,
    description: 'Elegant halls for weddings and celebrations',
    color: 'bg-purple-500',
    specificOptions: {
      hallType: ['AC Hall', 'Non-AC Hall', 'Outdoor Area', 'Rooftop'],
      facilities: ['Stage Area', 'Sound System', 'LED Lighting', 'Catering Kitchen', 'Decoration Service', 'Parking'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'DJ', 'Valet Parking']
    }
  },
  'sports-complex': {
    name: 'Sports Complex',
    icon: Trophy,
    description: 'Multi-sport facilities and training centers',
    color: 'bg-blue-500',
    specificOptions: {
      sportsAvailable: ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Swimming', 'Gym'],
      facilities: ['Multiple Courts', 'Fitness Center', 'Locker Rooms', 'Cafeteria', 'First Aid', 'Equipment Rental'],
      additionalServices: ['Coach Available', 'Tournament Organization', 'Equipment Rental', 'Refreshments']
    }
  },
  'party-hall': {
    name: 'Party Hall',
    icon: Music,
    description: 'Modern party venues with entertainment facilities',
    color: 'bg-pink-500',
    specificOptions: {
      partyTypes: ['Birthday', 'Anniversary', 'Corporate Party', 'DJ Night', 'Theme Party'],
      facilities: ['DJ Setup', 'Dance Floor', 'LED Lighting', 'Bar Facility', 'Valet Parking', 'Sound System'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'DJ', 'Security']
    }
  },
  'conference-room': {
    name: 'Conference Room',
    icon: Monitor,
    description: 'Professional meeting and conference spaces',
    color: 'bg-gray-500',
    specificOptions: {
      roomType: ['Small Meeting Room', 'Conference Hall', 'Auditorium', 'Training Room'],
      facilities: ['Projector', 'WiFi', 'AC', 'Whiteboard', 'Video Conferencing', 'Catering'],
      additionalServices: ['Catering', 'Technical Support', 'Recording Equipment', 'Stationery']
    }
  }
};

const steps = [
  { id: 1, title: 'Basic Info', description: 'Venue details' },
  { id: 2, title: 'Location', description: 'Address & coordinates' },
  { id: 3, title: 'Specifications', description: 'Capacity & pricing' },
  { id: 4, title: 'Venue Type', description: 'Specific options' },
  { id: 5, title: 'Media', description: 'Images & videos' },
  { id: 6, title: 'Contact', description: 'Contact information' },
  { id: 7, title: 'Review', description: 'Final review' }
];

interface FormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  capacity: string;
  area: string;
  hourlyRate: string;
  dailyRate: string;
  venueType: string;
  specificOptions: Record<string, string[]>;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images: File[];
  videos: File[];
  googleMapsLink: string;
}

const initialFormData: FormData = {
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    capacity: '',
    area: '',
    hourlyRate: '',
  dailyRate: '',
  venueType: '',
  specificOptions: {},
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  images: [],
  videos: [],
  googleMapsLink: '',
};

const ListVenue: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const navigate = useNavigate();

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Venue name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
        break;
      
      case 2:
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
        if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';
        if (!formData.googleMapsLink.trim()) newErrors.googleMapsLink = 'Google Maps Link is required';
        break;
      
      case 3:
        if (!formData.capacity) newErrors.capacity = 'Capacity is required';
        if (parseInt(formData.capacity) < 1) newErrors.capacity = 'Capacity must be at least 1';
        if (!formData.area.trim()) newErrors.area = 'Area is required';
        if (!formData.hourlyRate) newErrors.hourlyRate = 'Hourly rate is required';
        if (parseInt(formData.hourlyRate) < 100) newErrors.hourlyRate = 'Hourly rate must be at least ₹100';
        break;
      
      case 4:
        if (!formData.venueType) newErrors.venueType = 'Please select a venue type';
        break;
      
      case 5:
        if (formData.images.length === 0) newErrors.images = 'At least one image is required';
        break;
      
      case 6:
        if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
        if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required';
        if (!/^\d{10}$/.test(formData.contactPhone.replace(/\D/g, ''))) newErrors.contactPhone = 'Phone must be 10 digits';
        if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email format';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpecificOptionChange = (optionType: string, value: string[] | string) => {
    setFormData(prev => ({
      ...prev,
      specificOptions: {
        ...prev.specificOptions,
        [optionType]: value
      }
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    if (formData.images.length + newImages.length > 10) {
      setErrors(prev => ({ ...prev, images: 'Maximum 10 images allowed' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));

    // Create preview URLs
    newImages.forEach(file => {
      const url = URL.createObjectURL(file);
      setImageUrls(prev => [...prev, url]);
    });

    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newVideos = Array.from(files);
    if (formData.videos.length + newVideos.length > 3) {
      setErrors(prev => ({ ...prev, videos: 'Maximum 3 videos allowed' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, ...newVideos]
    }));

    // Create preview URLs
    newVideos.forEach(file => {
      const url = URL.createObjectURL(file);
      setVideoUrls(prev => [...prev, url]);
    });

    if (errors.videos) {
      setErrors(prev => ({ ...prev, videos: '' }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const uploadFilesToSupabase = async (files: File[], bucket: string): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      urls.push(publicUrl);
    }
    
    return urls;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Upload images and videos to Supabase storage
      const imageUrls = await uploadFilesToSupabase(formData.images, 'venue-images');
      const videoUrls = await uploadFilesToSupabase(formData.videos, 'venue-videos');

      const { error } = await supabase.from('venues').insert([{
        name: formData.name,
        description: formData.description,
        type: formData.venueType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        capacity: parseInt(formData.capacity),
        area: formData.area,
        hourly_rate: parseInt(formData.hourlyRate),
        daily_rate: formData.dailyRate ? parseInt(formData.dailyRate) : null,
        specific_options: formData.specificOptions,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        images: imageUrls,
        videos: videoUrls,
        status: 'pending',
        approval_status: 'pending',
        submitted_by: user.id,
        submission_date: new Date().toISOString(),
        google_maps_link: formData.googleMapsLink
      }]);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/venues'), 3000);
    } catch (error) {
      console.error('Error submitting venue:', error);
      setErrors({ submit: 'Failed to submit venue. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Venue Listed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your venue has been submitted for review. We'll notify you once it's approved and live on our platform.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong><br />
              • Review process takes 24-48 hours<br />
              • You'll receive an email confirmation<br />
              • Start receiving booking requests
            </p>
          </div>
          <button
            onClick={() => navigate('/venues')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">List Your Venue</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join our platform and start earning from your venue. Complete the form below to get started.
          </p>
      </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= stepItem.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > stepItem.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepItem.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > stepItem.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your venue name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.name}</p>}
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your venue, its features, and what makes it special..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.description}</p>}
                  <p className="text-gray-500 text-sm">{formData.description.length}/500</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Complete Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Street address, building name, etc."
                />
                {errors.address && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.address}</p>}
                </div>

                {/* Google Maps Link Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paste your Google Maps Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.googleMapsLink}
                    onChange={(e) => handleInputChange('googleMapsLink', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.googleMapsLink ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://maps.google.com/..."
                    required
                  />
                  {errors.googleMapsLink && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.googleMapsLink}</p>}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="State"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="6-digit pincode"
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.pincode}</p>}
                </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 28.4595"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 77.0266"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacity (People) *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.capacity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Maximum capacity"
                    min="1"
                  />
                  {errors.capacity && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.area ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 2000 sq ft"
                  />
                  {errors.area && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.area}</p>}
                </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hourly Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Price per hour"
                    min="100"
                  />
                  {errors.hourlyRate && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.hourlyRate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Daily Rate (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Price per day"
                    min="1000"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Select Venue Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(venueTypes).map(([key, type]) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={key}
                        onClick={() => handleInputChange('venueType', key)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.venueType === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{type.name}</h3>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.venueType && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.venueType}</p>}
              </div>

              {formData.venueType && venueTypes[formData.venueType as keyof typeof venueTypes] && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {venueTypes[formData.venueType as keyof typeof venueTypes].name} Specific Options
                  </h3>
                  
                  {Object.entries(venueTypes[formData.venueType as keyof typeof venueTypes].specificOptions).map(([optionType, options]) => (
                    <div key={optionType}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {optionType.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Array.isArray(options) && options.map((option: string) => (
                          <label key={option} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                              checked={formData.specificOptions[optionType]?.includes(option) || false}
                              onChange={(e) => {
                                const current = formData.specificOptions[optionType] || [];
                                const newValue = e.target.checked
                                  ? [...current, option]
                                  : current.filter((item: string) => item !== option);
                                handleSpecificOptionChange(optionType, newValue);
                              }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                            <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
              <div className="space-y-8">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Venue Images * (Upload at least 1 image, max 10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                        src={url}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 10 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Add Image</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                {errors.images && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.images}</p>}
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Venue Videos (Optional, max 3)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <video
                        src={url}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                        <button
                          onClick={() => removeVideo(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.videos.length < 3 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                        <Video className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Add Video</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                {errors.videos && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.videos}</p>}
                </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Person Name *
                      </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contactName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name of contact person"
                />
                {errors.contactName && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.contactName}</p>}
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Phone *
                      </label>
                      <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10-digit phone number"
                  />
                  {errors.contactPhone && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.contactPhone}</p>}
                    </div>

                    <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email *
                      </label>
                      <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email address"
                  />
                  {errors.contactEmail && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.contactEmail}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Your Venue Details</h3>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                      Basic Information
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {formData.name}</p>
                    <div>
                        <span className="font-medium">Description:</span>
                        <p className="mt-1 text-gray-600 leading-relaxed break-words">
                          {formData.description}
                        </p>
                    </div>
                      <p><span className="font-medium">Type:</span> {venueTypes[formData.venueType as keyof typeof venueTypes]?.name}</p>
                    </div>
                    </div>

                  {/* Location */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                      Location
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Address:</span> {formData.address}</p>
                      <p><span className="font-medium">City:</span> {formData.city}, {formData.state}</p>
                      <p><span className="font-medium">Pincode:</span> {formData.pincode}</p>
                  </div>
                </div>

                  {/* Specifications */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Monitor className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                      Specifications
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Capacity:</span> {formData.capacity} people</p>
                      <p><span className="font-medium">Area:</span> {formData.area}</p>
                      <p><span className="font-medium">Hourly Rate:</span> ₹{formData.hourlyRate}</p>
                      {formData.dailyRate && <p><span className="font-medium">Daily Rate:</span> ₹{formData.dailyRate}</p>}
                    </div>
                </div>

                  {/* Contact Information */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Music className="h-5 w-5 mr-2 text-pink-600 flex-shrink-0" />
                      Contact Information
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {formData.contactName}</p>
                      <p><span className="font-medium">Phone:</span> {formData.contactPhone}</p>
                      <p><span className="font-medium">Email:</span> {formData.contactEmail}</p>
                  </div>
                </div>

                  {/* Venue-Specific Options */}
                  {Object.keys(formData.specificOptions).length > 0 && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Venue-Specific Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.specificOptions).map(([optionType, options]) => (
                          <div key={optionType} className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium text-gray-700 capitalize mb-2">
                              {optionType.replace(/([A-Z])/g, ' $1').trim()}:
                            </p>
                            <p className="text-sm text-gray-600 break-words">
                              {Array.isArray(options) ? options.join(', ') : options}
                            </p>
                          </div>
                    ))}
                  </div>
                </div>
                  )}

                  {/* Media Files */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                      Media Files
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Images:</span> {formData.images.length} uploaded</p>
                      <p><span className="font-medium">Videos:</span> {formData.videos.length} uploaded</p>
                  </div>
                </div>
              </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {errors.submit}
                  </p>
            </div>
          )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting Venue...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Venue for Review</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
            </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
              </button>

            {currentStep < steps.length && (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListVenue;