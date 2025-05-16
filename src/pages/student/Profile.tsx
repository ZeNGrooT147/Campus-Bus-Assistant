import { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound, Mail, School, Phone, MapPin, Pencil, Clock, Shield, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";

const StudentProfile = () => {
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [region, setRegion] = useState(user?.region || "");
  const [isEditing, setIsEditing] = useState(false);
  
  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          region,
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  // Format the created_at date if it exists
  const formattedJoinDate = user && 'created_at' in user 
    ? new Date(user.created_at as string).toLocaleDateString() 
    : "Unknown";

  return (
    <DashboardLayout pageTitle="My Profile">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="relative">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profile_photo_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {user?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-center">{user?.name}</CardTitle>
            <CardDescription className="text-center flex justify-center items-center gap-1">
              <School className="h-3.5 w-3.5" />
              <span>{user?.usn || "USN not set"}</span>
            </CardDescription>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user?.phone || "Not provided"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{user?.region || "Not specified"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formattedJoinDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent interactions with the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Profile Updated</p>
                    <p className="text-sm text-muted-foreground">{formattedJoinDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="region" className="text-right">
                Region
              </Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentProfile;
