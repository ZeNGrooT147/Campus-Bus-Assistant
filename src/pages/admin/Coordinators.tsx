
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const AdminCoordinators = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    toast.info(`Searching for coordinator: ${searchQuery}`);
    // Implement search functionality
  };

  const refreshData = () => {
    setIsLoading(true);
    toast.loading("Refreshing coordinator data...");
    
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Coordinator data refreshed successfully");
    }, 1000);
  };

  return (
    <DashboardLayout pageTitle="Coordinator Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coordinator Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => toast.info("Add coordinator feature coming soon")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coordinator
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Bus Coordinators</CardTitle>
            <CardDescription>Manage all coordinators in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex w-full max-w-sm mb-4 items-center space-x-2">
              <Input
                type="search"
                placeholder="Search coordinators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            <div className="rounded-md border">
              <div className="p-4 text-center text-muted-foreground">
                <p>Coordinator management panel will be displayed here.</p>
                <p className="text-sm mt-1">You can add, edit, or manage coordinator accounts.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCoordinators;
