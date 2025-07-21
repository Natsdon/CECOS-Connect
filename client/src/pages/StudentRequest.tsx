import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Clock, CheckCircle, XCircle, Eye, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface StudentRequest {
  id: number;
  studentId: number;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  attachments?: any[];
  student?: {
    firstName: string;
    lastName: string;
    studentId: string;
    email: string;
  };
}

export default function StudentRequest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/student-requests'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return apiRequest(`/api/student-requests/${id}/review`, 'POST', { status, reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student-requests'] });
      toast({
        title: 'Request reviewed',
        description: 'The student request has been updated successfully.',
      });
      setSelectedRequest(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to review the request. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const filteredRequests = Array.isArray(requests) ? requests.filter((request: StudentRequest) => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.student?.firstName + ' ' + request.student?.lastName).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={priorityConfig[priority as keyof typeof priorityConfig]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const handleReview = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    reviewMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: reviewNotes
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Student Requests</h1>
          <p className="text-gray-600">Review and manage student requests and applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
              </div>
              <FileText className="w-8 h-8 text-burgundy-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredRequests.filter((r: StudentRequest) => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRequests.filter((r: StudentRequest) => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredRequests.filter((r: StudentRequest) => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
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
                  placeholder="Search by title, description, or student name..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="financial_aid">Financial Aid</SelectItem>
                <SelectItem value="course_change">Course Change</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>
            Showing {filteredRequests.length} of {Array.isArray(requests) ? requests.length : 0} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredRequests.map((request: StudentRequest) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>
                            {request.student ? 
                              `${request.student.firstName} ${request.student.lastName} (${request.student.studentId})` :
                              'Unknown Student'
                            }
                          </span>
                        </div>
                        <span>•</span>
                        <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{request.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedRequest?.title}</DialogTitle>
                            <DialogDescription>
                              Review and respond to this student request
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Student</label>
                                  <p className="text-sm text-gray-900">
                                    {selectedRequest.student ? 
                                      `${selectedRequest.student.firstName} ${selectedRequest.student.lastName}` :
                                      'Unknown Student'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Type</label>
                                  <p className="text-sm text-gray-900 capitalize">
                                    {selectedRequest.type.replace('_', ' ')}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Priority</label>
                                  <div className="mt-1">
                                    {getPriorityBadge(selectedRequest.priority)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Submitted</label>
                                  <p className="text-sm text-gray-900">
                                    {new Date(selectedRequest.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                                  {selectedRequest.description}
                                </p>
                              </div>
                              {selectedRequest.status === 'pending' && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Review Notes</label>
                                  <Textarea
                                    placeholder="Add your review notes..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              {selectedRequest.status !== 'pending' && selectedRequest.reviewNotes && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Review Notes</label>
                                  <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                                    {selectedRequest.reviewNotes}
                                  </p>
                                </div>
                              )}
                              {selectedRequest.status === 'pending' && (
                                <div className="flex space-x-3 pt-4">
                                  <Button
                                    onClick={() => handleReview('approved')}
                                    disabled={reviewMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleReview('rejected')}
                                    disabled={reviewMutation.isPending}
                                    variant="destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
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