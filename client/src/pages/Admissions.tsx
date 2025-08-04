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
import { Plus, Eye, CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';

interface Admission {
  id: number;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  preferredDepartment: number;
  previousEducation?: any;
  documents?: any;
  status: string;
  reviewedBy?: number;
  reviewNotes?: string;
  appliedAt: string;
  reviewedAt?: string;
  preferredDepartmentData?: {
    name: string;
    code: string;
  };
}

export default function Admissions() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: '',
    reviewNotes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['/api/admissions', selectedStatus === 'all' ? '' : selectedStatus],
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const reviewAdmissionMutation = useMutation({
    mutationFn: async ({ admissionId, reviewData }: { admissionId: number; reviewData: any }) => {
      const response = await apiRequest('PUT', `/api/admissions/${admissionId}`, reviewData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      setIsReviewDialogOpen(false);
      setSelectedAdmission(null);
      setReviewForm({ status: '', reviewNotes: '' });
      toast({
        title: 'Application Reviewed',
        description: 'The admission application has been reviewed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to review application.',
        variant: 'destructive',
      });
    },
  });

  const handleReviewApplication = () => {
    if (!selectedAdmission || !reviewForm.status) return;

    reviewAdmissionMutation.mutate({
      admissionId: selectedAdmission.id,
      reviewData: {
        status: reviewForm.status,
        reviewNotes: reviewForm.reviewNotes,
        reviewedBy: 1, // This should come from auth context
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'enrolled':
        return User;
      default:
        return FileText;
    }
  };

  if (isLoading) {
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

  const statusCounts = {
    pending: admissions?.filter(a => a.status === 'pending').length || 0,
    approved: admissions?.filter(a => a.status === 'approved').length || 0,
    rejected: admissions?.filter(a => a.status === 'rejected').length || 0,
    enrolled: admissions?.filter(a => a.status === 'enrolled').length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admissions Management</h2>
        <p className="text-gray-600">Review and manage student admission applications</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.enrolled}</div>
                <div className="text-sm text-gray-600">Enrolled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                  <SelectValue placeholder="All Applications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admission Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Preferred Department</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions?.map((admission) => {
                const StatusIcon = getStatusIcon(admission.status);
                return (
                  <TableRow key={admission.id}>
                    <TableCell className="font-mono">{admission.applicationId}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {admission.firstName} {admission.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{admission.email}</div>
                      <div className="text-sm text-gray-500">{admission.phone}</div>
                    </TableCell>
                    <TableCell>{admission.preferredDepartmentData?.name}</TableCell>
                    <TableCell>
                      {new Date(admission.appliedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4" />
                        <Badge className={getStatusColor(admission.status)} variant="secondary">
                          {admission.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {admission.reviewedAt ? (
                        <div className="text-sm">
                          <div className="text-gray-900">Admin</div>
                          <div className="text-gray-500">
                            {new Date(admission.reviewedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not reviewed</span>
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
                        {admission.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setSelectedAdmission(admission);
                              setReviewForm({
                                status: '',
                                reviewNotes: admission.reviewNotes || ''
                              });
                              setIsReviewDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Application Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
          </DialogHeader>
          {selectedAdmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Applicant</Label>
                  <p className="text-sm text-gray-900">
                    {selectedAdmission.firstName} {selectedAdmission.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedAdmission.email}</p>
                </div>
                <div>
                  <Label>Application ID</Label>
                  <p className="text-sm font-mono text-gray-900">{selectedAdmission.applicationId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Department</Label>
                  <p className="text-sm text-gray-900">{selectedAdmission.preferredDepartmentData?.name}</p>
                </div>
                <div>
                  <Label>Applied Date</Label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAdmission.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <p className="text-sm text-gray-900">{selectedAdmission.address}</p>
              </div>

              <div>
                <Label htmlFor="review-status">Decision</Label>
                <Select value={reviewForm.status} onValueChange={(value) => setReviewForm({ ...reviewForm, status: value })}>
                  <SelectTrigger className="focus:ring-burgundy-500 focus:border-burgundy-500">
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  placeholder="Enter review notes and comments..."
                  className="focus:ring-burgundy-500 focus:border-burgundy-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReviewDialogOpen(false);
                    setSelectedAdmission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewApplication}
                  disabled={!reviewForm.status || reviewAdmissionMutation.isPending}
                  className="bg-burgundy-500 hover:bg-burgundy-600"
                >
                  {reviewAdmissionMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
