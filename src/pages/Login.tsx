
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, ChevronLeft, User, Users, ShieldCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const LoginSelection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading, session } = useAuth();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    // Only redirect if user is authenticated and we haven't redirected yet
    if (isAuthenticated && role && !isLoading && !redirected) {
      console.log('User authenticated with role:', role);
      setRedirected(true);
      
      const redirectPath = (() => {
        switch (role) {
          case 'student': return '/student';
          case 'driver': return '/driver';
          case 'coordinator': return '/coordinator';
          case 'admin': return '/admin';
          default: return '/';
        }
      })();
      
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, role, isLoading, navigate, redirected]);
  
  // Prevent any redirects if we're in the process of loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    );
  }
  
  // If we're authenticated and have already redirected, show a loading screen
  // to prevent flickering between login and dashboard
  if (isAuthenticated && role && redirected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    );
  }
  
  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access bus schedules and submit complaints.',
      icon: User,
      bgClass: 'bg-gradient-to-br from-blue-400 to-blue-600',
      path: '/login/student'
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'Manage your schedule and respond to alerts.',
      icon: Bus,
      bgClass: 'bg-gradient-to-br from-green-400 to-green-600',
      path: '/login/driver'
    },
    {
      id: 'coordinator',
      title: 'Bus Coordinator',
      description: 'Oversee bus operations and manage requests.',
      icon: Users,
      bgClass: 'bg-gradient-to-br from-purple-400 to-purple-600',
      path: '/login/coordinator'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <div className="absolute top-4 right-6 z-10">
        <Link to="/login/admin">
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 hover:bg-black/5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Login
          </Button>
        </Link>
      </div>
      
      <Link to="/" className="absolute top-4 left-6 z-10">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 hover:bg-black/5">
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
      
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bus className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Campus Bus Assistant</h1>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            Select your role to continue to the login screen.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.3 + index * 0.1
              }}
              whileHover={{ y: -5 }}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => navigate(role.path)}
              className="cursor-pointer"
            >
              <Card className={cn(
                "overflow-hidden border-0 shadow-card h-full transition-all duration-300",
                hoveredRole === role.id ? "shadow-elevated" : ""
              )}>
                <div className={cn(
                  "h-32 flex items-center justify-center transition-colors duration-500",
                  role.bgClass
                )}>
                  <role.icon className="h-16 w-16 text-white" />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{role.title}</h2>
                  <p className="text-gray-600 mb-4">{role.description}</p>
                  <Button className="w-full">
                    Continue as {role.title}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      <footer className="py-6 text-center text-sm text-gray-600 border-t">
        <p>© {new Date().getFullYear()} Campus Bus Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginSelection;
