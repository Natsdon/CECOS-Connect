import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Edit2,
  Trash2,
  Settings,
  ArrowRight,
  Edit
} from 'lucide-react';

interface AcademicProgram {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  duration: number;
  description?: string;
  isActive: boolean;
  department?: {
    name: string;
    code: string;
  };
}

interface Intake {
  id: number;
  name: string;
  year: number;
  semester: number;
  programId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  program?: AcademicProgram;
}

interface Group {
  id: number;
  name: string;
  intakeId: number;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  intake?: Intake;
}

interface Term {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function AcademicStructure() {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedIntakes, setExpandedIntakes] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'program' | 'intake' | 'group' | 'term'>('program');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [editingType, setEditingType] = useState<'program' | 'intake' | 'group' | 'term'>('program');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedIntakeFilter, setSelectedIntakeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: programs, isLoading: programsLoading } = useQuery<AcademicProgram[]>({
    queryKey: ['/api/academic-programs'],
  });

  const { data: intakes, isLoading: intakesLoading } = useQuery<Intake[]>({
    queryKey: ['/api/intakes'],
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  const { data: terms, isLoading: termsLoading } = useQuery<Term[]>({
    queryKey: ['/api/terms'],
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const toggleProgramExpansion = (programId: number) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const toggleIntakeExpansion = (intakeId: number) => {
    const newExpanded = new Set(expandedIntakes);
    if (newExpanded.has(intakeId)) {
      newExpanded.delete(intakeId);
    } else {
      newExpanded.add(intakeId);
    }
    setExpandedIntakes(newExpanded);
  };

  const getIntakesForProgram = (programId: number) => {
    return intakes?.filter(intake => intake.programId === programId) || [];
  };

  const getGroupsForIntake = (intakeId: number) => {
    return groups?.filter(group => group.intakeId === intakeId) || [];
  };

  // Filter functions
  const getFilteredPrograms = () => {
    if (!programs) return [];
    
    return programs.filter(program => {
      const matchesSearch = searchQuery === '' || 
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProgramFilter = selectedProgramFilter === 'all' ||
        selectedProgramFilter === program.id.toString();
      
      const matchesStatus = selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && program.isActive) ||
        (selectedStatusFilter === 'inactive' && !program.isActive);
      
      return matchesSearch && matchesProgramFilter && matchesStatus;
    });
  };

  const getFilteredIntakesForProgram = (programId: number) => {
    const programIntakes = intakes?.filter(intake => intake.programId === programId) || [];
    
    return programIntakes.filter(intake => {
      const matchesSearch = searchQuery === '' || 
        intake.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIntakeFilter = selectedIntakeFilter === 'all' ||
        intake.name.toLowerCase().includes(selectedIntakeFilter.toLowerCase());
      
      const matchesStatus = selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && intake.isActive) ||
        (selectedStatusFilter === 'inactive' && !intake.isActive);
      
      return matchesSearch && matchesIntakeFilter && matchesStatus;
    });
  };

  const getFilteredGroupsForTerm = (termId: number, intakeId: number) => {
    const termGroups = groups?.filter(group => 
      group.intakeId === intakeId && (group as any).termId === termId
    ) || [];
    
    return termGroups.filter(group => {
      const matchesSearch = searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && group.isActive) ||
        (selectedStatusFilter === 'inactive' && !group.isActive);
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredTerms = () => {
    if (!terms) return [];
    
    return terms.filter(term => {
      const matchesSearch = searchQuery === '' || 
        term.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Helper function to get filtered terms for a specific intake
  const getFilteredTermsForIntake = (intakeId: number) => {
    return terms?.filter(term => {
      const matchesIntake = (term as any).intakeId === intakeId;
      const matchesSearch = searchQuery === '' || 
        term.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesIntake && matchesSearch;
    }) || [];
  };

  // Edit handlers
  const handleEditProgram = (program: AcademicProgram) => {
    setEditingEntity(program);
    setEditingType('program');
    setIsEditDialogOpen(true);
  };

  const handleEditIntake = (intake: Intake) => {
    setEditingEntity(intake);
    setEditingType('intake');
    setIsEditDialogOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingEntity(group);
    setEditingType('group');
    setIsEditDialogOpen(true);
  };

  const handleProgressGroup = (group: any, currentTermId: number) => {
    // Find the next term in sequence
    const currentTerm = terms?.find(t => t.id === currentTermId);
    const nextTerm = terms?.find(t => t.number === (currentTerm?.number || 1) + 1);
    
    if (!nextTerm) {
      toast({
        title: 'No Next Term',
        description: 'This group is already in the final term.',
        variant: 'destructive',
      });
      return;
    }

    // Progress the group to the next term
    progressGroupMutation.mutate({
      groupId: group.id,
      termId: nextTerm.id
    });
  };

  const progressGroupMutation = useMutation({
    mutationFn: async ({ groupId, termId }: { groupId: number; termId: number }) => {
      return await apiRequest(`/api/groups/${groupId}`, 'PUT', { termId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: 'Success',
        description: 'Group progressed to next term successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to progress group.',
        variant: 'destructive',
      });
    },
  });

  // Delete handlers
  const handleDeleteIntake = (intake: any) => {
    // Check if intake has any groups
    const intakeGroups = groups?.filter(g => g.intakeId === intake.id) || [];
    if (intakeGroups.length > 0) {
      toast({
        title: 'Cannot Delete Intake',
        description: `This intake has ${intakeGroups.length} group(s). Remove all groups first.`,
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete intake "${intake.name}"?`)) {
      deleteIntakeMutation.mutate(intake.id);
    }
  };

  const handleDeleteTerm = (term: any) => {
    // Check if term has any groups
    const termGroups = groups?.filter(g => (g as any).termId === term.id) || [];
    if (termGroups.length > 0) {
      toast({
        title: 'Cannot Delete Term',
        description: `This term has ${termGroups.length} group(s). Remove all groups first.`,
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete term "${term.name}"?`)) {
      deleteTermMutation.mutate(term.id);
    }
  };

  const handleDeleteGroup = async (group: any) => {
    // Check if group has any students (we'll need to implement this API endpoint)
    try {
      const studentsResponse = await apiRequest(`/api/groups/${group.id}/students`, 'GET');
      const students = await studentsResponse.json();
      
      if (students.length > 0) {
        toast({
          title: 'Cannot Delete Group',
          description: `This group has ${students.length} student(s) enrolled. Remove all students first.`,
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      // If API endpoint doesn't exist yet, just warn about potential students
      console.warn('Student check API not available');
    }

    if (window.confirm(`Are you sure you want to delete group "${group.name}"?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const handleDeleteProgram = (program: any) => {
    // Check if program has any intakes
    const programIntakes = intakes?.filter(i => i.programId === program.id) || [];
    if (programIntakes.length > 0) {
      toast({
        title: 'Cannot Delete Program',
        description: `This program has ${programIntakes.length} intake(s). Remove all intakes first.`,
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete program "${program.name}"?`)) {
      deleteProgramMutation.mutate(program.id);
    }
  };

  const deleteIntakeMutation = useMutation({
    mutationFn: async (intakeId: number) => {
      return await apiRequest(`/api/intakes/${intakeId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/intakes'] });
      toast({
        title: 'Success',
        description: 'Intake deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete intake.',
        variant: 'destructive',
      });
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (termId: number) => {
      return await apiRequest(`/api/terms/${termId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
      toast({
        title: 'Success',
        description: 'Term deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete term.',
        variant: 'destructive',
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return await apiRequest(`/api/groups/${groupId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: 'Success',
        description: 'Group deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete group.',
        variant: 'destructive',
      });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number) => {
      return await apiRequest(`/api/academic-programs/${programId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
      toast({
        title: 'Success',
        description: 'Program deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete program.',
        variant: 'destructive',
      });
    },
  });

  const handleEditTerm = (term: Term) => {
    setEditingEntity(term);
    setEditingType('term');
    setIsEditDialogOpen(true);
  };

  if (programsLoading || intakesLoading || groupsLoading || termsLoading) {
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

  const stats = {
    totalPrograms: programs?.length || 0,
    totalIntakes: intakes?.length || 0,
    totalGroups: groups?.length || 0,
    totalTerms: terms?.length || 0,
    activePrograms: programs?.filter(p => p.isActive).length || 0,
    activeIntakes: intakes?.filter(i => i.isActive).length || 0,
    activeGroups: groups?.filter(g => g.isActive).length || 0,
    activeTerms: terms?.filter(t => t.isActive).length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Academic Structure Management</h2>
          <p className="text-gray-600">Manage courses, intakes, groups, and terms in a hierarchical structure</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-burgundy-500 hover:bg-burgundy-600">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Academic Entity</DialogTitle>
            </DialogHeader>
            <CreateEntityForm 
              type={createType} 
              setType={setCreateType}
              onClose={() => setIsCreateDialogOpen(false)}
              departments={departments as any}
              programs={programs as any}
              intakes={intakes as any}
              terms={terms as any}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {editingType.charAt(0).toUpperCase() + editingType.slice(1)}</DialogTitle>
            </DialogHeader>
            <EditEntityForm 
              type={editingType} 
              entity={editingEntity}
              onClose={() => setIsEditDialogOpen(false)}
              departments={departments as any}
              programs={programs as any}
              intakes={intakes as any}
              terms={terms as any}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-burgundy-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activePrograms}</div>
                <div className="text-sm text-gray-600">Active Programs</div>
                <div className="text-xs text-gray-400">({stats.totalPrograms} total)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeIntakes}</div>
                <div className="text-sm text-gray-600">Active Intakes</div>
                <div className="text-xs text-gray-400">({stats.totalIntakes} total)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeGroups}</div>
                <div className="text-sm text-gray-600">Active Groups</div>
                <div className="text-xs text-gray-400">({stats.totalGroups} total)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeTerms}</div>
                <div className="text-sm text-gray-600">Active Terms</div>
                <div className="text-xs text-gray-400">({stats.totalTerms} total)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search programs, intakes, groups, or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedIntakeFilter} onValueChange={setSelectedIntakeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intakes</SelectItem>
                  <SelectItem value="sep 25">Sep 25 Intakes</SelectItem>
                  <SelectItem value="jan 26">Jan 26 Intakes</SelectItem>
                  <SelectItem value="may 26">May 26 Intakes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || selectedProgramFilter !== 'all' || selectedIntakeFilter !== 'all' || selectedStatusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProgramFilter('all');
                    setSelectedIntakeFilter('all');
                    setSelectedStatusFilter('all');
                  }}
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview">Academic Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Academic Programs Structure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getFilteredPrograms().map((program) => (
                <div key={program.id} className="border rounded-lg p-4">
                  <Collapsible 
                    open={expandedPrograms.has(program.id)}
                    onOpenChange={() => toggleProgramExpansion(program.id)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        {expandedPrograms.has(program.id) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                        <GraduationCap className="w-5 h-5 text-burgundy-600" />
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">
                            {program.name} ({program.code})
                          </div>
                          <div className="text-sm text-gray-500">
                            {program.department?.name} • {program.duration} years
                          </div>
                        </div>
                        <Badge variant={program.isActive ? "default" : "secondary"}>
                          {program.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                            <Settings className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Program
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProgram(program)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Program
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4 ml-8 space-y-3">
                      {getFilteredIntakesForProgram(program.id).map((intake) => (
                        <div key={intake.id} className="border-l-2 border-blue-200 pl-4">
                          <Collapsible
                            open={expandedIntakes.has(intake.id)}
                            onOpenChange={() => toggleIntakeExpansion(intake.id)}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-3">
                                {expandedIntakes.has(intake.id) ? 
                                  <ChevronDown className="w-4 h-4" /> : 
                                  <ChevronRight className="w-4 h-4" />
                                }
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                <div className="text-left">
                                  <div className="font-medium text-gray-900">{intake.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {intake.totalTerms} Terms • {new Date(intake.startDate).toLocaleDateString('en-GB', { 
                                      year: 'numeric', 
                                      month: 'short' 
                                    })} - {new Date(intake.endDate).toLocaleDateString('en-GB', { 
                                      year: 'numeric', 
                                      month: 'short' 
                                    })}
                                  </div>
                                </div>
                                <Badge variant={intake.isActive ? "default" : "secondary"}>
                                  {intake.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                                    <Settings className="w-4 h-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handleEditIntake(intake)}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteIntake(intake)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Intake
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-3 ml-8 space-y-4">
                              {/* Terms with Groups underneath */}
                              <div className="space-y-4">
                                {getFilteredTermsForIntake(intake.id).map((term) => (
                                  <div key={term.id} className="border-l-2 border-purple-200 pl-4">
                                    {/* Term Header */}
                                    <div className="flex items-center justify-between mb-3 p-3 bg-purple-50 rounded-lg border">
                                      <div className="flex items-center space-x-3">
                                        <BookOpen className="w-4 h-4 text-purple-600" />
                                        <div>
                                          <h5 className="font-semibold text-gray-900">{term.name}</h5>
                                          <div className="text-sm text-gray-600">
                                            Term {term.number} • {term.credits} credits
                                            {(term as any).startDate && (term as any).endDate && (
                                              <div className="text-xs text-gray-500 mt-1">
                                                {new Date((term as any).startDate).toLocaleDateString()} - {new Date((term as any).endDate).toLocaleDateString()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded">
                                            <Settings className="w-3 h-3" />
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEditTerm(term)}>
                                              <Edit2 className="w-3 h-3 mr-2" />
                                              Edit Term
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteTerm(term)}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="w-3 h-3 mr-2" />
                                              Delete Term
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>

                                    {/* Groups under this term */}
                                    <div className="ml-6 space-y-2">
                                      {getFilteredGroupsForTerm(term.id, intake.id).map((group) => (
                                        <div key={group.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                          <div className="flex items-center space-x-3">
                                            <Users className="w-4 h-4 text-green-600" />
                                            <div>
                                              <div className="font-medium text-gray-900">{group.name}</div>
                                              <div className="text-sm text-gray-500">
                                                Capacity: {(group as any).capacity || 30} students
                                              </div>
                                            </div>
                                            <Badge variant={group.isActive ? "default" : "secondary"}>
                                              {group.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleProgressGroup(group, term.id)}>
                                              <ArrowRight className="w-4 h-4" />
                                            </Button>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded">
                                                <Settings className="w-4 h-4" />
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                                  <Edit2 className="w-4 h-4 mr-2" />
                                                  Edit Group
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  onClick={() => handleDeleteGroup(group)}
                                                  className="text-red-600 focus:text-red-600"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Delete Group
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                      ))}
                                      {getFilteredGroupsForTerm(term.id, intake.id).length === 0 && (
                                        <div className="text-sm text-gray-400 italic ml-3">No groups in this term yet</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {getFilteredTerms().length === 0 && (
                                  <div className="text-sm text-gray-400 italic">No terms created yet</div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                      {getFilteredIntakesForProgram(program.id).length === 0 && (
                        <div className="text-sm text-gray-400 italic">No intakes created yet</div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}

function CreateEntityForm({ 
  type, 
  setType, 
  onClose, 
  departments, 
  programs, 
  intakes,
  terms 
}: { 
  type: 'program' | 'intake' | 'group' | 'term';
  setType: (type: 'program' | 'intake' | 'group' | 'term') => void;
  onClose: () => void;
  departments: any[] | undefined;
  programs: any[] | undefined;
  intakes: any[] | undefined;
  terms: any[] | undefined;
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    programId: '',
    intakeId: '',
    termId: '',
    duration: '',
    year: '',
    semester: '',
    maxStudents: '',
    startDate: '',
    endDate: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = {
        program: '/api/academic-programs',
        intake: '/api/intakes',
        group: '/api/groups',
        term: '/api/terms',
      }[type];
      
      const response = await apiRequest(endpoint, 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type === 'program' ? 'academic-programs' : type + 's'}`] });
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to create ${type}.`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      name: formData.name,
      isActive: true,
    };

    switch (type) {
      case 'program':
        data.code = formData.code;
        data.departmentId = parseInt(formData.departmentId);
        data.duration = parseInt(formData.duration);
        data.description = formData.description;
        break;
      case 'intake':
        data.programId = parseInt(formData.programId);
        data.totalTerms = parseInt(formData.semester);
        data.startDate = formData.startDate;
        data.endDate = formData.endDate;
        break;
      case 'group':
        data.termId = parseInt(formData.termId);
        data.intakeId = parseInt(formData.intakeId);
        data.capacity = parseInt(formData.maxStudents);
        break;
      case 'term':
        data.intakeId = parseInt(formData.intakeId);
        data.number = parseInt(formData.number);
        data.credits = parseInt(formData.credits);
        data.startDate = formData.startDate;
        data.endDate = formData.endDate;
        break;
    }

    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Entity Type</Label>
        <Select value={type} onValueChange={(value: any) => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="program">Academic Program</SelectItem>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="term">Term</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={`Enter ${type} name`}
          required
        />
      </div>

      {type === 'program' && (
        <>
          <div>
            <Label>Code</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter program code"
              required
            />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration (years)</Label>
            <Input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Enter duration in years"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter program description"
            />
          </div>
        </>
      )}

      {type === 'intake' && (
        <>
          <div>
            <Label>Program</Label>
            <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>{program.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Academic Terms</Label>
            <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Terms</SelectItem>
                <SelectItem value="3">3 Terms</SelectItem>
                <SelectItem value="4">4 Terms</SelectItem>
                <SelectItem value="5">5 Terms</SelectItem>
                <SelectItem value="6">6 Terms</SelectItem>
                <SelectItem value="7">7 Terms</SelectItem>
                <SelectItem value="8">8 Terms</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      {type === 'group' && (
        <>
          <div>
            <Label>Intake</Label>
            <Select value={formData.intakeId} onValueChange={(value) => setFormData({ ...formData, intakeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                {intakes?.map((intake) => (
                  <SelectItem key={intake.id} value={intake.id.toString()}>{intake.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Starting Term</Label>
            <Select value={formData.termId} onValueChange={(value) => setFormData({ ...formData, termId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select starting term" />
              </SelectTrigger>
              <SelectContent>
                {terms?.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>{term.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Maximum Students</Label>
            <Input
              type="number"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
              placeholder="Enter maximum students"
              required
            />
          </div>
        </>
      )}

      {type === 'term' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Term Number</Label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              placeholder="Term number (1, 2, 3, etc.)"
              required
            />
          </div>
          <div>
            <Label>Credits</Label>
            <Input
              type="number"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              placeholder="Credits for this term"
              required
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending}
          className="bg-burgundy-500 hover:bg-burgundy-600"
        >
          {createMutation.isPending ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </Button>
      </div>
    </form>
  );
}

function EditEntityForm({ 
  type, 
  entity,
  onClose, 
  departments, 
  programs, 
  intakes,
  terms 
}: { 
  type: 'program' | 'intake' | 'group' | 'term';
  entity: any;
  onClose: () => void;
  departments: any[] | undefined;
  programs: any[] | undefined;
  intakes: any[] | undefined;
  terms: any[] | undefined;
}) {
  const [formData, setFormData] = useState(() => {
    const currentYear = new Date().getFullYear().toString();
    
    if (!entity) return {
      name: '',
      code: '',
      description: '',
      departmentId: '',
      programId: '',
      intakeId: '',
      duration: '',
      year: currentYear,
      semester: '',
      maxStudents: '',
      startDate: '',
      endDate: ''
    };

    // Extract year from intake name if this is an intake
    let extractedYear = currentYear;
    if (type === 'intake' && entity.name) {
      const yearMatch = entity.name.match(/\d{4}/);
      if (yearMatch) {
        extractedYear = yearMatch[0];
      }
    }

    // Pre-populate form with entity data
    return {
      name: entity.name || '',
      code: entity.code || '',
      description: entity.description || '',
      departmentId: entity.departmentId?.toString() || '',
      programId: entity.programId?.toString() || '',
      intakeId: entity.intakeId?.toString() || '',
      duration: entity.duration?.toString() || '',
      year: entity.year?.toString() || entity.number?.toString() || extractedYear,
      semester: entity.semester?.toString() || entity.credits?.toString() || '',
      maxStudents: entity.maxStudents?.toString() || entity.capacity?.toString() || '',
      startDate: entity.startDate || '',
      endDate: entity.endDate || ''
    };
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoints = {
        program: '/api/academic-programs',
        intake: '/api/intakes',
        group: '/api/groups',
        term: '/api/terms'
      };
      
      return apiRequest(`${endpoints[type]}/${entity.id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/${type === 'program' ? 'academic-programs' : type + 's'}`] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to update ${type}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      name: formData.name,
      isActive: entity.isActive,
    };

    switch (type) {
      case 'program':
        data.code = formData.code;
        data.departmentId = parseInt(formData.departmentId);
        data.duration = parseInt(formData.duration);
        data.description = formData.description;
        break;
      case 'intake':
        data.programId = parseInt(formData.programId);
        data.totalTerms = entity.totalTerms; // Keep existing totalTerms, don't change during edit
        data.startDate = formData.startDate;
        data.endDate = formData.endDate;
        // Handle year in name properly - remove any existing years and add the new one
        let baseName = formData.name;
        if (formData.year) {
          // Remove any existing year numbers (4 digits) from the name
          baseName = baseName.replace(/\s*\d{4}\s*/g, '').trim();
          data.name = `${baseName} ${formData.year}`;
        }
        break;
      case 'group':
        data.termId = parseInt(formData.termId);
        data.intakeId = parseInt(formData.intakeId);
        data.capacity = parseInt(formData.maxStudents);
        break;
      case 'term':
        data.intakeId = parseInt(formData.intakeId);
        data.number = parseInt(formData.number);
        data.credits = parseInt(formData.credits);
        data.startDate = formData.startDate;
        data.endDate = formData.endDate;
        break;
    }

    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={`Enter ${type} name`}
          required
        />
      </div>
      {type === 'program' && (
        <>
          <div>
            <Label>Code</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter program code"
              required
            />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration (years)</Label>
            <Input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Enter duration in years"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter program description"
            />
          </div>
        </>
      )}
      {type === 'intake' && (
        <>
          <div>
            <Label>Program</Label>
            <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>{program.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Intake Year</Label>
            <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
                <SelectItem value="2029">2029</SelectItem>
                <SelectItem value="2030">2030</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}
      {type === 'group' && (
        <>
          <div>
            <Label>Intake</Label>
            <Select value={formData.intakeId} onValueChange={(value) => setFormData({ ...formData, intakeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                {intakes?.map((intake) => (
                  <SelectItem key={intake.id} value={intake.id.toString()}>{intake.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Maximum Students</Label>
            <Input
              type="number"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
              placeholder="Enter maximum students"
              required
            />
          </div>
        </>
      )}
      {type === 'term' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Term Number</Label>
            <Input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="Term number (1, 2, 3, etc.)"
              required
            />
          </div>
          <div>
            <Label>Credits</Label>
            <Input
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              placeholder="Credits"
              required
            />
          </div>
        </div>
      )}
      <div className="flex items-center space-x-3 pt-4">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Updating...' : 'Update'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}