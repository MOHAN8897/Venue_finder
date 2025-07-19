import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Save, ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Loader2 className="h-12 w-12 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (!venue || !venueConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Venue Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/manage-venues')}
              className="w-full h-12 sm:h-10"
            >
              Back to Venues
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to="/manage-venues"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Venues
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Edit Venue: {venue.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4 sm:space-y-6"
            >
              {venueConfig.fields.map((field: VenueField) => {
                const value = formData[field.id as keyof Venue] ?? '';
                switch (field.type) {
                  case 'select':
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm sm:text-base font-medium">{field.label}</Label>
                        <Select
                          value={value as string}
                          onValueChange={val => handleSelectChange(field.id, val)}
                        >
                          <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
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
                        <Label htmlFor={field.id} className="text-sm sm:text-base">{field.label}</Label>
                      </div>
                    );
                  case 'textarea':
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm sm:text-base font-medium">{field.label}</Label>
                        <Textarea
                          id={field.id}
                          name={field.id}
                          value={value as string}
                          onChange={handleInputChange}
                          rows={5}
                          placeholder={field.placeholder}
                          className="text-sm sm:text-base"
                        />
                      </div>
                    );
                  default:
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm sm:text-base font-medium">{field.label}</Label>
                        <Input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          value={value as string | number}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          className="h-12 sm:h-10 text-sm sm:text-base"
                        />
                      </div>
                    );
                }
              })}
              {/* Availability section here (existing) */}

              {/* Subvenues/Spaces Section - Mobile Optimized */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-semibold">Sub-Venues / Spaces</h3>
                  <Button 
                    type="button" 
                    onClick={handleOpenAddSubvenue}
                    className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subvenue/Space
                  </Button>
                </div>
                {subvenues.length === 0 ? (
                  <div className="text-muted-foreground text-sm sm:text-base text-center py-8">
                    No sub-venues/spaces added yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {subvenues.map(sv => (
                      <li key={sv.id} className="border rounded-lg p-3 sm:p-4 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="font-medium text-sm sm:text-base">{sv.subvenue_name}</span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditSubvenue(sv)}
                              className="h-10 sm:h-9 text-xs sm:text-sm"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteSubvenue(sv.id)}
                              className="h-10 sm:h-9 text-xs sm:text-sm"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{sv.subvenue_description}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Capacity: {sv.subvenue_capacity || '-'}, Type: {sv.subvenue_type || '-'}, Status: {sv.subvenue_status}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Subvenue Modal - Mobile Optimized */}
              <Dialog open={subvenueModalOpen} onOpenChange={setSubvenueModalOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {editingSubvenue ? 'Edit Subvenue/Space' : 'Add Subvenue/Space'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={e => { e.preventDefault(); handleSubvenueSave(); }} className="space-y-4">
                    <div>
                      <Label htmlFor="subvenue_name" className="text-sm sm:text-base font-medium">Name</Label>
                      <Input 
                        id="subvenue_name" 
                        name="subvenue_name" 
                        value={subvenueForm.subvenue_name || ''} 
                        onChange={handleSubvenueFormChange} 
                        required 
                        className="h-12 sm:h-10 text-sm sm:text-base"
                        placeholder="Enter subvenue name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subvenue_description" className="text-sm sm:text-base font-medium">Description</Label>
                      <Textarea 
                        id="subvenue_description" 
                        name="subvenue_description" 
                        value={subvenueForm.subvenue_description || ''} 
                        onChange={handleSubvenueFormChange}
                        className="text-sm sm:text-base"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subvenue_capacity" className="text-sm sm:text-base font-medium">Capacity</Label>
                      <Input 
                        id="subvenue_capacity" 
                        name="subvenue_capacity" 
                        type="number" 
                        value={subvenueForm.subvenue_capacity || ''} 
                        onChange={handleSubvenueFormChange}
                        className="h-12 sm:h-10 text-sm sm:text-base"
                        placeholder="Enter capacity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subvenue_type" className="text-sm sm:text-base font-medium">Type</Label>
                      <Input 
                        id="subvenue_type" 
                        name="subvenue_type" 
                        value={subvenueForm.subvenue_type || ''} 
                        onChange={handleSubvenueFormChange}
                        className="h-12 sm:h-10 text-sm sm:text-base"
                        placeholder="Enter type"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subvenue_status" className="text-sm sm:text-base font-medium">Status</Label>
                      <Select value={subvenueForm.subvenue_status || 'active'} onValueChange={val => setSubvenueForm(prev => ({ ...prev, subvenue_status: val as any }))}>
                        <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Add more fields for amenities, features, images, videos as needed */}
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => setSubvenueModalOpen(false)}
                        className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={subvenueSaving}
                        className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base"
                      >
                        {subvenueSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate('/manage-venues')}
                  className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditVenue; 