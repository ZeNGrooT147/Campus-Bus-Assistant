import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader, Image, UserPlus, Upload } from 'lucide-react';

// Define the form schema
const driverFormSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

const DriverRegistration = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: DriverFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Show loading toast for better feedback
      const loadingId = toast.loading("Creating driver account...");
      
      // 1. Register the driver in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.fullName,
            role: 'driver',
            phone: values.phone
          }
        }
      });
      
      if (authError) {
        toast.dismiss(loadingId);
        toast.error(authError.message || "Failed to create driver account");
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No user data returned from signup");
      }

      // 2. Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: values.fullName,
          email: values.email,
          phone: values.phone,
          role: 'driver',
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error("Failed to create driver profile");
        throw profileError;
      }

      // 3. Update auth user metadata to ensure name is set
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          name: values.fullName,
          role: 'driver',
          phone: values.phone
        }
      });

      if (updateAuthError) {
        console.error('Auth update error:', updateAuthError);
        toast.warning("Driver account created, but metadata update failed");
      }
      
      // 4. Upload profile photo if provided
      let photoUrl = null;
      if (profileImage && authData.user) {
        const fileName = `driver-${authData.user.id}-${Date.now()}.${profileImage.name.split('.').pop()}`;
        
        // Create storage bucket if it doesn't exist
        const { data: bucketData, error: bucketError } = await supabase.storage
          .getBucket('profile-photos');
          
        if (bucketError && bucketError.message.includes('The resource was not found')) {
          await supabase.storage.createBucket('profile-photos', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 1024 * 1024 * 2 // 2MB
          });
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, profileImage);
          
        if (uploadError) {
          console.error('Error uploading profile photo:', uploadError);
          toast.warning("Driver account created, but profile photo couldn't be uploaded");
        } else {
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);
            
          photoUrl = publicUrl;
          
          // Update the profile with the photo URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              profile_photo_url: photoUrl,
              name: values.fullName // Ensure name is set again
            })
            .eq('id', authData.user.id);
            
          if (updateError) {
            console.error('Error updating profile with photo:', updateError);
          }
        }
      }
      
      // Dismiss loading toast and show success toast
      toast.dismiss(loadingId);
      toast.success("Driver account created successfully");
      
      // Close dialog and reset form
      setIsOpen(false);
      form.reset();
      setProfileImage(null);
      setProfileImagePreview(null);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('Driver registration error:', error);
      toast.error(error.message || "Failed to register driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Register New Driver</DialogTitle>
        <DialogDescription>
          Create a new driver account with full access to the driver dashboard
        </DialogDescription>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <label 
                  htmlFor="profile-photo"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                </label>
                <Input 
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="driver@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Register Driver"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DriverRegistration;
