import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowRight, Bus, ChevronLeft, Eye, EyeOff, Key, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const CoordinatorLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, forgotPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (isAuthenticated && role === 'coordinator') {
      navigate('/coordinator');
    }
  }, [isAuthenticated, role, navigate]);

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
        role: 'coordinator'
      });
      
      // Success will be handled by the auth listener
    } catch (error: any) {
      console.error('Login failed:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
      
      if (newAttempts >= 3) {
        toast.error("Multiple failed attempts. You can use the forgot password option.");
        setShowForgotPassword(true);
      }
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
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('Failed to send reset instructions. Please try again.');
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
                <div className="p-2 bg-purple-50 rounded-full">
                  <Bus className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Coordinator Login</CardTitle>
              </div>
              <CardDescription>
                Enter your credentials to access the coordinator dashboard
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter your email"
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
                              className="px-0 text-xs text-purple-600" 
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
                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                      'Sign In'
                    }
                  </Button>
                  <div className="text-center text-sm">
                    Not a coordinator?{' '}
                    <Link to="/login" className="text-purple-600 font-medium hover:underline">
                      Back to login selection
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
          
          {showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reset Password</CardTitle>
                  <CardDescription>
                    Enter your email to receive password reset instructions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
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
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Send Instructions
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Badge variant="outline" className="bg-gray-50">
              Campus Transit Management System
            </Badge>
          </div>
        </motion.div>
      </div>
      
      <footer className="py-6 text-center text-sm text-gray-600 border-t">
        <p>© {new Date().getFullYear()} Campus Bus Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CoordinatorLogin;
