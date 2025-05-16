
import { toast } from '@/hooks/use-toast.tsx';
import { supabase } from '@/integrations/supabase/client';
import { Role, User } from '../types/auth';

export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        usn: profile.usn,
        phone: profile.phone,
        region: profile.region
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

export const findEmailByUsn = async (usn: string): Promise<string | null> => {
  try {
    console.log('Looking up email for student with USN:', usn);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('usn', usn)
      .single();
      
    if (profileError) {
      console.error('Error finding user profile by USN:', profileError);
      throw new Error('Invalid USN. Please check your student ID and try again.');
    }
    
    if (profileData && profileData.email) {
      console.log('Found email for USN:', profileData.email);
      return profileData.email;
    } else {
      console.error('No email found for USN:', usn);
      throw new Error('Account not found for this USN.');
    }
  } catch (error) {
    throw error;
  }
};

export const uploadProfilePhoto = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileName = `${userId}/profile`;
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);
      
    if (uploadError) {
      console.error('Error uploading profile photo:', uploadError);
      return null;
    }
    
    const { data: publicURL } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);
      
    if (publicURL) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicURL.publicUrl })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating profile with photo URL:', updateError);
      }
      return publicURL.publicUrl;
    }
    return null;
  } catch (error) {
    console.error('Profile photo upload failed:', error);
    return null;
  }
};

export const navigateToPath = (navigate: Function | undefined, path: string) => {
  if (typeof navigate === 'function') {
    navigate(path);
  } else {
    console.warn('Navigation is not available, component may not be inside Router');
  }
};

export const getRoleDashboardPath = (role: Role): string => {
  switch (role) {
    case 'student': return '/student';
    case 'driver': return '/driver';
    case 'coordinator': return '/coordinator';
    case 'admin': return '/admin';
    default: return '/';
  }
};
