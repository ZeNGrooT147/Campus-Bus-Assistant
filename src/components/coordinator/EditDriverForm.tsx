import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditDriverFormProps {
  driverId: string;
  currentName: string;
  currentPhone: string;
  currentStatus: string;
  currentPhoto?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditDriverForm = ({
  driverId,
  currentName,
  currentPhone,
  currentStatus,
  currentPhoto,
  onSuccess,
  onCancel
}: EditDriverFormProps) => {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [status, setStatus] = useState(currentStatus);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhoto || null);
  const [isLoading, setIsLoading] = useState(false);

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

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload photo');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      let photoUrl = currentPhoto;

      if (photo) {
        try {
          photoUrl = await uploadPhoto(photo);
        } catch (error) {
          console.error('Photo upload failed:', error);
          toast.error('Failed to upload photo. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          status,
          profile_photo_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Failed to update profile');
      }

      toast.success('Driver profile updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating driver:', error);
      toast.error(error.message || 'Failed to update driver profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || ''} alt={name} />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="photo" className="cursor-pointer">
                <Button variant="outline" type="button">
                  Change Photo
                </Button>
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter driver's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverForm; 