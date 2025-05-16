
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AdminAddUserData } from '@/context/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultRole?: 'student' | 'driver' | 'coordinator';
}

const AddUserDialog = ({ open, onOpenChange, onSuccess, defaultRole = 'student' }: AddUserDialogProps) => {
  const { adminAddUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availableBuses, setAvailableBuses] = useState<{id: string, name: string, bus_number: string}[]>([]);
  
  const [formData, setFormData] = useState<AdminAddUserData>({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    usn: '',
    phone: '',
    region: 'Hubli',
  });
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        usn: '',
        phone: '',
        region: 'Hubli',
      });
    }
  }, [open, defaultRole]);
  
  // Fetch available buses for driver assignment
  useEffect(() => {
    if (open && formData.role === 'driver') {
      const fetchBuses = async () => {
        const { data, error } = await supabase
          .from('buses')
          .select('id, name, bus_number')
          .is('assigned_driver', null)
          .eq('status', 'active');
          
        if (!error && data) {
          setAvailableBuses(data);
        }
      };
      
      fetchBuses();
    }
  }, [open, formData.role]);
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.role === 'student' && !formData.usn) {
      toast.error('USN is required for students');
      return;
    }
    
    if ((formData.role === 'driver' || formData.role === 'coordinator') && !formData.phone) {
      toast.error('Phone number is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Add user through auth context
      await adminAddUser(formData);
      
      toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} added successfully`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleChange('role', value as 'student' | 'driver' | 'coordinator')}
              disabled={!!defaultRole}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="col-span-3"
              placeholder="Full name"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="col-span-3"
              placeholder="Email address"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="col-span-3"
              placeholder="Set a password"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="col-span-3"
              placeholder="Phone number"
              required={formData.role === 'driver' || formData.role === 'coordinator'}
            />
          </div>
          
          {formData.role === 'student' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usn" className="text-right">USN</Label>
              <Input
                id="usn"
                value={formData.usn || ''}
                onChange={(e) => handleChange('usn', e.target.value)}
                className="col-span-3"
                placeholder="University Serial Number"
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="region" className="text-right">Region</Label>
            <Select 
              value={formData.region || 'Hubli'} 
              onValueChange={(value) => handleChange('region', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hubli">Hubli</SelectItem>
                <SelectItem value="Dharwad">Dharwad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.role === 'driver' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="busAssigned" className="text-right">Bus Assignment</Label>
              <Select 
                value={formData.busAssigned || ''} 
                onValueChange={(value) => handleChange('busAssigned', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign to bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No assignment</SelectItem>
                  {availableBuses.map(bus => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.name} ({bus.bus_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              'Add User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
