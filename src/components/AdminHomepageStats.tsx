import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { toast } from 'sonner';

interface HomepageStat {
  id: string;
  stat_type: string;
  stat_value: number;
  stat_label: string;
  stat_description: string;
  display_order: number;
  is_active: boolean;
  icon: string;
  updated_at: string;
}

interface StatFormData {
  stat_type: string;
  stat_value: number;
  stat_label: string;
  stat_description: string;
  display_order: number;
  is_active: boolean;
  icon: string;
}

export default function AdminHomepageStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<StatFormData>({
    stat_type: '',
    stat_value: 0,
    stat_label: '',
    stat_description: '',
    display_order: 0,
    is_active: true,
    icon: '🌍'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_stats')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch homepage stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing stat
        const { error } = await supabase
          .from('homepage_stats')
          .update({
            ...formData,
            updated_by: user?.id
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Stat updated successfully');
      } else {
        // Create new stat
        const { error } = await supabase
          .from('homepage_stats')
          .insert({
            ...formData,
            updated_by: user?.id
          });

        if (error) throw error;
        toast.success('Stat created successfully');
      }

      resetForm();
      fetchStats();
    } catch (error) {
      console.error('Error saving stat:', error);
      toast.error('Failed to save stat');
    }
  };

  const handleEdit = (stat: HomepageStat) => {
    setFormData({
      stat_type: stat.stat_type,
      stat_value: stat.stat_value,
      stat_label: stat.stat_label,
      stat_description: stat.stat_description,
      display_order: stat.display_order,
      is_active: stat.is_active,
      icon: stat.icon
    });
    setEditingId(stat.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;

    try {
      const { error } = await supabase
        .from('homepage_stats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Stat deleted successfully');
      fetchStats();
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast.error('Failed to delete stat');
    }
  };

  const resetForm = () => {
    setFormData({
      stat_type: '',
      stat_value: 0,
      stat_label: '',
      stat_description: '',
      display_order: stats.length + 1,
      is_active: true,
      icon: '🌍'
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const commonIcons = ['🏛️', '🗺️', '🎨', '🌍', '📍', '🏛', '🖼️', '🎭', '🏰', '⛩️'];

  if (loading) {
    return <AudioGuideLoader variant="inline" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Homepage Statistics</h2>
          <p className="text-muted-foreground">
            Manage the "Did You Know?" statistics displayed on the homepage
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Stat
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Statistic' : 'Create New Statistic'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the statistic details' : 'Add a new statistic to the homepage'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_label">Label</Label>
                  <Input
                    id="stat_label"
                    value={formData.stat_label}
                    onChange={(e) => setFormData({ ...formData, stat_label: e.target.value })}
                    placeholder="e.g., UNESCO Sites"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_value">Value</Label>
                  <Input
                    id="stat_value"
                    type="number"
                    value={formData.stat_value}
                    onChange={(e) => setFormData({ ...formData, stat_value: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 1154"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stat_description">Description</Label>
                <Textarea
                  id="stat_description"
                  value={formData.stat_description}
                  onChange={(e) => setFormData({ ...formData, stat_description: e.target.value })}
                  placeholder="e.g., World Heritage destinations"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_type">Type</Label>
                  <Input
                    id="stat_type"
                    value={formData.stat_type}
                    onChange={(e) => setFormData({ ...formData, stat_type: e.target.value })}
                    placeholder="e.g., unesco_sites"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commonIcons.map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={formData.icon === icon ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🌍"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats List */}
      <div className="grid gap-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{stat.icon}</div>
                <div>
                  <h3 className="font-semibold">{stat.stat_label}</h3>
                  <p className="text-sm text-muted-foreground">{stat.stat_description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Value: {stat.stat_value.toLocaleString()}</span>
                    <span>Order: {stat.display_order}</span>
                    <span>Status: {stat.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(stat)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(stat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No statistics found</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Stat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}