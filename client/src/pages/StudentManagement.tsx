import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, RefreshCw, Plus, Eye, Edit, Trash2, User } from 'lucide-react';

interface Student {
  id: number;
  userId: number;
  studentId: string;
  departmentId: number;
  year: number;
  semester: number;
  status: string;
  cgpa?: number;
  totalCredits?: number;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: {
    name: string;
    code: string;
  };
}

export default function StudentManagement() {
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    year: '',
    status: ''
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students', filters],
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600">Manage student records, enrollment, and academic information</p>
        </div>
        <Button className="bg-burgundy-500 hover:bg-burgundy-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or email"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>
            
            <Select value={filters.departmentId} onValueChange={(value) => setFilters({ ...filters, departmentId: value })}>
              <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
              <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student List</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{student.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{student.studentId}</TableCell>
                    <TableCell>{student.department?.name}</TableCell>
                    <TableCell>{student.year} Year</TableCell>
                    <TableCell>{student.cgpa ? student.cgpa.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.status)} variant="secondary">
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-burgundy-600 hover:text-burgundy-900">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing 1 to {students?.length || 0} students
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button size="sm" className="bg-burgundy-500 text-white">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
