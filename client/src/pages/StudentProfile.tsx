import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, User, BookOpen, FileText, History, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useAuth } from '@/contexts/AuthContext';

const editStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  departmentId: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  notes: z.string().optional(),
});

interface StudentProfileProps {
  studentId: number;
  onClose?: () => void;
}

export default function StudentProfile({ studentId, onClose }: StudentProfileProps) {
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const { data: student, isLoading } = useQuery({
    queryKey: ['/api/students/detailed', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const students = await response.json();
      return students.find((s: any) => s.id === studentId);
    },
    enabled: !!token,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: studentJourney = [] } = useQuery({
    queryKey: ['/api/students', studentId, 'journey'],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/journey`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch student journey');
      }
      return response.json();
    },
    enabled: !!token && !!studentId,
  });

  const form = useForm<z.infer<typeof editStudentSchema>>({
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
      notes: '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        firstName: student.user?.firstName || '',
        middleName: student.user?.middleName || '',
        lastName: student.user?.lastName || '',
        email: student.user?.email || '',
        phoneNumber: student.user?.phoneNumber || '',
        departmentId: student.departmentId?.toString() || 'none',
        year: student.year?.toString() || 'none',
        semester: student.semester?.toString() || 'none',
        notes: student.notes || '',
      });
      setNotes(student.notes || '');
    }
  }, [student, form]);

  const updateStudentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editStudentSchema>) => {
      // Update user information
      const userUpdateData = {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
      };
      await apiRequest(`/api/users/${student.userId}`, 'PUT', userUpdateData);

      // Update student information
      const studentUpdateData = {
        departmentId: data.departmentId && data.departmentId !== 'none' ? parseInt(data.departmentId) : null,
        year: data.year && data.year !== 'none' ? parseInt(data.year) : null,
        semester: data.semester && data.semester !== 'none' ? parseInt(data.semester) : null,
        notes: data.notes || null,
      };
      return apiRequest(`/api/students/${studentId}`, 'PUT', studentUpdateData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/detailed', studentId] });
      toast({
        title: 'Success',
        description: 'Student information has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: z.infer<typeof editStudentSchema>) => {
    updateStudentMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || statusStyles.active}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
      </Badge>
    );
  };

  const getJourneyStatusBadge = (status: string) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      dropped: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Student Not Found</h3>
              <p className="text-gray-600">The requested student could not be found.</p>
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900">
            {student.user?.firstName} {student.user?.lastName}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-lg font-medium text-burgundy-600">{student.studentId}</span>
            {getStatusBadge(student.status)}
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{student.user?.email}</span>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="journey" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Journey</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                Update personal and academic information for this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Personal Information</h3>
                      
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CCL ID
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <span className="text-gray-900 font-medium">{student.studentId}</span>
                          <span className="text-gray-500 text-sm ml-2">(Read-only)</span>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {getStatusBadge(student.status)}
                          <span className="text-gray-500 text-sm ml-2">(Use specific functions to change status)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enrollment Date
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <span className="text-gray-900">
                            {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Academic Progress
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Credits:</span>
                            <span className="text-sm font-medium">{student.totalCredits || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">CGPA:</span>
                            <span className="text-sm font-medium">{student.cgpa || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      type="submit"
                      disabled={updateStudentMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Journey</CardTitle>
              <CardDescription>
                Complete course progression and academic timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentJourney.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Journey Data</h3>
                    <p className="text-gray-600">No course enrollment data available for this student.</p>
                  </div>
                ) : (
                  studentJourney.map((course: any) => (
                    <div key={course.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{course.courseCode} - {course.courseName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Credits: {course.credits}</span>
                            <span>Semester: {course.semester}</span>
                            {course.grade && <span>Grade: {course.grade}</span>}
                          </div>
                        </div>
                        {getJourneyStatusBadge(course.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Started: {new Date(course.startDate).toLocaleDateString()}</span>
                        {course.endDate && <span>Ended: {new Date(course.endDate).toLocaleDateString()}</span>}
                        {!course.endDate && course.status === 'in_progress' && <span>In Progress</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Notes</CardTitle>
              <CardDescription>
                Private notes and observations about this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about this student..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={updateStudentMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateStudentMutation.isPending ? 'Saving...' : 'Save Notes'}</span>
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>
                Complete history of status changes and administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Suspension History */}
                {student.suspensionHistory && student.suspensionHistory.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Suspension Records</h4>
                    <div className="space-y-3">
                      {student.suspensionHistory.map((suspension: any, index: number) => (
                        <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-red-800">
                                Suspended on: {new Date(suspension.date).toLocaleDateString()}
                              </p>
                              <p className="text-red-700 mt-1">{suspension.reason}</p>
                            </div>
                            <Badge variant="destructive">Suspended</Badge>
                          </div>
                          <p className="text-sm text-red-600">
                            Action by: {suspension.adminName || 'System Administrator'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placeholder for other status changes */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Status Changes</h4>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Student Created</p>
                        <p className="text-gray-600 text-sm">
                          Enrolled on: {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Created</Badge>
                    </div>
                  </div>
                </div>

                {(!student.suspensionHistory || student.suspensionHistory.length === 0) && (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Clean Record</h3>
                    <p className="text-gray-600">No disciplinary actions or status changes recorded.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}