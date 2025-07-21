
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BasicInfoSection } from "./forms/BasicInfoSection";
import { PricingSection } from "./forms/PricingSection";
import { AmenitiesPicker } from '@/components/common/AmenitiesPicker';
import { AvailabilitySection } from "./forms/AvailabilitySection";
import { Venue } from "@/pages/cricket-dashboard/VenuesPage";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Plus, Image, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { venueService, Subvenue } from '@/lib/venueService';
import { Dialog as Modal, DialogContent as ModalContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EditVenueDialogProps {
  venue: Venue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (venue: Venue) => void;
}

// Extend Venue type locally to include featured_image and featured_video
interface VenueWithFeatured extends Venue {
  featured_image?: string;
  featured_video?: string;
}

// Extend Subvenue type locally to allow featured_image
interface SubvenueWithImage extends Subvenue {
  featured_image?: string;
}

const BOOKING_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Per Day' },
  { value: 'both', label: 'Both' }
];

export function EditVenueDialog({ venue, open, onOpenChange, onUpdate }: EditVenueDialogProps) {
  // Define a type for formData
  type Availability = {
    [key: string]: { start: string; end: string; available: boolean };
  };
  interface FormData {
    name: string;
    description: string;
    address: string;
    capacity: string;
    hourlyRate: string;
    peakHourRate: string;
    amenities: string[];
    status: string;
    availability: Availability;
    weeklyAvailability: Availability; // NEW: for jsonb
    photos: string[];
    videos: string[];
    mapEmbedCode: string;
    featuredImage: string;
    bookingType: 'hourly' | 'daily' | 'both';
  }
  // Helper to normalize availability
  const normalizeAvailability = (input: any): Availability => {
    const days = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
    const defaultDay = { start: '', end: '', available: false };
    const result: Availability = {};
    days.forEach(day => {
      result[day] = input && input[day] ? input[day] : { ...defaultDay };
    });
    return result;
  };
  const typedVenue = venue as VenueWithFeatured;
  const [formData, setFormData] = useState<FormData>({
    name: venue.name,
    description: venue.description || '',
    address: venue.address,
    capacity: (venue.capacity !== undefined ? String(venue.capacity) : ''),
    hourlyRate: venue.pricing?.hourlyRate?.toString() || '',
    peakHourRate: venue.pricing?.peakHourRate?.toString() || '',
    amenities: [...(venue.amenities || [])],
    status: (venue.status as 'inactive' | 'active' | 'maintenance') || 'inactive',
    availability: normalizeAvailability(venue.availability),
    weeklyAvailability: normalizeAvailability((venue as any).weekly_availability), // NEW
    photos: [...(venue.photos || [])],
    videos: [...(venue.videos || [])],
    mapEmbedCode: (venue.map_embed_code ?? ''),
    featuredImage: (venue as any).featured_image || (venue.photos && venue.photos[0]) || '',
    bookingType: (venue as any).booking_type || 'hourly',
  });

  useEffect(() => {
    setFormData({
      name: venue.name,
      description: venue.description || '',
      address: venue.address,
      capacity: (venue.capacity !== undefined ? String(venue.capacity) : ''),
      hourlyRate: venue.pricing?.hourlyRate?.toString() || '',
      peakHourRate: venue.pricing?.peakHourRate?.toString() || '',
      amenities: [...(venue.amenities || [])],
      status: (venue.status as 'inactive' | 'active' | 'maintenance') || 'inactive',
      availability: normalizeAvailability(venue.availability),
      weeklyAvailability: normalizeAvailability((venue as any).weekly_availability), // NEW
      photos: [...(venue.photos || [])],
      videos: [...(venue.videos || [])],
      mapEmbedCode: (venue.map_embed_code ?? ''),
      featuredImage: (venue as any).featured_image || (venue.photos && venue.photos[0]) || '',
      bookingType: (venue as any).booking_type || 'hourly',
    });
  }, [venue]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Media handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setNewImages((prev) => [...prev, ...newFiles].slice(0, 10));
    }
  };
  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };
  const removeNewPhoto = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };
  const addVideoUrl = () => {
    setFormData((prev) => ({ ...prev, videos: [...prev.videos, ""] }));
  };
  const updateVideoUrl = (index: number, url: string) => {
    setFormData((prev) => {
      const updated = [...prev.videos];
      updated[index] = url;
      return { ...prev, videos: updated };
    });
  };
  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  // Add state for validation error
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mapEmbedCode.trim()) {
      alert('Map embed code is required.');
      return;
    }
    let uploadedUrls: string[] = [];
    if (newImages.length > 0) {
      const { VenueSubmissionService } = await import("@/lib/venueSubmissionService");
      const uploadResults = await VenueSubmissionService.uploadFiles(newImages, "venue-images");
      const failed = uploadResults.filter((r: any) => !r.success);
      if (failed.length > 0) {
        alert("Failed to upload one or more images: " + failed.map((f: any) => f.error).join(", "));
        return;
      }
      uploadedUrls = uploadResults.map((r: any) => r.url!);
    }
    // Validate weekly availability based on booking type
    if (formData.bookingType === 'hourly' || formData.bookingType === 'both') {
      const hasValidSlot = Object.values(formData.weeklyAvailability).some(
        day => day.available && day.start && day.end
      );
      if (!hasValidSlot) {
        setAvailabilityError('For Hourly or Both, please set at least one active day with start and end time.');
        return;
      }
    }
    setAvailabilityError(null);
    // Convert availability object to array of available days for DB (legacy)
    const availableDays: string[] = Object.entries(formData.availability)
      .filter(([day, val]) => val.available)
      .map(([day]) => day);
    // Ensure status is always safeStatus in update logic
    const allowedStatuses = ['inactive', 'active', 'maintenance'] as const;
    const safeStatus = allowedStatuses.includes(formData.status as any)
      ? (formData.status as 'inactive' | 'active' | 'maintenance')
      : 'inactive';
    const updatedVenue = {
      ...venue,
      venue_name: formData.name,
      description: formData.description,
      address: formData.address,
      capacity: parseInt(formData.capacity) || 0,
      price_per_hour: parseFloat(formData.hourlyRate) || 0,
      price_per_day: parseFloat(formData.peakHourRate) || 0,
      amenities: formData.amenities,
      status: ((['inactive', 'active', 'maintenance'].includes(formData.status as string)
        ? formData.status
        : 'active') as 'inactive' | 'active' | 'maintenance'),
      availability: formData.availability, // keep as object for UI
      weekly_availability: formData.weeklyAvailability, // NEW: jsonb
      photos: [...formData.photos, ...uploadedUrls],
      videos: formData.videos,
      map_embed_code: formData.mapEmbedCode,
      featured_image: formData.featuredImage,
      booking_type: formData.bookingType,
    };
    try {
      const { error } = await supabase.from("venues").update({
        venue_name: updatedVenue.venue_name,
        description: updatedVenue.description,
        address: updatedVenue.address,
        capacity: updatedVenue.capacity,
        price_per_hour: updatedVenue.price_per_hour,
        price_per_day: updatedVenue.price_per_day,
        amenities: updatedVenue.amenities,
        status: updatedVenue.status as 'inactive' | 'active' | 'maintenance',
        availability: availableDays, // send as text[] to DB (legacy)
        weekly_availability: updatedVenue.weekly_availability, // NEW: jsonb
        photos: updatedVenue.photos,
        videos: updatedVenue.videos,
        map_embed_code: updatedVenue.map_embed_code,
        featured_image: updatedVenue.featured_image,
        booking_type: updatedVenue.booking_type,
      }).eq("id", updatedVenue.id);
      if (error) throw error;
      onUpdate({ ...updatedVenue, status: safeStatus as 'inactive' | 'active' | 'maintenance' });
      onOpenChange(false);
    } catch (err) {
      alert("Failed to update venue: " + (err as Error).message);
    }
  };

  const updateAvailability = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  // Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Remove draftSubvenues state and logic
  // Replace with only submittedSubvenues (fetched from DB)
  const [submittedSubvenues, setSubmittedSubvenues] = useState<SubvenueWithImage[]>([]);
  const [subvenueModalOpen, setSubvenueModalOpen] = useState(false);
  const [subvenueForm, setSubvenueForm] = useState<Partial<Subvenue>>({});
  const [subvenueAvailability, setSubvenueAvailability] = useState<Record<string, { start: string; end: string; available: boolean }>>({});

  // Add missing state for enlarged image modal
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Fetch submitted subvenues from DB when dialog opens or venue changes
  useEffect(() => {
    if (open && venue.id) {
      venueService.getSubvenuesByVenue(venue.id).then(setSubmittedSubvenues);
    }
  }, [open, venue.id]);

  // Update handleOpenAddSubvenue and handleEditSubvenue
  const handleOpenAddSubvenue = () => {
    setSubvenueForm({});
    setSubvenueAvailability({});
    setSubvenueModalOpen(true);
  };
  const handleEditSubvenue = (subvenue: Subvenue) => {
    setSubvenueForm(subvenue);
    setSubvenueAvailability(subvenue.subvenue_availability || {});
    setSubvenueModalOpen(true);
  };
  // Fix handleDeleteSubvenue to delete from DB and refresh list
  const handleDeleteSubvenue = async (subvenueId: string) => {
    try {
      await venueService.deleteSubvenue(subvenueId);
      const updated = await venueService.getSubvenuesByVenue(venue.id);
      setSubmittedSubvenues(updated);
    } catch (err) {
      alert('Failed to delete subvenue: ' + (err as Error).message);
    }
  };
  const handleSubvenueFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSubvenueForm(prev => ({ ...prev, [name]: value }));
  };
  // In handleSubvenueSave, use canonical names
  const handleSubvenueSave = async () => {
    const allowedStatuses = ['inactive', 'active', 'maintenance'] as const;
    const safeStatus: 'inactive' | 'active' | 'maintenance' =
      allowedStatuses.includes(subvenueForm.status as any)
        ? (subvenueForm.status as 'inactive' | 'active' | 'maintenance')
        : 'active';
    const subvenueData = {
      ...subvenueForm,
      venue_id: venue.id,
      status: safeStatus,
      updated_at: new Date().toISOString(),
      subvenue_availability: subvenueAvailability,
      price_per_hour: subvenueForm.price_per_hour || 0,
      price_per_day: subvenueForm.price_per_day || 0,
    };
    try {
      if (subvenueForm.id) {
        // Edit mode: update existing subvenue
        await venueService.updateSubvenue(subvenueForm.id, subvenueData);
      } else {
        // Create mode: add new subvenue
        await venueService.createSubvenue(subvenueData);
      }
      // Refresh submitted subvenues from DB
      const updated = await venueService.getSubvenuesByVenue(venue.id);
      setSubmittedSubvenues(updated);
      setSubvenueModalOpen(false);
    } catch (err) {
      alert('Failed to save subvenue: ' + (err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {venue.name}</DialogTitle>
          <DialogDescription>
            Update your venue details below. All fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection
            formData={{ name: formData.name, address: formData.address, status: formData.status }}
            onChange={handleFieldChange}
          />
          <div className="space-y-2">
            <Label htmlFor="capacity" className="font-medium">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={formData.capacity}
              onChange={e => handleFieldChange('capacity', e.target.value)}
              placeholder="Enter maximum occupancy (e.g. 100)"
              required
            />
          </div>
          <Label htmlFor="description" className="font-medium mt-2">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Venue description"
            className="w-full mb-4"
            rows={4}
          />
          <AmenitiesPicker
            amenities={formData.amenities}
            onChange={(updated) => setFormData((prev) => ({ ...prev, amenities: updated }))}
          />

          <PricingSection
            formData={{ hourlyRate: formData.hourlyRate, peakHourRate: formData.peakHourRate }}
            onChange={handleFieldChange}
          />

          {/* Media Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Image className="w-4 h-4 text-primary" />
                Venue Photos
              </Label>
              <div
                className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-all duration-200 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload photos or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum 10 photos, up to 5MB each (JPG, PNG, WebP)
                </p>
                <Button type="button" variant="outline" className="mt-4">
                  Choose Files
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              {/* Existing images */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.photos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Venue photo ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg border cursor-zoom-in ${formData.featuredImage === url ? 'ring-2 ring-yellow-400' : ''}`}
                        onClick={() => {
                          setGalleryOpen(true);
                          setGalleryIndex(index);
                        }}
                      />
                      {formData.featuredImage === url && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs">Featured</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* New images */}
              {newImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New venue photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.photos.length + newImages.length}/10 photos
              </p>
            </div>
            {/* Video URLs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Video className="w-4 h-4 text-primary" />
                  Video URLs (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVideoUrl}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Video
                </Button>
              </div>
              {formData.videos.map((video, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={video}
                    onChange={(e) => updateVideoUrl(index, e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="flex-1 transition-all duration-200 focus:shadow-md"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeVideo(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {formData.videos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add YouTube or Vimeo video links to showcase your venue
                </p>
              )}
            </div>
          </div>

          {/* Map Embed Code Section */}
          <div className="space-y-2">
            <Label htmlFor="map-embed-code" className="font-medium">Map Embed Code *</Label>
            <Input
              id="map-embed-code"
              value={formData.mapEmbedCode}
              onChange={e => setFormData(prev => ({ ...prev, mapEmbedCode: e.target.value }))}
              placeholder="Paste Google Maps embed code here"
              required
            />
            {formData.mapEmbedCode && (
              <div className="mt-2 border rounded overflow-hidden">
                <div className="aspect-video w-full">
                  <iframe
                    srcDoc={formData.mapEmbedCode}
                    title="Venue Map"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Move Booking Type selector here, just above AvailabilitySection */}
          <div className="space-y-2 pb-2 border-b border-gray-200 mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Booking Type</h3>
            <Label className="text-sm sm:text-base font-medium">How can users book this venue?</Label>
            <RadioGroup
              value={formData.bookingType}
              onValueChange={val => setFormData(prev => ({ ...prev, bookingType: val as 'hourly' | 'daily' | 'both' }))}
              className="flex flex-col gap-3 pt-2"
            >
              {BOOKING_TYPE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer hover:bg-accent/30 rounded px-2 py-2 transition-colors">
                  <RadioGroupItem value={opt.value} className="h-5 w-5 border-2 border-primary focus:ring-2 focus:ring-primary" />
                  <span className="text-base">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <AvailabilitySection
            availability={formData.weeklyAvailability}
            onChange={(day, field, value) => setFormData(prev => ({
              ...prev,
              weeklyAvailability: {
                ...prev.weeklyAvailability,
                [day]: {
                  ...prev.weeklyAvailability[day],
                  [field]: value
                }
              }
            }))}
          />
          {formData.bookingType === 'daily' && (
            <div className="text-xs text-muted-foreground mt-1">(Optional: Set weekly availability for info only. Not required for daily booking.)</div>
          )}
          {(formData.bookingType === 'hourly' || formData.bookingType === 'both') && (
            <div className="text-xs mt-1" style={{ color: availabilityError ? '#dc2626' : '#64748b' }}>
              {availabilityError || 'Required: Set at least one active day with start and end time for hourly/both booking.'}
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Sub-Venues / Spaces</h3>
              <Button type="button" onClick={handleOpenAddSubvenue}>Add Subvenue/Space</Button>
            </div>
            {/* Submitted subvenues (from DB) */}
            {submittedSubvenues.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Submitted Sub-Venues / Spaces</h4>
                <ul className="space-y-2">
                  {submittedSubvenues.map((sv: SubvenueWithImage) => (
                    <li key={sv.id} className="border rounded p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-2">
                          {'featured_image' in sv && sv.featured_image ? (
                            <img src={sv.featured_image} alt="featured" className="w-8 h-8 object-cover rounded border-2 border-primary/60" />
                          ) : null}
                          {sv.name}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditSubvenue(sv)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSubvenue(sv.id)}>Delete</Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{sv.description}</div>
                      <div className="text-xs">Capacity: {sv.capacity || '-'}, Price/hr: {sv.price_per_hour || '-'}, Price/day: {sv.price_per_day || '-'}, Status: {sv.status}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Draft subvenues (not yet submitted) */}
            {/* This section is no longer needed as we only show submitted subvenues */}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={false}>
              {/* subvenueSaving is removed, so always enabled */}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Add image gallery modal for enlarged view and mark as featured */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl flex flex-col items-center">
          {formData.photos.length > 0 && (
            <div className="relative w-full flex flex-col items-center">
              <img
                src={formData.photos[galleryIndex]}
                alt={`Venue photo ${galleryIndex + 1}`}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              <button
                className={`absolute top-2 left-2 text-2xl ${formData.photos[galleryIndex] === formData.featuredImage ? 'text-yellow-400' : 'text-gray-400'} bg-white/80 rounded-full p-1 shadow`}
                onClick={() => setFormData(prev => ({ ...prev, featuredImage: formData.photos[galleryIndex] }))}
                title="Mark as Featured Image"
              >
                ★
              </button>
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                <button
                  onClick={() => setGalleryIndex((galleryIndex - 1 + formData.photos.length) % formData.photos.length)}
                  className="bg-white/80 hover:bg-white text-black rounded-full p-2 shadow"
                  disabled={formData.photos.length <= 1}
                >
                  &#8592;
                </button>
              </div>
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                <button
                  onClick={() => setGalleryIndex((galleryIndex + 1) % formData.photos.length)}
                  className="bg-white/80 hover:bg-white text-black rounded-full p-2 shadow"
                  disabled={formData.photos.length <= 1}
                >
                  &#8594;
                </button>
              </div>
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setGalleryOpen(false)}
                  className="bg-black/70 hover:bg-black text-white rounded-full p-2"
                >
                  &#10005;
                </button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {galleryIndex + 1} / {formData.photos.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subvenue Modal */}
      <Dialog open={subvenueModalOpen} onOpenChange={setSubvenueModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{subvenueForm.id ? 'Edit Subvenue/Space' : 'Add Subvenue/Space'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={subvenueForm.name || ''} onChange={handleSubvenueFormChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={subvenueForm.description || ''} onChange={handleSubvenueFormChange} />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" value={subvenueForm.capacity || ''} onChange={handleSubvenueFormChange} />
              {/* (Note: capacity is not stored in DB, add a comment) */}
            </div>
            <div>
              <Label htmlFor="price_per_hour">Price per Hour</Label>
              <Input id="price_per_hour" name="price_per_hour" type="number" value={subvenueForm.price_per_hour || ''} onChange={handleSubvenueFormChange} />
            </div>
            <div>
              <Label htmlFor="price_per_day">Price per Day</Label>
              <Input id="price_per_day" name="price_per_day" type="number" value={subvenueForm.price_per_day || ''} onChange={handleSubvenueFormChange} />
            </div>
            {/* Availability section */}
            <div>
              <Label>Availability</Label>
              <AvailabilitySection
                availability={subvenueAvailability}
                onChange={(day, field, value) => setSubvenueAvailability(prev => ({
                  ...prev,
                  [day]: { ...prev[day], [field]: value }
                }))}
              />
            </div>
            {/* Images upload/preview with enlarge and featured image selection */}
            <div>
              <Label>Images</Label>
              <input type="file" multiple accept="image/*" onChange={e => {
                const files = Array.from(e.target.files || []);
                setSubvenueForm(prev => ({ ...prev, images: [...(prev.images || []), ...files.map(f => URL.createObjectURL(f))] }));
              }} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {(subvenueForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="subvenue" className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-primary/30" onClick={() => setEnlargedImage(img)} />
                    <button type="button" className="absolute top-0 right-0 bg-destructive text-white rounded-full p-1" onClick={e => { e.stopPropagation(); setSubvenueForm(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) })); }}><X className="w-3 h-3" /></button>
                    {('featured_image' in subvenueForm) && typeof (subvenueForm as any).featured_image === 'string' && (
                      <button type="button" className={`absolute bottom-0 left-0 bg-primary text-white rounded-full p-1 text-xs ${(subvenueForm as any).featured_image === img ? 'opacity-100' : 'opacity-60'}`} onClick={e => { e.stopPropagation(); setSubvenueForm(prev => ({ ...prev, featured_image: img })); }}>★</button>
                    )}
                  </div>
                ))}
              </div>
              {/* Enlarged image modal */}
              <Modal open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
                <ModalContent className="max-w-2xl flex flex-col items-center">
                  {enlargedImage && <img src={enlargedImage} alt="Enlarged" className="w-full max-h-[70vh] object-contain rounded-lg" />}
                </ModalContent>
              </Modal>
            </div>
            {/* Videos URLs */}
            <div>
              <Label>Video URLs</Label>
              {(subvenueForm.videos || []).map((video, idx) => (
                <div key={idx} className="flex gap-2 mt-1">
                  <Input value={video} onChange={e => setSubvenueForm(prev => ({ ...prev, videos: (prev.videos || []).map((v, i) => i === idx ? e.target.value : v) }))} placeholder="https://youtube.com/..." />
                  <Button type="button" variant="outline" size="icon" onClick={() => setSubvenueForm(prev => ({ ...prev, videos: (prev.videos || []).filter((_, i) => i !== idx) }))}><X className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setSubvenueForm(prev => ({ ...prev, videos: [...(prev.videos || []), ''] }))} className="mt-2"><Plus className="w-4 h-4" /> Add Video</Button>
            </div>
            {/* Amenities picker */}
            <div>
              <Label>Amenities</Label>
              <AmenitiesPicker amenities={subvenueForm.amenities as string[] || []} onChange={updated => setSubvenueForm(prev => ({ ...prev, amenities: updated }))} />
            </div>
            {/* Add fields for features, images, videos, amenities as needed */}
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setSubvenueModalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubvenueSave} disabled={false}>{subvenueForm.id ? 'Save Changes' : 'Add Subvenue'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
