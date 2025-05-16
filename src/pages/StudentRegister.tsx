
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  ChevronLeft, Eye, EyeOff, Bus, Mail, User, School, Phone, MapPin, Shield, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const StudentRegister = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    usn?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    region?: string;
    agreeToTerms?: string;
  }>({});
  
  const validateForm = () => {
    const errors: {
      name?: string;
      usn?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      region?: string;
      agreeToTerms?: string;
    } = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!usn.trim()) {
      errors.usn = 'USN is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(usn)) {
      errors.usn = 'USN should contain only letters and numbers';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (phone.trim() && !/^\d{10}$/.test(phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!region) {
      errors.region = 'Please select your region';
    }
    
    if (!agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }
    
    try {
      setLocalLoading(true);
      console.log('Submitting student registration form with data:', {
        name, email, usn, phone, region, role: 'student'
      });
      
      // Show immediate feedback that submission is processing
      const toastId = toast.loading("Creating your account...");
      
      await register({
        name,
        email,
        password,
        usn,
        phone,
        region,
        role: 'student',
        agreeToTerms
      });
      
      // Dismiss the loading toast and show success toast
      toast.dismiss(toastId);
      toast.success("Registration successful! You can now login.");
      
      // Set success state and clear form
      setRegistrationSuccess(true);
      setName('');
      setUsn('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setRegion('');
      setAgreeToTerms(false);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login/student');
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };
  
  const isButtonLoading = isLoading || localLoading;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Link to="/login/student" className="absolute top-4 left-6 z-10">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 hover:bg-black/5">
          <ChevronLeft className="h-4 w-4" />
          Back to Login
        </Button>
      </Link>
      
      <div className="flex-grow flex items-center justify-center p-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          {registrationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Alert className="bg-green-50 border-green-200 mb-6">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <AlertTitle className="text-green-800 font-semibold">Registration Successful!</AlertTitle>
                <AlertDescription>
                  Your account has been created. Redirecting you to the login page...
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/login/student')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Button>
            </motion.div>
          ) : (
            <Card className="border-0 shadow-card overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600"></div>
              <CardHeader className="space-y-1 text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Bus className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-500">
                  Create your account to access Campus Bus services
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1 text-sm font-medium">
                      Full Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className="pl-9 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="usn" className="flex items-center gap-1 text-sm font-medium">
                      USN (University Seat Number)
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="usn"
                        placeholder="Enter your USN"
                        className="pl-9 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                      />
                    </div>
                    {formErrors.usn && (
                      <p className="text-sm text-red-500">{formErrors.usn}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1 text-sm font-medium">
                      Email
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-9 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1 text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="Enter your phone number"
                        className="pl-9 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-sm text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1 text-sm font-medium">
                      Region
                      <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup 
                      value={region} 
                      onValueChange={setRegion}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hubli" id="hubli" />
                        <Label htmlFor="hubli" className="cursor-pointer">Hubli</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dharwad" id="dharwad" />
                        <Label htmlFor="dharwad" className="cursor-pointer">Dharwad Region</Label>
                      </div>
                    </RadioGroup>
                    {formErrors.region && (
                      <p className="text-sm text-red-500">{formErrors.region}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-1 text-sm font-medium">
                      Password
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-9 pr-10 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formErrors.password && (
                      <p className="text-sm text-red-500">{formErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-1 text-sm font-medium">
                      Confirm Password
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-9 pr-10 transition-all border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the <a href="#" className="text-blue-600 hover:underline">terms of service</a> and <a href="#" className="text-blue-600 hover:underline">privacy policy</a>.
                      </label>
                    </div>
                    {formErrors.agreeToTerms && (
                      <p className="text-sm text-red-500">{formErrors.agreeToTerms}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={isButtonLoading}
                  >
                    {isButtonLoading ? 
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registering...</span>
                      </div> : 
                      'Create Account'
                    }
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login/student" className="text-blue-600 font-medium hover:underline">
                      Login here
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>
          )}
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>By registering, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </motion.div>
      </div>
      
      <footer className="py-6 text-center text-sm text-gray-600 border-t">
        <p>© {new Date().getFullYear()} Campus Bus Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StudentRegister;
