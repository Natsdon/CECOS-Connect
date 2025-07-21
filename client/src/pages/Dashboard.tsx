import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, TrendingUp, Clock, UserPlus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalStudents: number;
  activeFaculty: number;
  attendanceRate: number;
  pendingApplications: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back! Here's what's happening in your institution today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500 ml-2">from last semester</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Faculty</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeFaculty || 0}</p>
              </div>
              <div className="w-12 h-12 bg-burgundy-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-burgundy-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+3</span>
              <span className="text-gray-500 ml-2">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.attendanceRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+2.1%</span>
              <span className="text-gray-500 ml-2">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingApplications || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600 font-medium">Urgent</span>
              <span className="text-gray-500 ml-2">review required</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlus className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">John Smith</span> submitted admission application
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-green-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Dr. Wilson</span> released grades for CS301
                    </p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-burgundy-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="text-burgundy-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Prof. Davis</span> marked attendance for ENG201
                    </p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="text-orange-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Emma Johnson</span> submitted assignment for MATH103
                    </p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Add New Student</p>
                <p className="text-xs text-gray-500">Register new student</p>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Take Attendance</p>
                <p className="text-xs text-gray-500">Mark today's attendance</p>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-burgundy-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-burgundy-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Exam</p>
                <p className="text-xs text-gray-500">Schedule new assessment</p>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Review Grades</p>
                <p className="text-xs text-gray-500">Approve pending grades</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="text-orange-600 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-gray-900">Pending Grade Approvals</p>
                <p className="text-xs text-gray-600">23 grade submissions awaiting approval from department heads</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-gray-900">Backup Completed</p>
                <p className="text-xs text-gray-600">Daily system backup completed successfully at 3:00 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
