import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Clock, FileText, Users } from 'lucide-react';

export default function ExamManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: exams } = useQuery({
    queryKey: ['/api/exams'],
  });

  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'midterm':
        return 'bg-blue-100 text-blue-800';
      case 'final':
        return 'bg-red-100 text-red-800';
      case 'quiz':
        return 'bg-green-100 text-green-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600">Create, schedule, and manage examinations and assessments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-burgundy-500 hover:bg-burgundy-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select>
                    <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                      <SelectValue placeholder="Select course" />
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
                  <Label htmlFor="type">Exam Type</Label>
                  <Select>
                    <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midterm">Midterm</SelectItem>
                      <SelectItem value="final">Final Exam</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Exam Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter exam title"
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input 
                    id="totalMarks" 
                    type="number" 
                    placeholder="100"
                    className="focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="120"
                    className="focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="examDate">Exam Date & Time</Label>
                <Input 
                  id="examDate" 
                  type="datetime-local"
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea 
                  id="instructions" 
                  placeholder="Enter exam instructions..."
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-burgundy-500 hover:bg-burgundy-600">
                  Create Exam
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exam Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">12</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">28</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-burgundy-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">2,847</div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams?.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.code}</TableCell>
                  <TableCell>
                    <Badge className={getExamTypeColor(exam.type)} variant="secondary">
                      {exam.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {exam.examDate ? new Date(exam.examDate).toLocaleString() : 'Not scheduled'}
                  </TableCell>
                  <TableCell>{exam.duration ? `${exam.duration} min` : 'N/A'}</TableCell>
                  <TableCell>{exam.totalMarks}</TableCell>
                  <TableCell>
                    <span className="text-blue-600 font-medium">45/52</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} variant="secondary">
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-burgundy-600">
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-600">
                        Results
                      </Button>
                    </div>
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
