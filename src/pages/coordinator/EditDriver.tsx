import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCoordinatorBuses } from '@/hooks/useCoordinatorBuses';

const EditDriver = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { refreshData } = useCoordinatorBuses();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'available',
    email: '',
    profile_photo_url: ''
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadDriverData = async () => {
      if (!driverId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', driverId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            status: data.status || 'available',
            email: data.email || '',
            profile_photo_url: data.profile_photo_url || ''
          });
          setPhotoPreview(data.profile_photo_url);
        }
      } catch (error) {
        console.error('Error loading driver:', error);
        toast.error('Failed to load driver data');
      }
    };

    loadDriverData();
  }, [driverId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) return;

    setSaving(true);
    try {
      let photoUrl = formData.profile_photo_url;

      // Upload new photo if selected
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${driverId}-${Date.now()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload photo');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', driverId)
        .single();

      if (checkError) {
        console.error('Profile check error:', checkError);
        throw new Error('Profile not found');
      }

      // Update the driver's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          status: formData.status,
          email: formData.email,
          profile_photo_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update profile');
      }

      toast.success('Driver profile updated successfully');
      await refreshData();
      navigate('/coordinator/drivers');
    } catch (error: any) {
      console.error('Error updating driver:', error);
      toast.error(error.message || 'Failed to update driver profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/coordinator/drivers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Driver Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={photoPreview || ''} alt={formData.name} />
                  <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                </label>
                <Input 
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter driver's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_duty">On Duty</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/coordinator/drivers')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditDriver; 