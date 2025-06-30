import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { venueService, Venue } from '../lib/venueService';
import { venueTypesConfig, VenueField } from '../config/venueTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const EditVenue: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState<Partial<Venue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!venueId) {
        navigate('/manage-venues');
        return;
      }
      try {
        setLoading(true);
        const data = await venueService.getVenueById(venueId);
        if (data) {
          setVenue(data);
          setFormData(data);
        } else {
          toast.error('Venue not found.');
          navigate('/not-found');
        }
      } catch {
        toast.error('Failed to fetch venue data.');
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [venueId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: checked }));
  };

  const handleSave = async () => {
    if (!venue || !venueId) return;
    setSaving(true);
    try {
      const updated = await venueService.updateVenue(venueId, formData);
      if (updated) {
        toast.success('Venue updated successfully!');
        navigate('/manage-venues');
      } else {
        toast.error('Failed to update venue.');
      }
    } catch {
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const venueConfig = venue ? venueTypesConfig[venue.type] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!venue || !venueConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Venue Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/manage-venues')}>Back to Venues</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Venue: {venue.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {venueConfig.fields.map((field: VenueField) => {
              const value = formData[field.id as keyof Venue] ?? '';
              switch (field.type) {
                case 'select':
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Select
                        value={value as string}
                        onValueChange={val => handleSelectChange(field.id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                case 'checkbox':
                  return (
                    <div key={field.id} className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id={field.id}
                        checked={!!value}
                        onCheckedChange={checked => handleCheckboxChange(field.id, !!checked)}
                      />
                      <Label htmlFor={field.id}>{field.label}</Label>
                    </div>
                  );
                case 'textarea':
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Textarea
                        id={field.id}
                        name={field.id}
                        value={value as string}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                default:
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        value={value as string | number}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
              }
            })}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/manage-venues')}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditVenue; 