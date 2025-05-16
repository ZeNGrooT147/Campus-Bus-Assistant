
import { type Profile } from '@/integrations/supabase/client';

export type Role = 'student' | 'driver' | 'coordinator' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  usn?: string;
  phone?: string;
  region?: string;
  profile_photo_url?: string;
  created_at?: string;
}

export interface LoginCredentials {
  identifier: string; // USN for students, phone for others
  password: string;
  role: Role;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  usn?: string;
  phone?: string;
  region?: string;
  agreeToTerms: boolean;
  profilePhoto?: File;
}

export interface AdminAddUserData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'driver' | 'coordinator';
  usn?: string;
  phone?: string;
  region?: string;
  busAssigned?: string; // For drivers
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: Role;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  isLoading: boolean;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (password: string) => Promise<any>;
  navigateToRoleDashboard: (role: Role) => void;
  session: any;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  adminAddUser: (userData: AdminAddUserData) => Promise<any>;
  logoutInProgress?: boolean;
}
