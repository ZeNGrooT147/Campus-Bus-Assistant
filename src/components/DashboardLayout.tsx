import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import { Bell, ChevronDown, User, Settings, LogOut, Menu, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import NotificationDropdown from "./NotificationDropdown";
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const TELEGRAM_BOT_TOKEN = "7742027749:AAENTZ012O5SiGto0M0QMJhm-xSbtiFZETY";
const TELEGRAM_CHAT_ID = "7545143019";

const DashboardLayout = ({ children, pageTitle }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [sosReason, setSosReason] = useState("");
  const [sosLoading, setSosLoading] = useState(false);
  const reasonInputRef = useRef<HTMLInputElement>(null);
  const [dashboardAnnouncements, setDashboardAnnouncements] = useState([]);
  const [loadingDashboardAnnouncements, setLoadingDashboardAnnouncements] = useState(true);
  const { addToast } = useToast();
  
  useEffect(() => {
    // Update document title
    document.title = `${pageTitle} | Campus Bus Assistant`;
    
    // Scroll to top on page change
    window.scrollTo(0, 0);
  }, [pageTitle]);
  
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  useEffect(() => {
    // Fetch latest announcements for dashboard
    const fetchDashboardAnnouncements = async () => {
      setLoadingDashboardAnnouncements(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) {
        setDashboardAnnouncements(data);
      }
      setLoadingDashboardAnnouncements(false);
    };
    fetchDashboardAnnouncements();
  }, [pageTitle]);
  
  if (!user) {
    return null; // or redirect
  }

  const handleLogout = () => {
    logout();
    addToast({
      title: "Success",
      description: "You have been logged out successfully"
    });
  };
  
  // Get first letter of name or email for the avatar
  const getInitial = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };
  
  // Get user region with a default value
  const userRegion = user.region || 'Campus';
  
  const handleSOS = async () => {
    if (!sosReason.trim()) {
      addToast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for the SOS emergency."
      });
      reasonInputRef.current?.focus();
      return;
    }
    setSosLoading(true);
    try {
      // Get user location with better error handling
      const getLocation = () => new Promise<{ lat: number, lng: number, error?: string }>((resolve, reject) => {
        if (!navigator.geolocation) {
          resolve({ lat: 0, lng: 0, error: "Geolocation is not supported by your browser" });
          return;
        }

        const timeoutId = setTimeout(() => {
          resolve({ lat: 0, lng: 0, error: "Location request timed out. Please try again." });
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve({ 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            let errorMessage = "Failed to get location";
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location access was denied. Please enable location services.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out.";
                break;
            }
            resolve({ lat: 0, lng: 0, error: errorMessage });
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { lat, lng, error } = await getLocation();
      
      if (error) {
        addToast({
          variant: "warning",
          title: "Location Warning",
          description: error
        });
      }

      const locationText = lat && lng ? 
        `https://maps.google.com/?q=${lat},${lng}` : 
        'Not available';

      // Get current time in 12-hour format
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      // Compose the detailed emergency message
      const message = `🚨 *EMERGENCY ALERT*\n\n` +
        `*Type:* Emergency\n` +
        `*User Details:*\n` +
        `- Name: ${user.name || 'Unknown'}\n` +
        `- Role: ${user.role || 'Unknown'}\n` +
        `- Region: ${user.region || 'Campus'}\n` +
        `- Contact: ${user.phone || 'Not Available'}\n` +
        `- Email: ${user.email || 'Not Available'}\n\n` +
        `*Location:* ${locationText}\n\n` +
        `*Instructions:*\n` +
        `1. Proceed to location immediately\n` +
        `2. Follow Google Maps link\n` +
        `3. Contact emergency number\n` +
        `4. Wait for coordinator\n\n` +
        `*Info:*\n` +
        `Time: ${timeString}\n` +
        `Priority: High\n` +
        `Emergency Reason: ${sosReason}\n\n` +
        `⚠️ *This is an automated emergency alert. Please respond immediately.*`;
      
      // Log the request details (without the token)
      console.log('Sending SOS to Telegram:', {
        chatId: TELEGRAM_CHAT_ID,
        message: message
      });

      // Send to Telegram
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Telegram API Error:', data);
        throw new Error(data.description || "Failed to send SOS to Telegram");
      }
      console.log('Telegram API Response:', data);
      addToast({
        title: "Success",
        description: "SOS Emergency sent to campus authorities!"
      });
      setSosDialogOpen(false);
      setSosReason("");
    } catch (err: any) {
      console.error('SOS Error:', err);
      addToast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send SOS. Please try again."
      });
    } finally {
      setSosLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {sidebarOpen && <DashboardSidebar userRole={user.role as 'student' | 'driver' | 'coordinator' | 'admin'} />}
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navigation bar */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Button in top bar */}
            <NotificationDropdown />
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 pl-3 pr-2 hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {getInitial()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="font-medium text-sm leading-tight">{user.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{userRegion}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2 shadow-lg rounded-xl">
                <div className="flex items-center gap-3 p-2 mb-1 bg-primary/5 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-medium text-lg">
                    {getInitial()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span>
                      {user.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)} • {userRegion}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link to={`/${user.role}/profile`}>
                  <DropdownMenuItem className="cursor-pointer rounded-md p-2 focus:bg-muted hover:bg-muted">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link to={`/${user.role}/settings`}>
                  <DropdownMenuItem className="cursor-pointer rounded-md p-2 focus:bg-muted hover:bg-muted">
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-red-500 focus:text-red-500 rounded-md p-2 focus:bg-red-50 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Floating SOS Button */}
        <button
          className="fixed z-50 bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16 text-3xl font-bold focus:outline-none focus:ring-4 focus:ring-red-300 animate-bounce"
          title="SOS Emergency"
          onClick={() => setSosDialogOpen(true)}
        >
          <AlertTriangle className="w-8 h-8" />
          <span className="sr-only">SOS Emergency</span>
        </button>
        {/* SOS Confirmation Dialog */}
        <Dialog open={sosDialogOpen} onOpenChange={setSosDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Trigger SOS Emergency?</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-center text-lg text-red-600 font-semibold flex flex-col items-center">
              <AlertTriangle className="w-10 h-10 mb-2 animate-pulse" />
              This will alert campus authorities immediately.
            </div>
            <div className="mb-2">
              <label htmlFor="sos-reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for SOS <span className="text-red-500">*</span></label>
              <input
                id="sos-reason"
                ref={reasonInputRef}
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Describe the emergency..."
                value={sosReason}
                onChange={e => setSosReason(e.target.value)}
                required
                disabled={sosLoading}
              />
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSosDialogOpen(false)} disabled={sosLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleSOS} disabled={sosLoading}>
                {sosLoading ? "Sending..." : "Yes, Send SOS"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Footer */}
        <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground bg-white">
          <div className="flex justify-center items-center gap-1">
            <p>© {new Date().getFullYear()} Campus Bus Assistant. All rights reserved.</p>
            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
            <a href="#" className="hover:text-primary">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
