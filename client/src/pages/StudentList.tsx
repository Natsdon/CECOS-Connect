import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreHorizontal, Users, UserCheck, UserX, Eye, Plus, Trash2 } from 'lucide-react';
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

const editStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  departmentId: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  
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

  const editForm = useForm<z.infer<typeof editStudentSchema>>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      departmentId: 'none',
      year: 'none',
      semester: 'none',
      status: 'active',
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
      const response = await apiRequest('/api/students/next-ccl-id', 'GET');
      const data = await response.json();
      form.setValue('cclId', data.cclId);
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
      const user: any = await apiRequest('/api/auth/register', 'POST', userData).then(res => res.json());
      
      // Then create the student record
      const studentData = {
        userId: user.id,
        studentId: data.cclId,
        enrollmentDate: new Date().toISOString(),
        status: 'active',
        totalCredits: 0
      };
      return apiRequest('/api/students', 'POST', studentData).then(res => res.json());
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

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editStudentSchema>) => {
      if (!selectedStudent) throw new Error('No student selected');
      
      // Update user information
      const userUpdateData = {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
      };
      await apiRequest(`/api/users/${selectedStudent.userId}`, 'PUT', userUpdateData);

      // Update student information
      const studentUpdateData = {
        departmentId: data.departmentId && data.departmentId !== 'none' ? parseInt(data.departmentId) : null,
        year: data.year && data.year !== 'none' ? parseInt(data.year) : null,
        semester: data.semester && data.semester !== 'none' ? parseInt(data.semester) : null,
        status: data.status,
      };
      return apiRequest(`/api/students/${selectedStudent.id}`, 'PUT', studentUpdateData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed'] });
      toast({
        title: 'Success',
        description: 'Student has been updated successfully.',
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      return apiRequest(`/api/students/${studentId}`, 'DELETE').then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed'] });
      toast({
        title: 'Success',
        description: 'Student has been deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: z.infer<typeof addStudentSchema>) => {
    addStudentMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof editStudentSchema>) => {
    editStudentMutation.mutate(data);
  };

  // Suspend student mutation
  const suspendStudentMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: number; reason: string }) => {
      return apiRequest(`/api/students/${studentId}/suspend`, 'POST', { reason }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed'] });
      toast({
        title: 'Success',
        description: 'Student has been suspended successfully.',
      });
      setIsSuspendDialogOpen(false);
      setSuspensionReason('');
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSuspendStudent = (student: any) => {
    setSelectedStudent(student);
    setIsSuspendDialogOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    // Populate edit form with student data
    editForm.reset({
      firstName: student.user?.firstName || '',
      middleName: student.user?.middleName || '',
      lastName: student.user?.lastName || '',
      email: student.user?.email || '',
      phoneNumber: student.user?.phoneNumber || '',
      departmentId: student.departmentId?.toString() || 'none',
      year: student.year?.toString() || 'none',
      semester: student.semester?.toString() || 'none',
      status: student.status || 'active',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setIsDetailsDialogOpen(true);
  };

  const confirmSuspension = () => {
    if (!selectedStudent || !suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension.',
        variant: 'destructive',
      });
      return;
    }
    suspendStudentMutation.mutate({
      studentId: selectedStudent.id,
      reason: suspensionReason.trim()
    });
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
                        <button 
                          onClick={() => handleViewDetails(student)}
                          className="text-burgundy-600 hover:text-burgundy-800 hover:underline font-medium"
                        >
                          {student.studentId}
                        </button>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                          Edit Student
                        </DropdownMenuItem>
                        {student.status !== 'suspended' && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleSuspendStudent(student)}
                          >
                            Suspend Student
                          </DropdownMenuItem>
                        )}
                        {student.status === 'suspended' && (
                          <DropdownMenuItem 
                            className="text-green-600"
                            onClick={() => {/* TODO: Implement reactivate */}}
                          >
                            Reactivate Student
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Student
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

      {/* Suspend Student Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Student</DialogTitle>
            <DialogDescription>
              You are about to suspend {selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName} 
              ({selectedStudent?.studentId}). Please provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension *
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
                rows={4}
                placeholder="Please provide a detailed reason for suspension..."
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSuspendDialogOpen(false);
                setSuspensionReason('');
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSuspension}
              disabled={suspendStudentMutation.isPending || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {suspendStudentMutation.isPending ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{selectedStudent.user?.firstName} {selectedStudent.user?.middleName || ''} {selectedStudent.user?.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedStudent.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone Number</label>
                      <p className="text-gray-900">{selectedStudent.user?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <p className="text-gray-900">{selectedStudent.user?.username || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">CCL ID</label>
                      <p className="text-gray-900 font-medium">{selectedStudent.studentId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedStudent.department?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedStudent.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Enrollment Date</label>
                      <p className="text-gray-900">
                        {selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Credits</label>
                      <p className="text-gray-900">{selectedStudent.totalCredits || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">CGPA</label>
                      <p className="text-gray-900">{selectedStudent.cgpa || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suspension History - if student has been suspended */}
              {selectedStudent.suspensionHistory && selectedStudent.suspensionHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspension History</h3>
                  <div className="space-y-3">
                    {selectedStudent.suspensionHistory.map((suspension: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-800">Suspended on: {new Date(suspension.date).toLocaleDateString()}</p>
                            <p className="text-red-700 mt-1">{suspension.reason}</p>
                          </div>
                          <Badge variant="destructive">Suspended</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setIsDetailsDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information for {selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName} 
              ({selectedStudent?.studentId})
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Middle name (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="student@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Academic Information</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not Set</SelectItem>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not Set</SelectItem>
                            <SelectItem value="1">1st Semester</SelectItem>
                            <SelectItem value="2">2nd Semester</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedStudent(null);
                    editForm.reset();
                  }}
                  disabled={editStudentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editStudentMutation.isPending}
                >
                  {editStudentMutation.isPending ? 'Updating...' : 'Update Student'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName} 
              ({selectedStudent?.studentId})? This action cannot be undone and will remove all associated records.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteStudentMutation.mutate(selectedStudent?.id)}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}