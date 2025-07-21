import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreHorizontal, Users, UserCheck, UserX, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Student } from '@shared/schema';

const addStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  cclId: z.string().min(1, 'CCL ID is required'),
});

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/students/detailed'],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  const form = useForm<z.infer<typeof addStudentSchema>>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      cclId: '',
    },
  });

  // Auto-generate password function
  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    
    // Ensure at least 1 capital, 2 numbers, 1 symbol
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining 4 characters with random selection
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    form.setValue('password', password);
  };

  // Auto-generate CCL ID function
  const generateCCLId = async () => {
    try {
      const response: any = await apiRequest('/api/students/next-ccl-id', 'GET');
      form.setValue('cclId', response.cclId);
    } catch (error) {
      console.error('Error generating CCL ID:', error);
      // Fallback to manual generation if API fails
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const fallbackId = `CCL-${yearSuffix}-0001`;
      form.setValue('cclId', fallbackId);
    }
  };

  const addStudentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addStudentSchema>) => {
      // Create username from first and last name
      const username = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`.replace(/\s+/g, '');
      
      // First create the user
      const userData = {
        username: username,
        email: data.email,
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: 'student'
      };
      const user: any = await apiRequest('/api/auth/register', 'POST', userData);
      
      // Then create the student record
      const studentData = {
        userId: user.id,
        studentId: data.cclId,
        enrollmentDate: new Date(),
        status: 'active',
        totalCredits: 0
      };
      return apiRequest('/api/students', 'POST', studentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed'] });
      toast({
        title: 'Success',
        description: 'Student has been added successfully.',
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: z.infer<typeof addStudentSchema>) => {
    addStudentMutation.mutate(data);
  };

  const filteredStudents = Array.isArray(students) ? students.filter((student: any) => {
    const matchesSearch = 
      (student.user?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.user?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || student.departmentId.toString() === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  }) : [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', className: 'bg-green-100 text-green-800' },
      suspended: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      graduated: { variant: 'outline', className: 'bg-blue-100 text-blue-800' },
      withdrawn: { variant: 'destructive', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student List</h1>
          <p className="text-gray-600">Manage and view all enrolled students</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
              </div>
              <Users className="w-8 h-8 text-burgundy-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredStudents.filter((s: Student) => s.status === 'active').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredStudents.filter((s: Student) => s.status === 'suspended').length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graduated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredStudents.filter((s: Student) => s.status === 'graduated').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
{Array.isArray(departments) && departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              // Auto-generate password and CCL ID when dialog opens
              generatePassword();
              generateCCLId();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-burgundy-600 hover:bg-burgundy-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account and profile. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter middle name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input type="password" placeholder="Password will be auto-generated" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generatePassword}
                            className="whitespace-nowrap"
                          >
                            Auto Generate
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cclId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CCL ID (Student ID)</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input placeholder="CCL ID will be auto-generated" {...field} readOnly />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateCCLId}
                            className="whitespace-nowrap"
                          >
                            Generate CCL ID
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addStudentMutation.isPending}
                      className="bg-burgundy-600 hover:bg-burgundy-700"
                    >
                      {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div>
          {/* Space for additional buttons later */}
        </div>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {Array.isArray(students) ? students.length : 0} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-burgundy-100 rounded-full flex items-center justify-center">
                      <span className="text-burgundy-600 font-medium">
                        {student.user?.firstName?.charAt(0) || 'U'}{student.user?.lastName?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.user?.firstName || 'Unknown'} {student.user?.lastName || 'User'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>ID: {student.studentId}</span>
                        <span>•</span>
                        <span>{student.user?.email || 'No email'}</span>
                        <span>•</span>
                        <span>Credits: {student.totalCredits || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(student.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Suspend Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}