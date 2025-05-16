
import { useCallback, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AddBusForm from '@/components/coordinator/AddBusForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminBuses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddBusDialog, setShowAddBusDialog] = useState(false);

  // Memoize the search handler to prevent unnecessary re-renders
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    toast.info(`Searching for bus: ${searchQuery}`);
    // Implement search functionality
  }, [searchQuery]);

  // Memoize the refresh handler
  const refreshData = useCallback(() => {
    setIsLoading(true);
    toast.loading("Refreshing bus data...");
    
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Bus data refreshed successfully");
    }, 1000);
  }, []);

  // Demo bus data - memoized to prevent re-renders
  const busesData = useMemo(() => [
    { id: 1, number: 'KA-25-F-1234', name: 'Varada Express', route: 'Dharwad Region', status: 'active' },
    { id: 2, number: 'KA-25-G-5678', name: 'Campus Shuttle', route: 'Hubli Region', status: 'active' },
    { id: 3, number: 'KA-25-H-9012', name: 'University Link', route: 'Dharwad Region', status: 'maintenance' },
  ], []);

  return (
    <DashboardLayout pageTitle="Bus Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bus Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => setShowAddBusDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bus
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Bus Fleet Overview</CardTitle>
            <CardDescription>Manage and monitor all buses in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex w-full max-w-sm mb-4 items-center space-x-2">
              <Input
                type="search"
                placeholder="Search by bus number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            <div className="rounded-md border">
              {busesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">Bus Number</th>
                        <th className="h-10 px-4 text-left font-medium">Name</th>
                        <th className="h-10 px-4 text-left font-medium">Route</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {busesData.map((bus) => (
                        <tr key={bus.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">{bus.number}</td>
                          <td className="p-4">{bus.name}</td>
                          <td className="p-4">{bus.route}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bus.status === 'active' ? 'bg-green-100 text-green-800' : 
                              bus.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {bus.status === 'active' ? 'Active' : 
                               bus.status === 'maintenance' ? 'Maintenance' : 
                               'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Bus management console will be displayed here.</p>
                  <p className="text-sm mt-1">You can add, edit, or remove buses from the fleet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={showAddBusDialog} onOpenChange={setShowAddBusDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Bus</DialogTitle>
            </DialogHeader>
            <AddBusForm onSuccess={() => setShowAddBusDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminBuses;
