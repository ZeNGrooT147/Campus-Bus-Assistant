import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserPlus, Filter, Eye, Edit, Trash2, UserCog, MoreHorizontal, Check, X, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AddUserDialog from "@/components/admin/AddUserDialog";
import ExportToExcel from "@/components/admin/ExportToExcel";

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "students";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  
  const [addUserRole, setAddUserRole] = useState<'student' | 'driver' | 'coordinator'>('student');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    setSearchParams({ tab: selectedTab });
  }, [selectedTab, setSearchParams]);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('name');
        
      if (studentsError) throw studentsError;
      
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('*, buses:buses(id, name, bus_number)')
        .eq('role', 'driver')
        .order('name');
        
      if (driversError) throw driversError;
      
      const { data: coordinatorsData, error: coordinatorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coordinator')
        .order('name');
        
      if (coordinatorsError) throw coordinatorsError;
      
      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('name');
        
      if (adminsError) throw adminsError;
      
      setStudents(studentsData.map(student => ({
        ...student,
        status: 'active',
        joinDate: new Date(student.created_at).toLocaleDateString()
      })));
      
      setDrivers(driversData.map(driver => {
        const busInfo = driver.buses as unknown as { 
          id: string; 
          name: string; 
          bus_number: string;
        } | null;
        
        return {
          ...driver,
          status: 'active',
          busAssigned: busInfo ? busInfo.name : "Not assigned",
          joinDate: new Date(driver.created_at).toLocaleDateString()
        };
      }));
      
      setCoordinators(coordinatorsData.map(coordinator => ({
        ...coordinator,
        status: 'active',
        joinDate: new Date(coordinator.created_at).toLocaleDateString()
      })));
      
      setAdmins(adminsData.map(admin => ({
        ...admin,
        status: 'active',
        role: admin.id === currentUser?.id ? 'Super Admin' : 'Admin',
        joinDate: new Date(admin.created_at).toLocaleDateString()
      })));
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setUserDetailsDialogOpen(true);
  };
  
  const handleToggleUserStatus = async (user: any) => {
    toast.success(`User status updated`);
    setUserDetailsDialogOpen(false);
    fetchUsers();
  };
  
  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      toast.success(`User deleted successfully`);
      
      setUserDetailsDialogOpen(false);
      
      fetchUsers();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'on-leave':
        return <Badge variant="secondary">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDrivers = drivers.filter(driver => 
    driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.busAssigned && driver.busAssigned.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredCoordinators = coordinators.filter(coordinator => 
    coordinator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredAdmins = admins.filter(admin => 
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="User Management">
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage all users of the Campus Bus Assistant platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <ExportToExcel 
                  data={
                    selectedTab === 'students' ? filteredStudents : 
                    selectedTab === 'drivers' ? filteredDrivers :
                    selectedTab === 'coordinators' ? filteredCoordinators :
                    filteredAdmins
                  }
                  filename={`campus-bus-${selectedTab}`}
                  sheetName={selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
                />
                
                <Button onClick={() => {
                  setAddUserRole(selectedTab === 'students' ? 'student' : selectedTab === 'drivers' ? 'driver' : 'coordinator');
                  setAddUserDialogOpen(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selectedTab === 'admins' ? 'User' : selectedTab.slice(0, -1).charAt(0).toUpperCase() + selectedTab.slice(0, -1).slice(1)}
                </Button>
              </div>
              
              <AddUserDialog 
                open={addUserDialogOpen} 
                onOpenChange={setAddUserDialogOpen} 
                defaultRole={addUserRole}
                onSuccess={fetchUsers} 
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Card className="border shadow-sm cursor-pointer" onClick={() => setSelectedTab("students")}>
                <CardHeader className={`p-4 pb-2 ${selectedTab === "students" ? "border-b-2 border-primary" : ""}`}>
                  <CardTitle className="text-base">Students</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{students.length}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-sm cursor-pointer" onClick={() => setSelectedTab("drivers")}>
                <CardHeader className={`p-4 pb-2 ${selectedTab === "drivers" ? "border-b-2 border-primary" : ""}`}>
                  <CardTitle className="text-base">Drivers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{drivers.length}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-sm cursor-pointer" onClick={() => setSelectedTab("coordinators")}>
                <CardHeader className={`p-4 pb-2 ${selectedTab === "coordinators" ? "border-b-2 border-primary" : ""}`}>
                  <CardTitle className="text-base">Coordinators</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{coordinators.length}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-sm cursor-pointer" onClick={() => setSelectedTab("admins")}>
                <CardHeader className={`p-4 pb-2 ${selectedTab === "admins" ? "border-b-2 border-primary" : ""}`}>
                  <CardTitle className="text-base">Admins</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{admins.length}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md mb-6">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Manage student accounts and access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.usn}</TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>{student.phone || 'N/A'}</TableCell>
                              <TableCell>{student.region}</TableCell>
                              <TableCell>{getStatusBadge(student.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewUser(student)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(student)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                              No students found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Drivers</CardTitle>
                <CardDescription>
                  Manage driver accounts and assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Bus Assigned</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDrivers.length > 0 ? (
                          filteredDrivers.map((driver) => (
                            <TableRow key={driver.id}>
                              <TableCell className="font-medium">{driver.name}</TableCell>
                              <TableCell>{driver.email}</TableCell>
                              <TableCell>{driver.phone || 'N/A'}</TableCell>
                              <TableCell>{driver.busAssigned || "Not assigned"}</TableCell>
                              <TableCell>{getStatusBadge(driver.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewUser(driver)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <UserCog className="h-4 w-4 mr-2" />
                                      Assign Bus
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(driver)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No drivers found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coordinators">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Coordinators</CardTitle>
                <CardDescription>
                  Manage coordinator accounts and regional assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCoordinators.length > 0 ? (
                          filteredCoordinators.map((coordinator) => (
                            <TableRow key={coordinator.id}>
                              <TableCell className="font-medium">{coordinator.name}</TableCell>
                              <TableCell>{coordinator.email}</TableCell>
                              <TableCell>{coordinator.phone || 'N/A'}</TableCell>
                              <TableCell>{coordinator.region}</TableCell>
                              <TableCell>{getStatusBadge(coordinator.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewUser(coordinator)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(coordinator)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No coordinators found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Administrators</CardTitle>
                <CardDescription>
                  Manage administrator accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmins.length > 0 ? (
                          filteredAdmins.map((admin) => (
                            <TableRow key={admin.id}>
                              <TableCell className="font-medium">{admin.name}</TableCell>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>{admin.phone || 'N/A'}</TableCell>
                              <TableCell>{admin.role}</TableCell>
                              <TableCell>{getStatusBadge(admin.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={admin.id === currentUser?.id}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewUser(admin)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    {admin.id !== currentUser?.id && (
                                      <>
                                        <DropdownMenuItem>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(admin)}>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No admins found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedUser && (
          <Dialog open={userDetailsDialogOpen} onOpenChange={setUserDetailsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Detailed information for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="h-20 w-20 mb-4">
                    {selectedUser.profile_photo_url ? (
                      <AvatarImage src={selectedUser.profile_photo_url} alt={selectedUser.name} />
                    ) : (
                      <AvatarFallback className="text-xl bg-primary/10">{selectedUser.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                
                <div className="grid gap-4">
                  {selectedUser.usn && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <p className="text-sm font-medium text-muted-foreground text-right">USN</p>
                      <p className="col-span-2">{selectedUser.usn}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm font-medium text-muted-foreground text-right">Email</p>
                    <p className="col-span-2">{selectedUser.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm font-medium text-muted-foreground text-right">Phone</p>
                    <p className="col-span-2">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  
                  {selectedUser.region && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <p className="text-sm font-medium text-muted-foreground text-right">Region</p>
                      <p className="col-span-2">{selectedUser.region}</p>
                    </div>
                  )}
                  
                  {selectedUser.busAssigned && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <p className="text-sm font-medium text-muted-foreground text-right">Bus Assigned</p>
                      <p className="col-span-2">{selectedUser.busAssigned}</p>
                    </div>
                  )}
                  
                  {selectedUser.role && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <p className="text-sm font-medium text-muted-foreground text-right">Role</p>
                      <p className="col-span-2">{selectedUser.role}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm font-medium text-muted-foreground text-right">Joined On</p>
                    <p className="col-span-2">{selectedUser.joinDate}</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <div>
                  {selectedUser.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive border-destructive"
                      onClick={() => handleToggleUserStatus(selectedUser)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 border-green-600"
                      onClick={() => handleToggleUserStatus(selectedUser)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteUser(selectedUser)}
                    disabled={selectedUser.id === currentUser?.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
