
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bus, ChevronLeft, Eye, EyeOff, KeyRound, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  usn: z.string().min(1, { message: 'USN is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const StudentLogin = () => {
  const navigate = useNavigate();
  const { login, forgotPassword, isAuthenticated, role } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role === 'student') {
      navigate('/student');
    }
  }, [isAuthenticated, role, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usn: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await login({
        identifier: values.usn,
        password: values.password,
        role: 'student'
      });
      
      // Success toast is shown by the login function in useAuthActions
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Wrong USN or password. Please try again.");
      } else if (error.message?.includes('User not found')) {
        toast.error("USN not found. Please check or register.");
      } else {
        toast.error("Please try again later.");
      }
      
      if (newAttempts >= 3 && !showForgotPassword) {
        toast.error("Multiple failed login attempts. You can use the forgot password option below.");
        setShowForgotPassword(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error("Please enter your USN");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await forgotPassword(resetEmail);
      toast.success("Please check your registered phone number for the OTP.");
    } catch (error) {
      toast.error("Failed to send reset instructions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Link to="/login" className="absolute top-4 left-6 z-10">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 hover:bg-black/5">
          <ChevronLeft className="h-4 w-4" />
          Back to Selection
        </Button>
      </Link>
      
      <div className="flex-grow flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Bus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
              </div>
              <CardDescription>
                Enter your USN and password to access your dashboard
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="usn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>USN (University Seat Number)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter your USN"
                              className="pl-9 form-input-transition"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
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
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          {loginAttempts >= 3 && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="px-0 text-xs text-primary" 
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              disabled={isSubmitting}
                            >
                              Forgot password?
                            </Button>
                          )}
                        </div>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-9 pr-10 form-input-transition"
                              disabled={isSubmitting}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isSubmitting}
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
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Logging in...</span>
                      </div> : 
                      'Log In'
                    }
                  </Button>
                  <div className="text-center text-sm">
                    Don't have an account?{' '}
                    <Link to="/register/student" className="text-primary font-medium hover:underline">
                      Register here
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>
      </div>
      
      <footer className="py-6 text-center text-sm text-gray-600 border-t">
        <p>© {new Date().getFullYear()} Campus Bus Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StudentLogin;
