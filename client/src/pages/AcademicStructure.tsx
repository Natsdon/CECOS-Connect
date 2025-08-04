import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Settings
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
              departments={departments ?? []}
              programs={programs ?? []}
              intakes={intakes ?? []}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Hierarchical View</TabsTrigger>
          <TabsTrigger value="terms">Terms Management</TabsTrigger>
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
              {programs?.map((program) => (
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
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4 ml-8 space-y-3">
                      {getIntakesForProgram(program.id).map((intake) => (
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
                                    Year {intake.year} • Semester {intake.semester}
                                  </div>
                                </div>
                                <Badge variant={intake.isActive ? "default" : "secondary"}>
                                  {intake.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-3 ml-8 space-y-2">
                              {getGroupsForIntake(intake.id).map((group) => (
                                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <div>
                                      <div className="font-medium text-gray-900">{group.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {group.currentStudents}/{group.maxStudents} students
                                      </div>
                                    </div>
                                    <Badge variant={group.isActive ? "default" : "secondary"}>
                                      {group.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm">
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Users className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {getGroupsForIntake(intake.id).length === 0 && (
                                <div className="text-sm text-gray-400 italic">No groups created yet</div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                      {getIntakesForProgram(program.id).length === 0 && (
                        <div className="text-sm text-gray-400 italic">No intakes created yet</div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Academic Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {terms?.map((term) => (
                  <div key={term.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{term.name}</h3>
                      <Badge variant={term.isActive ? "default" : "secondary"}>
                        {term.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Start: {new Date(term.startDate).toLocaleDateString()}</div>
                      <div>End: {new Date(term.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
  intakes 
}: { 
  type: 'program' | 'intake' | 'group' | 'term';
  setType: (type: 'program' | 'intake' | 'group' | 'term') => void;
  onClose: () => void;
  departments: any[] | undefined;
  programs: any[] | undefined;
  intakes: any[] | undefined;
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    programId: '',
    intakeId: '',
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
        data.year = parseInt(formData.year);
        data.semester = parseInt(formData.semester);
        data.startDate = formData.startDate;
        data.endDate = formData.endDate;
        break;
      case 'group':
        data.intakeId = parseInt(formData.intakeId);
        data.maxStudents = parseInt(formData.maxStudents);
        data.currentStudents = 0;
        break;
      case 'term':
        data.number = parseInt(formData.year) || 1; // Use year field as term number
        data.credits = parseInt(formData.semester) || 3; // Use semester field as credits
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="Year"
                required
              />
            </div>
            <div>
              <Label>Semester</Label>
              <Input
                type="number"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="Semester"
                required
              />
            </div>
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