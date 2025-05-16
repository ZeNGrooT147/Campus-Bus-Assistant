
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Key, ArrowRight, AlertTriangle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Define form schema
const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Phone number or email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DriverLogin = () => {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await login({
        identifier: values.identifier,
        password: values.password,
        role: 'driver'
      });
      navigate('/driver');
    } catch (error) {
      console.error('Login failed:', error);
      // No toast() call here as the error is already handled in useAuthActions
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your registered email');
      return;
    }

    try {
      await forgotPassword(resetEmail);
      toast.success('Password reset instructions sent to your email');
      setShowResetForm(false);
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('Failed to send reset instructions. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/login" className="absolute top-4 left-6 z-10">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 hover:bg-black/5">
          <ChevronLeft className="h-4 w-4" />
          Back to Selection
        </Button>
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Bus className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Driver Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access the driver dashboard
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Sign in
            </CardTitle>
            <CardDescription>Enter your phone number/email and password</CardDescription>
          </CardHeader>
          <CardContent>
            {!showResetForm ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number / Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number or email" {...field} />
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
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="pr-10"
                              {...field} 
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-primary"
                      onClick={() => setShowResetForm(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign in <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    placeholder="Enter your registered email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                  />
                </div>
                <div className="bg-amber-50 p-3 rounded-md flex items-start text-sm gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-amber-800">
                    We'll send password reset instructions to this email address.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowResetForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    Send Instructions
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-center w-full">
              <div className="text-sm text-muted-foreground">
                Not a driver?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Back to login selection
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <Badge variant="outline" className="bg-gray-50">
            Campus Transit Management System
          </Badge>
        </div>
      </motion.div>
    </div>
  );
};

export default DriverLogin;
