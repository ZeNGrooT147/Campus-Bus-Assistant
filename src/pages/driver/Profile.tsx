
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Phone, Mail, Check, FileText, Calendar, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DriverProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, make an API call to update profile
    setTimeout(() => {
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }, 800);
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-md overflow-hidden border-0">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <CardHeader className="flex flex-row items-center gap-4 pb-2 -mt-16 z-10 relative px-8">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              <AvatarImage src="/placeholder.svg" alt={user?.name} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-blue-700 text-white">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pt-16 md:pt-0">
              <CardTitle className="text-2xl text-gray-800">{user?.name}</CardTitle>
              <CardDescription className="text-sm flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                Driver
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8">
            <Separator className="my-6" />
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1.5 text-gray-700">
                      <User className="h-4 w-4 text-primary" />
                      Full Name
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      className="shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5 text-gray-700">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Address
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      className="shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5 text-gray-700">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      required 
                      className="shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="shadow-sm">Save Changes</Button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      Full Name
                    </h3>
                    <p className="text-base font-medium">{user?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Address
                    </h3>
                    <p className="text-base font-medium">{user?.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </h3>
                    <p className="text-base font-medium">{user?.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Status
                    </h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-2.5 py-0.5">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button onClick={() => setIsEditing(true)} className="shadow-sm">
                    Edit Profile
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="mt-6 shadow-md overflow-hidden border-0">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and account security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto shadow-sm group hover:bg-primary/5"
            >
              <Shield className="h-4 w-4 mr-2 group-hover:text-primary" />
              Change Password
            </Button>
          </CardContent>
        </Card>
        
        <Card className="mt-6 shadow-md overflow-hidden border-0">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Documents & Certifications</CardTitle>
                <CardDescription>Keep your driving documents up to date</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-1.5 mb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      Driving License
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Issued: May 15, 2020</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires: May 15, 2025</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Active
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="text-sm">Update</Button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-1.5 mb-1">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Vehicle Permit
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Issued: Dec 10, 2021</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires: Dec 10, 2023</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                    Renewal Needed
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="text-sm">Update</Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Keep your documents up to date to ensure compliance with transportation regulations. Expired documents may restrict your ability to operate buses.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Missing Icon import
import { Info } from "lucide-react";

export default DriverProfile;
