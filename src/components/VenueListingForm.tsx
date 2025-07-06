import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Building, Tag, MapPin, Map, Globe, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import DescriptionStep from './venue-form/DescriptionStep';
import LocationStep from './venue-form/LocationStep';
import SpecificationsStep from './venue-form/SpecificationsStep';
import MediaStep from './venue-form/MediaStep';
import PricingStep from './venue-form/PricingStep';
import ContactStep from './venue-form/ContactStep';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

const VENUE_TYPES = [
  'Event Hall',
  'Conference Room',
  'Wedding Venue',
  'Restaurant',
  'Hotel',
  'Outdoor Space',
  'Theater',
  'Gallery',
  'Sports Venue',
  'Community Center'
];

export interface VenueFormData {
  venueName: string;
  venueType: string;
  address: string;
  locationLink: string;
  website: string;
  description: string;
  mapEmbedCode: string;
  capacity?: number;
  area?: number;
  amenities: string[];
  photos: File[];
  videos: string[];
  pricePerHour?: number;
  pricePerDay?: number;
  availability: string[];
  contactNumber?: string;
  email?: string;
  company?: string;
}

export default function VenueListingForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VenueFormData>({
    venueName: '',
    venueType: '',
    address: '',
    locationLink: '',
    website: '',
    description: '',
    mapEmbedCode: '',
    capacity: undefined,
    area: undefined,
    amenities: [],
    photos: [],
    videos: [],
    pricePerHour: undefined,
    pricePerDay: undefined,
    availability: [],
    contactNumber: '',
    email: '',
    company: '',
  });
  const updateFormData = (updates: Partial<VenueFormData>) => setFormData(prev => ({ ...prev, ...updates }));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Move handleSubmit above steps array to avoid ReferenceError
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!formData.venueName.trim() || !formData.venueType.trim() || !formData.address.trim() || !formData.description.trim() || !formData.mapEmbedCode.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!user) {
      setError('You must be logged in to submit a venue.');
      return;
    }
    setSubmitting(true);
    let timeoutId: NodeJS.Timeout | null = null;
    let didTimeout = false;
    try {
      // Timeout logic
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          reject(new Error('Submission timed out. Please check your connection and try again.'));
        }, 10000); // 10 seconds
      });
      const payload = {
        venue_name: formData.venueName,
        venue_type: formData.venueType,
        address: formData.address,
        location_link: formData.locationLink,
        website: formData.website,
        description: formData.description,
        map_embed_code: formData.mapEmbedCode,
        capacity: formData.capacity || 0,
        area: formData.area || 0,
        amenities: formData.amenities || [],
        photos: formData.photos.map(f => f.name), // or handle upload logic
        videos: formData.videos || [],
        price_per_hour: formData.pricePerHour || 0,
        price_per_day: formData.pricePerDay || 0,
        availability: formData.availability || [],
        contact_number: formData.contactNumber,
        email: formData.email,
        company: formData.company,
        user_id: user.user_id,
        owner_id: user.user_id,
        submitted_by: user.user_id,
      };
      console.log('Submitting payload:', payload);
      const supabasePromise = supabase
        .from('venues')
        .insert(payload)
        .select('id')
        .single();
      // Race between Supabase and timeout
      const result = await Promise.race([supabasePromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      if (didTimeout) return;
      // If result is from supabase, it will have data and error
      const { data, error: dbError } = (result as PostgrestSingleResponse<{ id: string }>);
      console.log('Supabase response:', { data, dbError });
      if (dbError) {
        setError(dbError.message || 'Failed to submit venue.');
        console.error('Supabase error:', dbError);
      } else if (data?.id) {
        setSuccess(true);
        setFormData({
          venueName: '',
          venueType: '',
          address: '',
          locationLink: '',
          website: '',
          description: '',
          mapEmbedCode: '',
          capacity: undefined,
          area: undefined,
          amenities: [],
          photos: [],
          videos: [],
          pricePerHour: undefined,
          pricePerDay: undefined,
          availability: [],
          contactNumber: '',
          email: '',
          company: '',
        });
        setStep(0);
      } else {
        setError('Unknown error. Venue not saved.');
        console.error('Unknown error: No data returned from Supabase.');
      }
    } catch (err: unknown) {
      let message = 'Submission failed.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
      console.error('Submission error:', err);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Venue Details',
      content: (
        <form onSubmit={e => { e.preventDefault(); setStep(1); }} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="venueName" className="flex items-center gap-2 text-sm font-medium">
                <Building className="w-4 h-4 text-primary" />
                Venue Name *
              </Label>
              <Input
                id="venueName"
                value={formData.venueName}
                onChange={e => updateFormData({ venueName: e.target.value })}
                placeholder="Enter your venue name"
                className="transition-all duration-200 focus:shadow-md"
              />
            </div>
            {/* Venue Type */}
            <div className="space-y-2">
              <Label htmlFor="venueType" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="w-4 h-4 text-primary" />
                Venue Type *
              </Label>
              <Select
                value={formData.venueType}
                onValueChange={setVenueType => updateFormData({ venueType: setVenueType })}
              >
                <SelectTrigger className="transition-all duration-200 focus:shadow-md">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {VENUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="hover:bg-accent">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              Full Address *
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={e => updateFormData({ address: e.target.value })}
              placeholder="Enter complete address with city, state, and ZIP"
              className="transition-all duration-200 focus:shadow-md"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Google Maps Link */}
            <div className="space-y-2">
              <Label htmlFor="locationLink" className="flex items-center gap-2 text-sm font-medium">
                <Map className="w-4 h-4 text-primary" />
                Google Maps Link
              </Label>
              <Input
                id="locationLink"
                value={formData.locationLink}
                onChange={e => updateFormData({ locationLink: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="transition-all duration-200 focus:shadow-md"
              />
            </div>
            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-primary" />
                Website (Optional)
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={e => updateFormData({ website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="transition-all duration-200 focus:shadow-md"
              />
            </div>
          </div>
          <div className="bg-accent/50 rounded-lg p-4 border border-accent">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Provide accurate details to help customers find and book your venue easily. 
              Required fields are marked with an asterisk (*).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={!formData.venueName.trim() || !formData.venueType.trim() || !formData.address.trim()}>
              Next
            </Button>
          </div>
        </form>
      )
    },
    {
      title: 'Description',
      content: (
        <div>
          <DescriptionStep
            description={formData.description}
            setDescription={description => updateFormData({ description })}
            isValid={!!formData.description.trim()}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!formData.description.trim()}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Location Map',
      content: (
        <div>
          <LocationStep
            mapEmbedCode={formData.mapEmbedCode}
            setMapEmbedCode={mapEmbedCode => updateFormData({ mapEmbedCode })}
            isValid={!!formData.mapEmbedCode.trim()}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!formData.mapEmbedCode.trim()}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Specifications',
      content: (
        <div>
          <SpecificationsStep
            formData={formData}
            updateFormData={updateFormData}
            isValid={!!formData.capacity && !!formData.area}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={() => setStep(4)} disabled={!formData.capacity || !formData.area}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Media Upload',
      content: (
        <div>
          <MediaStep
            formData={formData}
            updateFormData={updateFormData}
            isValid={formData.photos.length > 0}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={() => setStep(5)} disabled={formData.photos.length === 0}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Pricing & Booking',
      content: (
        <div>
          <PricingStep
            formData={formData}
            updateFormData={updateFormData}
            isValid={!!formData.pricePerHour || !!formData.pricePerDay}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button onClick={() => setStep(6)} disabled={!formData.pricePerHour && !formData.pricePerDay}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Contact Information',
      content: (
        <div>
          <ContactStep
            formData={formData}
            updateFormData={updateFormData}
            isValid={!!formData.contactNumber && !!formData.email}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(5)}>
              Back
            </Button>
            <Button onClick={() => setStep(7)} disabled={!formData.contactNumber || !formData.email}>
              Next
            </Button>
          </div>
        </div>
      )
    },
    {
      title: 'Review & Submit',
      content: (
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review Your Venue Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Name:</strong> {formData.venueName}</div>
                <div><strong>Type:</strong> {formData.venueType}</div>
                <div><strong>Address:</strong> {formData.address}</div>
                <div><strong>Google Maps Link:</strong> {formData.locationLink}</div>
                <div><strong>Website:</strong> {formData.website}</div>
                <div className="md:col-span-2">
                  <strong>Description:</strong>
                  <div className="whitespace-pre-wrap text-muted-foreground mt-1 break-words max-h-40 overflow-y-auto border rounded p-2 bg-muted/30">{formData.description}</div>
                </div>
                <div className="md:col-span-2">
                  <strong>Map Preview:</strong>
                  {formData.mapEmbedCode && /^<iframe[\s\S]*<\/iframe>$/.test(formData.mapEmbedCode.trim()) ? (
                    <div className="mt-2 border rounded overflow-hidden">
                      <div className="aspect-video w-full">
                        <div dangerouslySetInnerHTML={{ __html: formData.mapEmbedCode }} />
                      </div>
                    </div>
                  ) : formData.mapEmbedCode ? (
                    <div className="text-sm text-red-600">Invalid embed code. Please paste a valid Google Maps {'<iframe>'} embed code.</div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No map embed code provided.</p>
                  )}
                </div>
                <div><strong>Capacity:</strong> {formData.capacity}</div>
                <div><strong>Area (sq.ft):</strong> {formData.area}</div>
                <div className="md:col-span-2">
                  <strong>Amenities:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.amenities.length > 0 ? formData.amenities.map((id) => (
                      <span key={id} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs">{id}</span>
                    )) : <span className="text-muted-foreground">None selected</span>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <strong>Photos:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.photos.length > 0 ? formData.photos.map((file, idx) => (
                      <img key={idx} src={URL.createObjectURL(file)} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
                    )) : <span className="text-muted-foreground">None uploaded</span>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <strong>Videos:</strong>
                  <div className="flex flex-col gap-1 mt-1">
                    {formData.videos.length > 0 ? formData.videos.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{url}</a>
                    )) : <span className="text-muted-foreground">None provided</span>}
                  </div>
                </div>
                <div><strong>Price Per Hour:</strong> {formData.pricePerHour ? `₹${formData.pricePerHour}` : 'N/A'}</div>
                <div><strong>Price Per Day:</strong> {formData.pricePerDay ? `₹${formData.pricePerDay}` : 'N/A'}</div>
                <div className="md:col-span-2">
                  <strong>Availability:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.availability.length > 0 ? formData.availability.map((day) => (
                      <span key={day} className="inline-block bg-accent text-foreground px-2 py-1 rounded text-xs">{day}</span>
                    )) : <span className="text-muted-foreground">Not specified</span>}
                  </div>
                </div>
                <div><strong>Contact Number:</strong> {formData.contactNumber}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Company:</strong> {formData.company || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(6)} type="button">
              Back
            </Button>
            <Button type="submit" disabled={submitting} className="px-8">
              {submitting ? 'Submitting...' : 'Submit Venue'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">List Your Venue</h1>
          <p className="text-muted-foreground">Modern, beautiful multi-step form using shadcn/ui + Lucide icons</p>
        </div>
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="text-xl font-semibold text-foreground">
              {steps[step].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {success && (
              <div className="mb-6 text-green-700 bg-green-50 border border-green-200 rounded p-4 text-lg text-center">
                <strong>Venue submitted successfully!</strong>
              </div>
            )}
            {error && (
              <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            {steps[step].content}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}