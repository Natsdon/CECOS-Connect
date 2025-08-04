import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Shield, User, Trash2, Settings, Search } from 'lucide-react';

interface UserPrivilege {
  id: number;
  userId: number;
  permission: string;
  resource: string;
  grantedBy: number;
  grantedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export default function UserPrivileges() {
  const [selectedUser, setSelectedUser] = useState('');
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [privilegeForm, setPrivilegeForm] = useState({
    permission: '',
    resource: '',
    targetUserId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: privileges, isLoading: privilegesLoading } = useQuery<UserPrivilege[]>({
    queryKey: ['/api/privileges'],
  });

  const grantPrivilegeMutation = useMutation({
    mutationFn: async (privilegeData: any) => {
      const response = await apiRequest(`/api/users/${privilegeData.targetUserId}/privileges`, 'POST', privilegeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privileges'] });
      setIsGrantDialogOpen(false);
      setPrivilegeForm({ permission: '', resource: '', targetUserId: '' });
      toast({
        title: 'Privilege Granted',
        description: 'The privilege has been granted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant privilege.',
        variant: 'destructive',
      });
    },
  });

  const revokePrivilegeMutation = useMutation({
    mutationFn: async (privilegeId: number) => {
      const response = await apiRequest(`/api/privileges/${privilegeId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privileges'] });
      toast({
        title: 'Privilege Revoked',
        description: 'The privilege has been revoked successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke privilege.',
        variant: 'destructive',
      });
    },
  });

  const handleGrantPrivilege = () => {
    if (!privilegeForm.permission || !privilegeForm.resource || !privilegeForm.targetUserId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    grantPrivilegeMutation.mutate({
      userId: parseInt(privilegeForm.targetUserId),
      permission: privilegeForm.permission,
      resource: privilegeForm.resource,
      grantedBy: 1, // This should come from auth context
      targetUserId: privilegeForm.targetUserId
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'epr_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'faculty':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'write':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availablePermissions = [
    'read',
    'write',
    'delete',
    'admin',
    'grade',
    'attendance',
    'enrollment'
  ];

  const availableResources = [
    'students',
    'faculty',
    'courses',
    'exams',
    'grades',
    'attendance',
    'admissions',
    'reports',
    'system'
  ];

  const filteredUsers = users?.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrivileges = selectedUser 
    ? privileges?.filter(p => p.userId === parseInt(selectedUser))
    : privileges;

  if (usersLoading || privilegesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Privileges Management</h2>
          <p className="text-gray-600">Manage user permissions and access control across the system</p>
        </div>
        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-burgundy-500 hover:bg-burgundy-600">
              <Plus className="w-4 h-4 mr-2" />
              Grant Privilege
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Grant User Privilege</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <Label htmlFor="target-user">Select User</Label>
                <Select value={privilegeForm.targetUserId} onValueChange={(value) => setPrivilegeForm({ ...privilegeForm, targetUserId: value })}>
                  <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="permission">Permission</Label>
                <Select value={privilegeForm.permission} onValueChange={(value) => setPrivilegeForm({ ...privilegeForm, permission: value })}>
                  <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePermissions.map((permission) => (
                      <SelectItem key={permission} value={permission}>
                        {permission}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resource">Resource</Label>
                <Select value={privilegeForm.resource} onValueChange={(value) => setPrivilegeForm({ ...privilegeForm, resource: value })}>
                  <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResources.map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGrantDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGrantPrivilege}
                  disabled={grantPrivilegeMutation.isPending}
                  className="bg-burgundy-500 hover:bg-burgundy-600"
                >
                  {grantPrivilegeMutation.isPending ? 'Granting...' : 'Grant Privilege'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>
            <div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>System Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getRoleColor(user.role)} variant="secondary">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {privileges?.filter(p => p.userId === user.id).length || 0} privileges
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privileges List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Active Privileges</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPrivileges?.map((privilege) => (
                <div key={privilege.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getPermissionColor(privilege.permission)} variant="secondary">
                        {privilege.permission}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{privilege.resource}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {privilege.user?.firstName} {privilege.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Granted {new Date(privilege.grantedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokePrivilegeMutation.mutate(privilege.id)}
                    disabled={revokePrivilegeMutation.isPending}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Privileges Table */}
      <Card>
        <CardHeader>
          <CardTitle>All User Privileges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead>Granted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrivileges?.map((privilege) => (
                <TableRow key={privilege.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {privilege.user?.firstName} {privilege.user?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{privilege.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(privilege.user?.role || '')} variant="secondary">
                      {privilege.user?.role?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPermissionColor(privilege.permission)} variant="secondary">
                      {privilege.permission}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{privilege.resource}</TableCell>
                  <TableCell>EPR Admin</TableCell>
                  <TableCell>{new Date(privilege.grantedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokePrivilegeMutation.mutate(privilege.id)}
                      disabled={revokePrivilegeMutation.isPending}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
