import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';

interface Submission {
  id: number;
  examId: number;
  studentId: number;
  filePath?: string;
  submittedAt: string;
  obtainedMarks?: number;
  feedback?: string;
  gradedBy?: number;
  gradedAt?: string;
  status: string;
  isResubmission: boolean;
  exam?: {
    title: string;
    totalMarks: number;
    course?: {
      code: string;
      name: string;
    };
  };
  student?: {
    studentId: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function GradeManagement() {
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    obtainedMarks: '',
    feedback: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['/api/exams'],
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions', selectedExam],
    enabled: !!selectedExam,
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, gradeData }: { submissionId: number; gradeData: any }) => {
      const response = await apiRequest(`/api/submissions/${submissionId}/grade`, 'PUT', gradeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      setIsGradeDialogOpen(false);
      setSelectedSubmission(null);
      setGradeForm({ obtainedMarks: '', feedback: '' });
      toast({
        title: 'Grade Submitted',
        description: 'The submission has been graded successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit grade.',
        variant: 'destructive',
      });
    },
  });

  const handleGradeSubmission = () => {
    if (!selectedSubmission) return;

    const obtainedMarks = parseInt(gradeForm.obtainedMarks);
    const totalMarks = selectedSubmission.exam?.totalMarks || 0;

    if (obtainedMarks > totalMarks) {
      toast({
        title: 'Invalid Grade',
        description: `Obtained marks cannot exceed total marks (${totalMarks}).`,
        variant: 'destructive',
      });
      return;
    }

    gradeSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      gradeData: {
        obtainedMarks,
        feedback: gradeForm.feedback,
        gradedBy: 1, // This should come from auth context
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (obtainedMarks: number, totalMarks: number) => {
    const percentage = (obtainedMarks / totalMarks) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (examsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grade Management</h2>
        <p className="text-gray-600">Review, grade, and manage student submissions and assessments</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exam-select">Select Exam/Assessment</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                  <SelectValue placeholder="Choose an exam to review submissions" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.course?.code} - {exam.title} ({exam.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Statistics */}
      {selectedExam && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {submissions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {submissions?.filter(s => s.status === 'submitted').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Pending Grading</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {submissions?.filter(s => s.status === 'graded').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Graded</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-burgundy-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {submissions?.filter(s => s.isResubmission).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Resubmissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions Table */}
      {selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resubmission</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {submission.student?.user?.firstName} {submission.student?.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.student?.user?.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {submission.student?.studentId}
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {submission.obtainedMarks !== null ? (
                          <span className={`font-medium ${getGradeColor(
                            submission.obtainedMarks || 0,
                            submission.exam?.totalMarks || 0
                          )}`}>
                            {submission.obtainedMarks}/{submission.exam?.totalMarks}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)} variant="secondary">
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.isResubmission ? (
                          <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800" variant="secondary">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-burgundy-600 hover:text-burgundy-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeForm({
                                obtainedMarks: submission.obtainedMarks?.toString() || '',
                                feedback: submission.feedback || ''
                              });
                              setIsGradeDialogOpen(true);
                            }}
                          >
                            Grade
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grade Submission Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <p className="text-sm text-gray-900">
                    {selectedSubmission.student?.user?.firstName} {selectedSubmission.student?.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedSubmission.student?.studentId}
                  </p>
                </div>
                <div>
                  <Label>Exam</Label>
                  <p className="text-sm text-gray-900">{selectedSubmission.exam?.title}</p>
                  <p className="text-xs text-gray-500">
                    Total Marks: {selectedSubmission.exam?.totalMarks}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="obtained-marks">Obtained Marks</Label>
                <Input
                  id="obtained-marks"
                  type="number"
                  min="0"
                  max={selectedSubmission.exam?.totalMarks}
                  value={gradeForm.obtainedMarks}
                  onChange={(e) => setGradeForm({ ...gradeForm, obtainedMarks: e.target.value })}
                  placeholder={`Enter marks out of ${selectedSubmission.exam?.totalMarks}`}
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Provide feedback for the student..."
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsGradeDialogOpen(false);
                    setSelectedSubmission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGradeSubmission}
                  disabled={gradeSubmissionMutation.isPending}
                  className="bg-burgundy-500 hover:bg-burgundy-600"
                >
                  {gradeSubmissionMutation.isPending ? 'Submitting...' : 'Submit Grade'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
