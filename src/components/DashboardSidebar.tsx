import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, Home, Bus, Vote, AlertTriangle, 
  User, Calendar, Bell, Users, ListChecks, BarChart3,
  LogOut, Settings, Cog, MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  userRole: 'student' | 'driver' | 'coordinator' | 'admin';
}

const DashboardSidebar = ({ userRole }: SidebarProps) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case 'student':
        return [
          { title: 'Dashboard', href: '/student', icon: Home },
          { title: 'Buses & Routes', href: '/student/buses', icon: Bus },
          { title: 'Bus Voting', href: '/student/voting', icon: Vote },
          { title: 'Complaints', href: '/student/complaints', icon: AlertTriangle },
          { title: 'Announcements', href: '/student/announcements', icon: Bell },
          { title: 'Profile', href: '/student/profile', icon: User }
        ];
      case 'driver':
        return [
          { title: 'Dashboard', href: '/driver', icon: Home },
          { title: 'My Schedule', href: '/driver/schedule', icon: Calendar },
          { title: 'Alerts', href: '/driver/alerts', icon: Bell },
          { title: 'Profile', href: '/driver/profile', icon: User }
        ];
      case 'coordinator':
        return [
          { title: 'Dashboard', href: '/coordinator', icon: Home },
          { title: 'Manage Buses', href: '/coordinator/buses', icon: Bus },
          { title: 'Routes', href: '/coordinator/routes', icon: MapPin },
          { title: 'Voting Requests', href: '/coordinator/voting', icon: Vote },
          { title: 'Complaints', href: '/coordinator/complaints', icon: AlertTriangle },
          { title: 'Drivers', href: '/coordinator/drivers', icon: Users },
          { title: 'Announcements', href: '/coordinator/announcements', icon: Bell }
        ];
      case 'admin':
        return [
          { title: 'Dashboard', href: '/admin', icon: Home },
          { title: 'Users', href: '/admin/users', icon: Users },
          { title: 'Buses', href: '/admin/buses', icon: Bus },
          { title: 'Coordinators', href: '/admin/coordinators', icon: ListChecks },
          { title: 'Reports', href: '/admin/reports', icon: BarChart3 }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (isMobile) {
    return (
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} transition-transform duration-300 ease-in-out`}>
        <div className="h-full w-64 bg-white border-r shadow-card flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg">Campus Bus</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCollapsed(true)}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-medium">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span>
                  <span className="capitalize">{userRole}</span>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href 
                    ? "bg-primary text-primary-foreground" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setIsCollapsed(true)}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  location.pathname === item.href 
                    ? "text-primary-foreground" 
                    : "text-gray-500"
                )} />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <Separator className="mb-4" />
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" 
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <Button 
          variant="default" 
          size="icon"
          className={`fixed top-4 ${isCollapsed ? 'left-4' : '-left-10'} z-50 shadow-md transition-all duration-300`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Cog className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen border-r bg-white transition-all duration-300 z-20",
      isCollapsed ? "w-[70px]" : "w-64"
    )}>
      <div className="h-full flex flex-col">
        <div className={cn(
          "p-4 flex items-center",
          isCollapsed ? "justify-center" : "space-x-2"
        )}>
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Bus className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && <span className="font-semibold text-lg">Campus Bus</span>}
        </div>
        
        <Separator />
        
        <div className={cn(
          "p-4",
          isCollapsed ? "flex justify-center" : ""
        )}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="font-medium truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span>
                  <span className="capitalize">{userRole}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-gray-700 hover:bg-gray-100",
                isCollapsed ? "justify-center" : "space-x-3"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                location.pathname === item.href 
                  ? "text-primary-foreground" 
                  : "text-gray-500"
              )} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
        
        <div className={cn(
          "p-4",
          isCollapsed ? "flex justify-center" : ""
        )}>
          <Separator className="mb-4" />
          <Button 
            variant="outline" 
            className={cn(
              "transition-all text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100",
              isCollapsed ? "w-10 h-10 p-0" : "w-full justify-start"
            )}
            onClick={logout}
          >
            <LogOut className={isCollapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="mb-4 mx-auto hover:bg-gray-100"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn(
            "h-5 w-5 transition-transform",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
