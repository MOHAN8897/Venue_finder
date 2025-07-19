import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { venueService, Venue, Subvenue } from '../lib/venueService';
import { venueTypesConfig, VenueField } from '../config/venueTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

const EditVenue: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState<Partial<Venue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subvenues, setSubvenues] = useState<Subvenue[]>([]);
  const [subvenueModalOpen, setSubvenueModalOpen] = useState(false);
  const [editingSubvenue, setEditingSubvenue] = useState<Subvenue | null>(null);
  const [subvenueForm, setSubvenueForm] = useState<Partial<Subvenue>>({});
  const [subvenueSaving, setSubvenueSaving] = useState(false);

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

  // Fetch subvenues when venue loads
  useEffect(() => {
    if (venueId) {
      venueService.getSubvenuesByVenue(venueId).then(setSubvenues);
    }
  }, [venueId]);

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

  const handleOpenAddSubvenue = () => {
    setEditingSubvenue(null);
    setSubvenueForm({});
    setSubvenueModalOpen(true);
  };
  const handleEditSubvenue = (subvenue: Subvenue) => {
    setEditingSubvenue(subvenue);
    setSubvenueForm(subvenue);
    setSubvenueModalOpen(true);
  };
  const handleDeleteSubvenue = async (subvenueId: string) => {
    if (window.confirm('Delete this subvenue/space?')) {
      await venueService.deleteSubvenue(subvenueId);
      setSubvenues(subvenues.filter(sv => sv.id !== subvenueId));
    }
  };
  const handleSubvenueFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSubvenueForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSubvenueSave = async () => {
    setSubvenueSaving(true);
    try {
      let saved: Subvenue | null = null;
      if (editingSubvenue) {
        saved = await venueService.updateSubvenue(editingSubvenue.id, subvenueForm);
        setSubvenues(subvenues.map(sv => (sv.id === saved?.id ? saved : sv)));
      } else {
        saved = await venueService.createSubvenue({ ...subvenueForm, venue_id: venueId } as any);
        if (saved) setSubvenues([...subvenues, saved]);
      }
      setSubvenueModalOpen(false);
    } catch (e) {
      toast.error('Failed to save subvenue.');
    } finally {
      setSubvenueSaving(false);
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
            {/* Availability section here (existing) */}

            {/* Subvenues/Spaces Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Sub-Venues / Spaces</h3>
                <Button type="button" onClick={handleOpenAddSubvenue}>Add Subvenue/Space</Button>
              </div>
              {subvenues.length === 0 ? (
                <div className="text-muted-foreground">No sub-venues/spaces added yet.</div>
              ) : (
                <ul className="space-y-2">
                  {subvenues.map(sv => (
                    <li key={sv.id} className="border rounded p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sv.subvenue_name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditSubvenue(sv)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSubvenue(sv.id)}>Delete</Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{sv.subvenue_description}</div>
                      <div className="text-xs">Capacity: {sv.subvenue_capacity || '-'}, Type: {sv.subvenue_type || '-'}, Status: {sv.subvenue_status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Subvenue Modal */}
            <Dialog open={subvenueModalOpen} onOpenChange={setSubvenueModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSubvenue ? 'Edit Subvenue/Space' : 'Add Subvenue/Space'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); handleSubvenueSave(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="subvenue_name">Name</Label>
                    <Input id="subvenue_name" name="subvenue_name" value={subvenueForm.subvenue_name || ''} onChange={handleSubvenueFormChange} required />
                  </div>
                  <div>
                    <Label htmlFor="subvenue_description">Description</Label>
                    <Textarea id="subvenue_description" name="subvenue_description" value={subvenueForm.subvenue_description || ''} onChange={handleSubvenueFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="subvenue_capacity">Capacity</Label>
                    <Input id="subvenue_capacity" name="subvenue_capacity" type="number" value={subvenueForm.subvenue_capacity || ''} onChange={handleSubvenueFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="subvenue_type">Type</Label>
                    <Input id="subvenue_type" name="subvenue_type" value={subvenueForm.subvenue_type || ''} onChange={handleSubvenueFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="subvenue_status">Status</Label>
                    <Select value={subvenueForm.subvenue_status || 'active'} onValueChange={val => setSubvenueForm(prev => ({ ...prev, subvenue_status: val as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Add more fields for amenities, features, images, videos as needed */}
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setSubvenueModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={subvenueSaving}>{subvenueSaving ? 'Saving...' : 'Save'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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