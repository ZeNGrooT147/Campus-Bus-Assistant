import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Context providers
import { AuthProvider } from '@/context/AuthContext';

// Services
import { setupRealtimeSubscriptions, enableRealtimeIndicators } from '@/services/realTimeService';

// Public pages
import HomePage from '@/pages/Index';
import LoginPage from '@/pages/Login';
import StudentLoginPage from '@/pages/StudentLogin';
import DriverLoginPage from '@/pages/DriverLogin';
import CoordinatorLoginPage from '@/pages/CoordinatorLogin';
import AdminLoginPage from '@/pages/AdminLogin';
import StudentRegisterPage from '@/pages/StudentRegister';

// Student pages
import StudentDashboard from '@/pages/student/Dashboard';
import StudentBuses from '@/pages/student/Buses';
import StudentComplaints from '@/pages/student/Complaints';
import StudentProfile from '@/pages/student/Profile';
import StudentVoting from '@/pages/student/Voting';
import StudentAnnouncements from '@/pages/student/Announcements';

// Driver pages
import DriverDashboard from '@/pages/driver/Dashboard';
import DriverSchedule from '@/pages/driver/Schedule';
import DriverProfile from '@/pages/driver/Profile';
import DriverAlerts from '@/pages/driver/Alerts';

// Coordinator pages
import CoordinatorDashboard from '@/pages/coordinator/Dashboard';
import CoordinatorManageBuses from '@/pages/coordinator/ManageBuses';
import CoordinatorComplaints from '@/pages/coordinator/Complaints';
import CoordinatorVoting from '@/pages/coordinator/Voting';
import CoordinatorDrivers from '@/pages/coordinator/Drivers';
import CoordinatorRoutes from '@/pages/coordinator/Routes';
import CoordinatorAnnouncements from '@/pages/coordinator/Announcements';
import EditDriver from '@/pages/coordinator/EditDriver';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminReports from '@/pages/admin/Reports';
import AdminBuses from '@/pages/admin/Buses';
import AdminCoordinators from '@/pages/admin/Coordinators';

// Protected route component
import ProtectedRoute from '@/components/ProtectedRoute';

// Initialize the query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize realtime services
    const cleanupRealtime = setupRealtimeSubscriptions();
    const cleanupIndicators = enableRealtimeIndicators();
    
    // Event listener for realtime updates
    const handleRealtimeUpdate = (event) => {
      const { type } = event.detail || {};
      
      // Invalidate cached data for real-time updates
      if (type === 'bus') {
        queryClient.invalidateQueries({ queryKey: ['buses'] });
      } else if (type === 'complaint') {
        queryClient.invalidateQueries({ queryKey: ['complaints'] });
      } else if (type === 'voting') {
        queryClient.invalidateQueries({ queryKey: ['votingTopics'] });
      } else if (type === 'notification') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else if (type === 'schedule') {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
      }
    };
    
    window.addEventListener('realtime-data-updated', handleRealtimeUpdate);
    
    return () => {
      cleanupRealtime();
      cleanupIndicators();
      window.removeEventListener('realtime-data-updated', handleRealtimeUpdate);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="campus-bus-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/student" element={<StudentLoginPage />} />
              <Route path="/login/driver" element={<DriverLoginPage />} />
              <Route path="/login/coordinator" element={<CoordinatorLoginPage />} />
              <Route path="/login/admin" element={<AdminLoginPage />} />
              
              {/* Registration routes */}
              <Route path="/register/student" element={<StudentRegisterPage />} />
              
              {/* Student routes */}
              <Route path="/student" element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/buses" element={
                <ProtectedRoute role="student">
                  <StudentBuses />
                </ProtectedRoute>
              } />
              <Route path="/student/complaints" element={
                <ProtectedRoute role="student">
                  <StudentComplaints />
                </ProtectedRoute>
              } />
              <Route path="/student/voting" element={
                <ProtectedRoute role="student">
                  <StudentVoting />
                </ProtectedRoute>
              } />
              <Route path="/student/announcements" element={
                <ProtectedRoute role="student">
                  <StudentAnnouncements />
                </ProtectedRoute>
              } />
              <Route path="/student/profile" element={
                <ProtectedRoute role="student">
                  <StudentProfile />
                </ProtectedRoute>
              } />
              
              {/* Driver routes */}
              <Route path="/driver" element={
                <ProtectedRoute role="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              <Route path="/driver/schedule" element={
                <ProtectedRoute role="driver">
                  <DriverSchedule />
                </ProtectedRoute>
              } />
              <Route path="/driver/profile" element={
                <ProtectedRoute role="driver">
                  <DriverProfile />
                </ProtectedRoute>
              } />
              <Route path="/driver/alerts" element={
                <ProtectedRoute role="driver">
                  <DriverAlerts />
                </ProtectedRoute>
              } />
              
              {/* Coordinator routes */}
              <Route path="/coordinator" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/buses" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorManageBuses />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/routes" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorRoutes />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/complaints" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorComplaints />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/voting" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorVoting />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/drivers" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorDrivers />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/drivers/:driverId/edit" element={
                <ProtectedRoute role="coordinator">
                  <EditDriver />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/announcements" element={
                <ProtectedRoute role="coordinator">
                  <CoordinatorAnnouncements />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute role="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute role="admin">
                  <AdminReports />
                </ProtectedRoute>
              } />
              <Route path="/admin/buses" element={
                <ProtectedRoute role="admin">
                  <AdminBuses />
                </ProtectedRoute>
              } />
              <Route path="/admin/coordinators" element={
                <ProtectedRoute role="admin">
                  <AdminCoordinators />
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
