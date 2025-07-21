import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceTracking() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  const { data: enrollments } = useQuery({
    queryKey: ['/api/enrollments', selectedCourse],
    enabled: !!selectedCourse,
  });

  const getAttendanceStatus = (status: string) => {
    switch (status) {
      case 'present':
        return { label: 'Present', color: 'bg-green-100 text-green-800', icon: Check };
      case 'absent':
        return { label: 'Absent', color: 'bg-red-100 text-red-800', icon: X };
      case 'late':
        return { label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      default:
        return { label: 'Not Marked', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Tracking</h2>
        <p className="text-gray-600">Mark and track student attendance for your courses</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal focus:ring-burgundy-500 focus:border-burgundy-500"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-burgundy-500 hover:bg-burgundy-600">
                Load Attendance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">10%</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">3%</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">2%</div>
              <div className="text-sm text-gray-600">Excused</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance - {format(selectedDate, "PPP")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments?.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {enrollment.student?.user?.firstName?.[0]}{enrollment.student?.user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {enrollment.student?.user?.firstName} {enrollment.student?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{enrollment.student?.studentId}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge className="bg-green-100 text-green-800" variant="secondary">
                      Present
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-burgundy-500 hover:bg-burgundy-600">
                Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
