import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Building, MapPin, Users, Square, DollarSign, Phone, Mail, Building as BuildingIcon } from 'lucide-react';
import type { VenueFormData } from '../VenueListingForm';
import { AMENITY_CATEGORIES } from './SpecificationsStep';

function getAmenityLabel(id: string): string {
  for (const category of Object.values(AMENITY_CATEGORIES)) {
    const found = category.find((a: { id: string; label: string }) => a.id === id);
    if (found) return found.label;
  }
  return id;
}

interface ReviewStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Venue Listing</h2>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Basic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Venue Name</p>
            <p className="font-semibold">{formData.venueName}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="secondary">{formData.venueType}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Website</p>
              <p className="text-sm">{formData.website || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Address
            </p>
            <p className="text-sm">{formData.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto border rounded p-2 bg-muted/30">{formData.description}</p>
        </CardContent>
      </Card>



      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Capacity:</span>
              <span className="font-semibold">{formData.capacity} people</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Area:</span>
              <span className="font-semibold">{formData.area} sq.ft</span>
            </div>
          </div>
          {formData.amenities.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenityId: string) => (
                  <Badge key={amenityId} variant="outline">
                    {getAmenityLabel(amenityId)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Photos:</p>
              {formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.photos.map((photo: File, index: number) => (
                    <div key={index} className="aspect-video w-full rounded border overflow-hidden">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Venue photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None uploaded</p>
              )}
            </div>
            {formData.videos.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Videos:</p>
                <div className="flex flex-col gap-2">
                  {formData.videos.map((video: string, idx: number) => (
                    <a key={idx} href={video} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {video}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Pricing & Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Hourly Rate</p>
              <p className="font-semibold">${formData.pricePerHour?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Rate</p>
              <p className="font-semibold">${formData.pricePerDay?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          {formData.availability.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Days:</p>
              <div className="flex flex-wrap gap-2">
                {formData.availability.map((day: string) => (
                  <Badge key={day} variant="outline">{day}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Phone:</span>
            <span className="font-medium">{formData.contactNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="md:col-span-2">
            <strong>Owner Name:</strong> {formData.ownerName || 'N/A'}
          </div>
        </CardContent>
      </Card>

      {/* Submission Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Your venue listing will be reviewed by our team within 2-3 business days</p>
          <p>• You'll receive an email confirmation once your venue is approved</p>
          <p>• Your venue will then be visible to customers on our platform</p>
          <p>• You can edit your listing anytime from your dashboard</p>
        </div>
      </div>
    </div>
  );
}