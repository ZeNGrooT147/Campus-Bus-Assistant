import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DriverRegistration from '@/components/coordinator/DriverRegistration';
import { useCoordinatorBuses } from '@/hooks/useCoordinatorBuses';
import DriverList from '@/components/coordinator/DriverList';

const CoordinatorDrivers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const { drivers, isLoading, refreshData } = useCoordinatorBuses();

  useEffect(() => {
    // Filter drivers when searchQuery or drivers list changes
    if (drivers && drivers.length > 0) {
      const filtered = drivers.filter(driver => 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (driver.contact && driver.contact.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers([]);
    }
  }, [searchQuery, drivers]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The filtering is done in the useEffect above
    toast.info(`Searching for driver: ${searchQuery}`);
  };

  const refreshDrivers = () => {
    toast.loading("Refreshing driver data...");
    refreshData().then(() => {
      toast.success("Driver data refreshed successfully");
    }).catch(error => {
      console.error("Error refreshing drivers:", error);
      toast.error("Failed to refresh driver data");
    });
  };

  const handleDriverAdded = () => {
    refreshData(); // Refresh the list after adding a new driver
    toast.success("Driver list updated");
  };

  return (
    <DashboardLayout pageTitle="Driver Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Driver Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshDrivers} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <DriverRegistration onSuccess={handleDriverAdded} />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Bus Drivers</CardTitle>
            <CardDescription>Manage and monitor all drivers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex w-full max-w-sm mb-4 items-center space-x-2">
              <Input
                type="search"
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <DriverList />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorDrivers;
