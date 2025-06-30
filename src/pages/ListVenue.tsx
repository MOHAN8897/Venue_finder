import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DraftService } from '../lib/draftService';
import { VenueSubmissionService, VenueSubmissionData } from '../lib/venueSubmissionService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
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
  Video,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Upload,
  Sparkles,
  List,
  Settings,
  User,
  BarChart3,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  Shield,
  Save,
  ExternalLink
} from 'lucide-react';

// Venue Type Models with specific options
const venueTypes: Record<string, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  gradient: string;
  specificOptions: Record<string, string[]>;
}> = {
  'cricket-box': {
    name: 'Cricket Box',
    icon: Trophy,
    description: 'Professional cricket practice facilities with advanced equipment',
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-green-600',
    specificOptions: {
      pitchType: ['Turf', 'Concrete', 'Matting', 'Clay'],
      facilities: ['Floodlights', 'Practice Nets', 'Equipment Storage', 'Changing Rooms', 'Washrooms', 'Parking'],
      additionalServices: ['Coach Available', 'Equipment Rental', 'Video Analysis', 'Refreshments']
    }
  },
  'farmhouse': {
    name: 'Farmhouse',
    icon: Home,
    description: 'Luxurious farmhouses perfect for memorable events',
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-red-500',
    specificOptions: {
      eventTypes: ['Wedding', 'Corporate Event', 'Birthday Party', 'Family Gathering', 'Photoshoot'],
      facilities: ['Garden', 'Swimming Pool', 'BBQ Area', 'Kitchen', 'Parking', 'Security', 'Bonfire Area'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'Music System', 'Accommodation']
    }
  },
  'banquet-hall': {
    name: 'Banquet Hall',
    icon: Building2,
    description: 'Elegant halls for sophisticated celebrations',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-indigo-600',
    specificOptions: {
      hallType: ['AC Hall', 'Non-AC Hall', 'Outdoor Area', 'Rooftop'],
      facilities: ['Stage Area', 'Sound System', 'LED Lighting', 'Catering Kitchen', 'Decoration Service', 'Parking'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'DJ', 'Valet Parking']
    }
  },
  'sports-complex': {
    name: 'Sports Complex',
    icon: Trophy,
    description: 'Multi-sport facilities with professional training',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-600',
    specificOptions: {
      sportsAvailable: ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Swimming', 'Gym'],
      facilities: ['Multiple Courts', 'Fitness Center', 'Locker Rooms', 'Cafeteria', 'First Aid', 'Equipment Rental'],
      additionalServices: ['Coach Available', 'Tournament Organization', 'Equipment Rental', 'Refreshments']
    }
  },
  'party-hall': {
    name: 'Party Hall',
    icon: Music,
    description: 'Modern venues with cutting-edge entertainment',
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-rose-600',
    specificOptions: {
      partyTypes: ['Birthday', 'Anniversary', 'Corporate Party', 'DJ Night', 'Theme Party'],
      facilities: ['DJ Setup', 'Dance Floor', 'LED Lighting', 'Bar Facility', 'Valet Parking', 'Sound System'],
      additionalServices: ['Catering', 'Decoration', 'Photography', 'DJ', 'Security']
    }
  },
  'conference-room': {
    name: 'Conference Room',
    icon: Monitor,
    description: 'Professional spaces for business meetings',
    color: 'bg-slate-500',
    gradient: 'from-slate-500 to-gray-600',
    specificOptions: {
      roomType: ['Small Meeting Room', 'Conference Hall', 'Auditorium', 'Training Room'],
      facilities: ['Projector', 'WiFi', 'AC', 'Whiteboard', 'Video Conferencing', 'Catering'],
      additionalServices: ['Catering', 'Technical Support', 'Recording Equipment', 'Stationery']
    }
  }
};

const steps = [
  { id: 1, title: 'Basic Info', description: 'Venue details & description', icon: FileText },
  { id: 2, title: 'Location', description: 'Address & coordinates', icon: MapPin },
  { id: 3, title: 'Specifications', description: 'Capacity & pricing', icon: Users },
  { id: 4, title: 'Venue Type', description: 'Specific options', icon: Building2 },
  { id: 5, title: 'Media', description: 'Images & videos', icon: Camera },
  { id: 6, title: 'Contact', description: 'Contact information', icon: Phone },
  { id: 7, title: 'Review', description: 'Final review', icon: CheckCircle }
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
  
  // Draft recovery states
  const [showSaveDraft, setShowSaveDraft] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [recoveringDraft, setRecoveringDraft] = useState(false);
  const [draftRecoveryError, setDraftRecoveryError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Draft recovery effect
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (draftId && !recoveringDraft) {
      handleDraftRecovery(draftId);
    }
  }, [searchParams]);

  // Handle draft recovery
  const handleDraftRecovery = async (draftId: string) => {
    setRecoveringDraft(true);
    setDraftRecoveryError('');
    
    try {
      // Extract email from draft ID (in real implementation, this would be stored in the draft)
      // For now, we'll prompt the user for email
      const email = prompt('Please enter the email address you used to save this draft:');
      if (!email) {
        setDraftRecoveryError('Email is required to recover draft');
        setRecoveringDraft(false);
        return;
      }

      const response = await DraftService.getDraft(email);
      
      if (response.success && response.draft_data) {
        setFormData(response.draft_data);
        setCurrentStep(response.step_completed || 1);
        
        // Recreate preview URLs for images and videos
        if (response.draft_data.images) {
          setImageUrls(response.draft_data.images.map(() => 'preview-url'));
        }
        if (response.draft_data.videos) {
          setVideoUrls(response.draft_data.videos.map(() => 'preview-url'));
        }
        
        // Show success message
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 5000);
      } else {
        setDraftRecoveryError(response.error || 'Failed to recover draft');
      }
    } catch (error) {
      setDraftRecoveryError('Failed to recover draft. Please try again.');
    } finally {
      setRecoveringDraft(false);
    }
  };

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

  const handleSpecificOptionChange = (optionType: string, value: string[]) => {
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      // Upload images and videos to Supabase storage
      const imageUrls = await VenueSubmissionService.uploadFiles(formData.images, 'venue-images');
      const videoUrls = await VenueSubmissionService.uploadFiles(formData.videos, 'venue-videos');

      // Prepare venue data for submission
      const venueData: VenueSubmissionData = {
        name: formData.name,
        description: formData.description,
        type: formData.venueType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        capacity: formData.capacity,
        area: formData.area,
        hourly_rate: formData.hourlyRate,
        daily_rate: formData.dailyRate || undefined,
        specific_options: formData.specificOptions,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        google_maps_link: formData.googleMapsLink,
        images: imageUrls,
        videos: videoUrls
      };

      // Validate venue data
      const validation = VenueSubmissionService.validateVenueData(venueData);
      if (!validation.isValid) {
        setErrors({ submit: validation.errors.join(', ') });
        return;
      }

      // Submit venue using the enhanced service
      const response = await VenueSubmissionService.submitVenue(venueData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate('/venues'), 3000);
      } else {
        setErrors({ submit: response.error || 'Failed to submit venue' });
      }
    } catch (error) {
      console.error('Error submitting venue:', error);
      setErrors({ submit: 'Failed to submit venue. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Save draft functionality
  const handleSaveDraft = async () => {
    if (!DraftService.isValidEmail(draftEmail)) {
      setDraftError('Please enter a valid email address');
      return;
    }

    setSavingDraft(true);
    setDraftError('');

    try {
      const response = await DraftService.saveDraft(draftEmail, formData, currentStep);
      
      if (response.success) {
        setDraftSaved(true);
        setShowSaveDraft(false);
        
        // Send recovery email
        await DraftService.sendDraftRecoveryEmail(
          draftEmail, 
          formData.name || 'Your Venue', 
          response.draft_id || ''
        );
        
        // Reset after 3 seconds
        setTimeout(() => {
          setDraftSaved(false);
          setDraftEmail('');
        }, 3000);
      } else {
        setDraftError(response.error || 'Failed to save draft');
      }
    } catch (error) {
      setDraftError('Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Venue Submitted Successfully!</CardTitle>
            <CardDescription className="text-gray-600">
              Your venue has been submitted for review. We'll notify you once it's approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-700">
                Our team will review your venue details and get back to you within 24-48 hours.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/venues')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
            >
              Browse Venues
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            List Your Venue
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join our premium platform and start earning from your venue. Complete the form below to get started with our streamlined process.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= stepItem.id 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-lg' 
                      : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {currentStep > stepItem.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <stepItem.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                      currentStep > stepItem.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Step {currentStep}: {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="mt-4 h-2" />
          </CardContent>
        </Card>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Draft Recovery Error */}
          {draftRecoveryError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <div className="font-semibold">Draft Recovery Failed</div>
                <div className="text-sm">{draftRecoveryError}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setDraftRecoveryError('')}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Draft Recovery Loading */}
          {recoveringDraft && (
            <Alert variant="info" className="mb-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              <AlertDescription>
                <div className="font-semibold">Recovering Your Draft...</div>
                <div className="text-sm">Please wait while we load your saved venue information.</div>
              </AlertDescription>
            </Alert>
          )}

          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="venue-name" className="text-base font-semibold mb-2">Venue Name *</Label>
                <Input
                  id="venue-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`mt-2 ${errors.name ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Enter your venue name"
                />
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="venue-description" className="text-base font-semibold mb-2">Description *</Label>
                <Textarea
                  id="venue-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`mt-2 ${errors.description ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Describe your venue, its features, and what makes it special..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </div>
                  )}
                  <span className="text-gray-500 text-xs ml-auto">{formData.description.length}/500</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="venue-address" className="text-base font-semibold mb-2">Complete Address *</Label>
                <Input
                  id="venue-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`mt-2 ${errors.address ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Street address, building name, etc."
                />
                {errors.address && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.address}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="venue-maps-link" className="text-base font-semibold mb-2">Paste your Google Maps Link <span className='text-red-500'>*</span></Label>
                <Input
                  id="venue-maps-link"
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => handleInputChange('googleMapsLink', e.target.value)}
                  className={`mt-2 ${errors.googleMapsLink ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="https://maps.google.com/..."
                  required
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <ExternalLink className="h-4 w-4" />
                  <span>How to get your Google Maps link: Search your venue on Google Maps, click "Share", then copy the link</span>
                </div>
                {errors.googleMapsLink && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.googleMapsLink}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="venue-city" className="text-base font-semibold mb-2">City *</Label>
                  <Input
                    id="venue-city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`mt-2 ${errors.city ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="City"
                  />
                  {errors.city && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.city}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="venue-state" className="text-base font-semibold mb-2">State *</Label>
                  <Input
                    id="venue-state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`mt-2 ${errors.state ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="State"
                  />
                  {errors.state && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.state}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="venue-pincode" className="text-base font-semibold mb-2">Pincode *</Label>
                  <Input
                    id="venue-pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`mt-2 ${errors.pincode ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="6-digit pincode"
                  />
                  {errors.pincode && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.pincode}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="venue-latitude" className="text-base font-semibold mb-2">Latitude (Optional)</Label>
                  <Input
                    id="venue-latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="mt-2"
                    placeholder="e.g., 28.4595"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-longitude" className="text-base font-semibold mb-2">Longitude (Optional)</Label>
                  <Input
                    id="venue-longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="mt-2"
                    placeholder="e.g., 77.0266"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="venue-capacity" className="text-base font-semibold mb-2">Capacity (People) *</Label>
                  <Input
                    id="venue-capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
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
                    onChange={(e) => handleInputChange('area', e.target.value)}
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
                  <Input
                    id="venue-hourly-rate"
                    type="number"
                    min="100"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    className={`mt-2 ${errors.hourlyRate ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="Price per hour"
                  />
                  {errors.hourlyRate && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.hourlyRate}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue-daily-rate" className="text-base font-semibold mb-2">Daily Rate (₹) Optional</Label>
                  <Input
                    id="venue-daily-rate"
                    type="number"
                    min="1000"
                    value={formData.dailyRate}
                    onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                    className="mt-2"
                    placeholder="Price per day (optional)"
                  />
                </div>
              </div>

              {/* Save Draft Feature */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Save className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Save Draft & Continue Later</h4>
                      <p className="text-blue-700 text-sm mb-3">
                        Need to leave? Save your progress and we'll send you a link to continue where you left off.
                      </p>
                      
                      {!showSaveDraft ? (
                        <Button
                          onClick={() => setShowSaveDraft(true)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="draft-email" className="text-sm font-medium text-blue-900">
                              Email Address *
                            </Label>
                            <Input
                              id="draft-email"
                              type="email"
                              value={draftEmail}
                              onChange={(e) => setDraftEmail(e.target.value)}
                              placeholder="Enter your email to receive recovery link"
                              className="mt-1"
                            />
                          </div>
                          
                          {draftError && (
                            <div className="flex items-center gap-1 text-red-500 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {draftError}
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleSaveDraft}
                              disabled={savingDraft || !draftEmail}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {savingDraft ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Draft
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowSaveDraft(false);
                                setDraftEmail('');
                                setDraftError('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Venue Type</h3>
                <p className="text-gray-600">Choose the category that best describes your venue</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(venueTypes).map(([key, venueType]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      formData.venueType === key
                        ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleInputChange('venueType', key)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 rounded-lg ${venueType.color} text-white`}>
                          <venueType.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{venueType.name}</h4>
                          <p className="text-sm text-gray-600">{venueType.description}</p>
                        </div>
                      </div>
                      {formData.venueType === key && (
                        <div className="flex items-center text-blue-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formData.venueType && venueTypes[formData.venueType as keyof typeof venueTypes] && (
                <div className="space-y-6">
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {venueTypes[formData.venueType as keyof typeof venueTypes].name} - Specific Options
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(venueTypes[formData.venueType as keyof typeof venueTypes].specificOptions).map(([optionType, options]) => (
                        <div key={optionType} className="space-y-3">
                          <Label className="text-base font-semibold capitalize">
                            {optionType.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <div className="grid grid-cols-1 gap-2">
                            {options.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${optionType}-${option}`}
                                  checked={formData.specificOptions[optionType]?.includes(option) || false}
                                  onCheckedChange={(checked) => {
                                    const currentOptions = formData.specificOptions[optionType] || [];
                                    const newOptions = checked
                                      ? [...currentOptions, option]
                                      : currentOptions.filter((o) => o !== option);
                                    handleSpecificOptionChange(optionType, newOptions);
                                  }}
                                />
                                <Label
                                  htmlFor={`${optionType}-${option}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Draft Feature */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Save className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Save Draft & Continue Later</h4>
                      <p className="text-blue-700 text-sm mb-3">
                        Need to leave? Save your progress and we'll send you a link to continue where you left off.
                      </p>
                      
                      {!showSaveDraft ? (
                        <Button
                          onClick={() => setShowSaveDraft(true)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="draft-email" className="text-sm font-medium text-blue-900">
                              Email Address *
                            </Label>
                            <Input
                              id="draft-email"
                              type="email"
                              value={draftEmail}
                              onChange={(e) => setDraftEmail(e.target.value)}
                              placeholder="Enter your email to receive recovery link"
                              className="mt-1"
                            />
                          </div>
                          
                          {draftError && (
                            <div className="flex items-center gap-1 text-red-500 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {draftError}
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleSaveDraft}
                              disabled={savingDraft || !draftEmail}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {savingDraft ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Draft
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowSaveDraft(false);
                                setDraftEmail('');
                                setDraftError('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8">
              <div>
                <Label className="text-base font-semibold mb-4">Venue Images * (Upload at least 1 image, max 10)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <Card key={index} className="relative group overflow-hidden">
                      <CardContent className="p-0">
                        <img
                          src={url}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          onClick={() => removeImage(index)}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.images.length < 10 && (
                    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center justify-center h-32">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Add Image</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
                {errors.images && (
                  <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.images}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold mb-4">Venue Videos (Optional, max 3)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoUrls.map((url, index) => (
                    <Card key={index} className="relative group overflow-hidden">
                      <CardContent className="p-0">
                        <video
                          src={url}
                          className="w-full h-32 object-cover"
                          controls
                        />
                        <Button
                          onClick={() => removeVideo(index)}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.videos.length < 3 && (
                    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center justify-center h-32">
                        <Video className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Add Video</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
                {errors.videos && (
                  <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.videos}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="venue-contact-name" className="text-base font-semibold mb-2">Contact Person Name *</Label>
                <Input
                  id="venue-contact-name"
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className={`mt-2 ${errors.contactName ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                  placeholder="Full name of contact person"
                />
                {errors.contactName && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.contactName}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="venue-contact-phone" className="text-base font-semibold mb-2">Contact Phone *</Label>
                  <Input
                    id="venue-contact-phone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`mt-2 ${errors.contactPhone ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="10-digit phone number"
                  />
                  {errors.contactPhone && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.contactPhone}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue-contact-email" className="text-base font-semibold mb-2">Contact Email *</Label>
                  <Input
                    id="venue-contact-email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={`mt-2 ${errors.contactEmail ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    placeholder="Email address"
                  />
                  {errors.contactEmail && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.contactEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Assurance Section */}
              <Alert variant="info" className="border-blue-200 bg-blue-50">
                <Shield className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <div className="font-semibold mb-2">🔒 Privacy & Trust Assurance</div>
                  <div className="space-y-2 text-sm">
                    <p className="text-base font-medium">
                      <strong>We'll only use your phone/email to verify your listing and send updates—never for unsolicited marketing.</strong>
                    </p>
                    <p>Your contact information helps us:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Verify venue ownership</li>
                      <li>Send booking notifications</li>
                      <li>Provide customer support</li>
                      <li>Keep you updated on listing status</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Your privacy is our priority:</strong> We never sell, rent, or share your personal information with third parties. 
                        All data is encrypted and stored securely.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Venue Details</h3>
                <p className="text-gray-600">Please review all information before submitting</p>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      <CardTitle>Basic Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <p className="text-gray-900">{venueTypes[formData.venueType as keyof typeof venueTypes]?.name}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-gray-900 mt-1 leading-relaxed">{formData.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-green-600" />
                      <CardTitle>Location</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Address:</span>
                        <p className="text-gray-900">{formData.address}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">City & State:</span>
                        <p className="text-gray-900">{formData.city}, {formData.state}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Pincode:</span>
                        <p className="text-gray-900">{formData.pincode}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Google Maps:</span>
                        <a 
                          href={formData.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        >
                          View on Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Specifications */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-purple-600" />
                      <CardTitle>Specifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Capacity:</span>
                        <p className="text-gray-900">{formData.capacity} people</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Area:</span>
                        <p className="text-gray-900">{formData.area}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Hourly Rate:</span>
                        <p className="text-gray-900">₹{formData.hourlyRate}</p>
                      </div>
                      {formData.dailyRate && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Daily Rate:</span>
                          <p className="text-gray-900">₹{formData.dailyRate}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-pink-600" />
                      <CardTitle>Contact Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{formData.contactName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{formData.contactPhone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{formData.contactEmail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Venue-Specific Options */}
                {Object.keys(formData.specificOptions).length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center">
                        <List className="h-5 w-5 mr-2 text-orange-600" />
                        <CardTitle>Venue-Specific Options</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.specificOptions).map(([optionType, options]) => (
                          <div key={optionType} className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 capitalize mb-2">
                              {optionType.replace(/([A-Z])/g, ' $1').trim()}:
                            </p>
                            <p className="text-sm text-gray-600">
                              {Array.isArray(options) ? options.join(', ') : options}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Media Files */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-indigo-600" />
                      <CardTitle>Media Files</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Images:</span>
                        <p className="text-gray-900">{formData.images.length} uploaded</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Videos:</span>
                        <p className="text-gray-900">{formData.videos.length} uploaded</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {errors.submit && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {errors.submit}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-6 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Submitting Venue...
                  </>
                ) : (
                  <>
                    Submit Venue for Review
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
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

          {/* Draft Saved Success Notification */}
          {draftSaved && (
            <div className="fixed top-4 right-4 z-50">
              <Alert variant="success" className="border-green-200 bg-green-50 shadow-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="font-semibold">Draft Saved Successfully!</div>
                  <div className="text-sm">Check your email for the recovery link.</div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListVenue;