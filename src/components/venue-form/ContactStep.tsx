import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Phone, Mail, Building } from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';

interface ContactStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

export default function ContactStep({ formData, updateFormData }: ContactStepProps) {
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Number */}
        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="flex items-center gap-2 text-sm font-medium">
            <Phone className="w-4 h-4 text-primary" />
            Contact Number *
          </Label>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => updateFormData({ contactNumber: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="transition-all duration-200 focus:shadow-md"
          />
          {formData.contactNumber && !validatePhone(formData.contactNumber) && (
            <p className="text-destructive text-xs">Please enter a valid phone number</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4 text-primary" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="contact@yourvenue.com"
            className="transition-all duration-200 focus:shadow-md"
          />
          {formData.email && !validateEmail(formData.email) && (
            <p className="text-destructive text-xs">Please enter a valid email address</p>
          )}
        </div>
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium">
          <Building className="w-4 h-4 text-primary" />
          Company/Organization (Optional)
        </Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => updateFormData({ company: e.target.value })}
          placeholder="Your Company Name"
          className="transition-all duration-200 focus:shadow-md"
        />
      </div>

      {/* Contact Summary */}
      <div className="bg-accent/50 rounded-lg p-4 border border-accent">
        <h3 className="font-semibold text-foreground mb-3">Contact Information Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">
              {formData.contactNumber || 'Not provided'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">
              {formData.email || 'Not provided'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Company:</span>
            <span className="font-medium">
              {formData.company || 'Individual'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Guidelines */}
      <div className="bg-accent/50 rounded-lg p-6 border border-accent">
        <h3 className="font-semibold text-foreground mb-3">Contact Information Guidelines</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Response Time:</strong> We recommend responding to inquiries within 24 hours for better bookings.</p>
          <p><strong>Professional Email:</strong> Use a business email address if possible for credibility.</p>
          <p><strong>Phone Availability:</strong> Ensure your phone number is active and check voicemails regularly.</p>
          <p><strong>Privacy:</strong> Your contact information will only be shared with verified booking inquiries.</p>
        </div>
      </div>
    </div>
  );
}