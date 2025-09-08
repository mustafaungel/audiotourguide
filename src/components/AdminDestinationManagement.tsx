import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES, DESTINATIONS } from '@/data/constants';

interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  best_time_to_visit: string;
  difficulty_level: string;
  popular_attractions: string[];
  cultural_significance: string;
  image_url: string;
  is_approved: boolean;
  suggested_by: string;
  created_at: string;
}

const CATEGORIES = [
  'cultural', 'historical', 'nature', 'adventure', 'food', 'art', 
  'religious', 'architecture', 'entertainment', 'shopping'
];

const DIFFICULTY_LEVELS = ['intermediate', 'advanced'];

export const AdminDestinationManagement = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    category: 'cultural',
    latitude: '',
    longitude: '',
    best_time_to_visit: '',
    difficulty_level: 'intermediate',
    popular_attractions: '',
    cultural_significance: '',
    image_url: ''
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch destinations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.name || !formData.country || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, country, and city before generating description",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          type: 'destination',
          data: {
            name: formData.name,
            country: formData.country,
            city: formData.city,
            category: formData.category
          }
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        description: data.description
      }));

      toast({
        title: "Success",
        description: "Description generated successfully!",
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "Failed to generate description",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const destinationData = {
        name: formData.name,
        country: formData.country,
        city: formData.city,
        description: formData.description,
        category: formData.category,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        best_time_to_visit: formData.best_time_to_visit,
        difficulty_level: formData.difficulty_level,
        popular_attractions: formData.popular_attractions.split(',').map(item => item.trim()).filter(Boolean),
        cultural_significance: formData.cultural_significance,
        image_url: formData.image_url,
        is_approved: true // Admin creates approved destinations
      };

      if (editingId) {
        const { error } = await supabase
          .from('destinations')
          .update(destinationData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "Success", description: "Destination updated successfully!" });
      } else {
        const { error } = await supabase
          .from('destinations')
          .insert([destinationData]);

        if (error) throw error;
        toast({ title: "Success", description: "Destination created successfully!" });
      }

      resetForm();
      fetchDestinations();
    } catch (error) {
      console.error('Error saving destination:', error);
      toast({
        title: "Error",
        description: "Failed to save destination",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (destination: Destination) => {
    setFormData({
      name: destination.name,
      country: destination.country,
      city: destination.city,
      description: destination.description || '',
      category: destination.category,
      latitude: destination.latitude?.toString() || '',
      longitude: destination.longitude?.toString() || '',
      best_time_to_visit: destination.best_time_to_visit || '',
      difficulty_level: destination.difficulty_level,
      popular_attractions: destination.popular_attractions?.join(', ') || '',
      cultural_significance: destination.cultural_significance || '',
      image_url: destination.image_url || ''
    });
    setEditingId(destination.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Destination deleted successfully!" });
      fetchDestinations();
    } catch (error) {
      console.error('Error deleting destination:', error);
      toast({
        title: "Error",
        description: "Failed to delete destination",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.rpc('approve_destination', {
        destination_id: id
      });

      if (error) throw error;
      toast({ title: "Success", description: "Destination approved successfully!" });
      fetchDestinations();
    } catch (error) {
      console.error('Error approving destination:', error);
      toast({
        title: "Error",
        description: "Failed to approve destination",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      city: '',
      description: '',
      category: 'cultural',
      latitude: '',
      longitude: '',
      best_time_to_visit: '',
      difficulty_level: 'intermediate',
      popular_attractions: '',
      cultural_significance: '',
      image_url: ''
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading destinations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Destination Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          Create New Destination
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Destination' : 'Create New Destination'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Destination Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateDescription}
                    disabled={generatingDescription}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {generatingDescription ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="best_time">Best Time to Visit</Label>
                  <Input
                    id="best_time"
                    value={formData.best_time_to_visit}
                    onChange={(e) => setFormData(prev => ({ ...prev, best_time_to_visit: e.target.value }))}
                    placeholder="e.g., Spring (March-May)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="attractions">Popular Attractions (comma-separated)</Label>
                <Input
                  id="attractions"
                  value={formData.popular_attractions}
                  onChange={(e) => setFormData(prev => ({ ...prev, popular_attractions: e.target.value }))}
                  placeholder="e.g., Museum, Cathedral, Park"
                />
              </div>

              <div>
                <Label htmlFor="cultural">Cultural Significance</Label>
                <Textarea
                  id="cultural"
                  value={formData.cultural_significance}
                  onChange={(e) => setFormData(prev => ({ ...prev, cultural_significance: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update Destination' : 'Create Destination'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((destination) => (
          <Card key={destination.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{destination.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {destination.city}, {destination.country}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {destination.is_approved ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><strong>Category:</strong> {destination.category}</p>
                <p className="text-sm"><strong>Difficulty:</strong> {destination.difficulty_level}</p>
                {destination.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {destination.description}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(destination)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!destination.is_approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(destination.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(destination.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {destinations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No destinations found. Create your first destination!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};