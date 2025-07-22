import {
  users, students, faculty, departments, courses, enrollments, attendance,
  exams, submissions, admissions, userPrivileges,
  type User, type InsertUser, type Student, type InsertStudent,
  type Faculty, type InsertFaculty, type Department, type InsertDepartment,
  type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Attendance, type InsertAttendance, type Exam, type InsertExam,
  type Submission, type InsertSubmission, type Admission, type InsertAdmission,
  type UserPrivilege, type InsertUserPrivilege
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, gte, lte, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  validatePassword(username: string, password: string): Promise<User | null>;

  // Students
  getStudents(filters?: { departmentId?: number; year?: number; status?: string; search?: string }): Promise<Student[]>;
  getStudentsWithUserDetails(filters?: { departmentId?: number; year?: number; status?: string; search?: string }): Promise<any[]>;
  getStudentById(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  suspendStudent(id: number, reason: string, adminId: number): Promise<Student | undefined>;
  generateNextCCLId(): Promise<string>;

  // Student Requests
  getStudentRequests(filters?: { status?: string; type?: string }): Promise<any[]>;
  createStudentRequest(request: any): Promise<any>;
  reviewStudentRequest(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<any>;

  // Faculty
  getFaculty(filters?: { departmentId?: number; search?: string }): Promise<Faculty[]>;
  getFacultyById(id: number): Promise<Faculty | undefined>;
  getFacultyByUserId(userId: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Courses
  getCourses(departmentId?: number): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Enrollments
  getEnrollments(studentId?: number, facultyId?: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;

  // Attendance
  getAttendance(enrollmentId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceStats(studentId: number): Promise<{ totalClasses: number; attendedClasses: number; percentage: number }>;

  // Exams
  getExams(courseId?: number, facultyId?: number): Promise<Exam[]>;
  getExamById(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;

  // Submissions
  getSubmissions(examId?: number, studentId?: number): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined>;

  // Admissions
  getAdmissions(status?: string): Promise<Admission[]>;
  getAdmissionById(id: number): Promise<Admission | undefined>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: number, admission: Partial<InsertAdmission>): Promise<Admission | undefined>;

  // User Privileges
  getUserPrivileges(userId: number): Promise<UserPrivilege[]>;
  grantPrivilege(privilege: InsertUserPrivilege): Promise<UserPrivilege>;
  revokePrivilege(userId: number, permission: string, resource: string): Promise<boolean>;

  // Dashboard Statistics
  getDashboardStats(): Promise<{
    totalStudents: number;
    activeFaculty: number;
    attendanceRate: number;
    pendingApplications: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...updateUser };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getStudents(filters?: { departmentId?: number; year?: number; status?: string; search?: string }): Promise<Student[]> {
    let query = db.select().from(students);
    
    if (filters?.departmentId) {
      query = query.where(eq(students.departmentId, filters.departmentId));
    }
    if (filters?.year) {
      query = query.where(eq(students.year, filters.year));
    }
    if (filters?.status) {
      query = query.where(eq(students.status, filters.status));
    }
    
    return await query;
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent || undefined;
  }

  async suspendStudent(id: number, reason: string, adminId: number): Promise<Student | undefined> {
    // First get the current student to access their suspension history
    const currentStudent = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    
    if (currentStudent.length === 0) {
      throw new Error("Student not found");
    }

    const student = currentStudent[0];
    const suspensionRecord = {
      date: new Date().toISOString(),
      reason,
      adminId,
    };

    // Get current suspension history and add new record
    const currentHistory = (student.suspensionHistory as any[]) || [];
    const updatedHistory = [...currentHistory, suspensionRecord];

    // Update student status to suspended and add to history
    const [updatedStudent] = await db
      .update(students)
      .set({
        status: 'suspended',
        suspensionHistory: updatedHistory
      })
      .where(eq(students.id, id))
      .returning();
    
    return updatedStudent || undefined;
  }

  async generateNextCCLId(): Promise<string> {
    try {
      // Get current year (last 2 digits)
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      
      // Get all students and filter client-side to avoid SQL pattern issues
      const allStudents = await db.select({ studentId: students.studentId }).from(students);
      
      // Filter for current year CCL IDs
      const currentYearStudents = allStudents.filter(student => 
        student.studentId.startsWith(`CCL-${yearSuffix}-`)
      );
      
      let nextNumber = 1;
      
      if (currentYearStudents.length > 0) {
        // Extract numbers from all matching CCL IDs and find the highest
        const numbers = currentYearStudents
          .map(student => {
            const match = student.studentId.match(/CCL-\d{2}-(\d{4})$/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0);
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }
      
      // Format as 4-digit number with leading zeros
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      return `CCL-${yearSuffix}-${formattedNumber}`;
    } catch (error) {
      console.error('Error in generateNextCCLId:', error);
      // Fallback: return a simple incremented ID
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const timestamp = Date.now().toString().slice(-4);
      return `CCL-${yearSuffix}-${timestamp}`;
    }
  }

  async getStudentsWithUserDetails(filters?: { departmentId?: number; year?: number; status?: string; search?: string }): Promise<any[]> {
    let query = db.select({
      id: students.id,
      userId: students.userId,
      studentId: students.studentId,
      departmentId: students.departmentId,
      year: students.year,
      semester: students.semester,
      enrollmentDate: students.enrollmentDate,
      status: students.status,
      cgpa: students.cgpa,
      totalCredits: students.totalCredits,
      suspensionHistory: students.suspensionHistory,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        middleName: users.middleName,
        email: users.email,
        username: users.username,
        phoneNumber: users.phoneNumber
      }
    }).from(students).innerJoin(users, eq(students.userId, users.id));
    
    if (filters?.departmentId) {
      query = query.where(eq(students.departmentId, filters.departmentId));
    }
    if (filters?.year) {
      query = query.where(eq(students.year, filters.year));
    }
    if (filters?.status) {
      query = query.where(eq(students.status, filters.status));
    }
    
    return await query;
  }

  async getStudentRequests(filters?: { status?: string; type?: string }): Promise<any[]> {
    // Return empty array for now since we don't have a student_requests table
    // In a real implementation, you would query from a student_requests table
    return [];
  }

  async createStudentRequest(request: any): Promise<any> {
    // Return mock data for now since we don't have a student_requests table
    return { id: 1, ...request, submittedAt: new Date() };
  }

  async reviewStudentRequest(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<any> {
    // Return mock data for now since we don't have a student_requests table
    return { id, status, reviewNotes, reviewedBy: reviewerId, reviewedAt: new Date() };
  }

  async getFaculty(filters?: { departmentId?: number; search?: string }): Promise<Faculty[]> {
    let query = db.select().from(faculty);
    
    if (filters?.departmentId) {
      query = query.where(eq(faculty.departmentId, filters.departmentId));
    }
    
    return await query;
  }

  async getFacultyById(id: number): Promise<Faculty | undefined> {
    const [facultyMember] = await db.select().from(faculty).where(eq(faculty.id, id));
    return facultyMember || undefined;
  }

  async getFacultyByUserId(userId: number): Promise<Faculty | undefined> {
    const [facultyMember] = await db.select().from(faculty).where(eq(faculty.userId, userId));
    return facultyMember || undefined;
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const [newFaculty] = await db.insert(faculty).values(facultyData).returning();
    return newFaculty;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentById(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async getCourses(departmentId?: number): Promise<Course[]> {
    if (departmentId) {
      return await db.select().from(courses).where(eq(courses.departmentId, departmentId));
    }
    return await db.select().from(courses);
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getEnrollments(studentId?: number, facultyId?: number): Promise<Enrollment[]> {
    let query = db.select().from(enrollments);
    
    if (studentId) {
      query = query.where(eq(enrollments.studentId, studentId));
    }
    if (facultyId) {
      query = query.where(eq(enrollments.facultyId, facultyId));
    }
    
    return await query;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async getAttendance(enrollmentId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    let query = db.select().from(attendance).where(eq(attendance.enrollmentId, enrollmentId));
    
    if (startDate) {
      query = query.where(gte(attendance.date, startDate));
    }
    if (endDate) {
      query = query.where(lte(attendance.date, endDate));
    }
    
    return await query.orderBy(desc(attendance.date));
  }

  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async getAttendanceStats(studentId: number): Promise<{ totalClasses: number; attendedClasses: number; percentage: number }> {
    const enrollmentsList = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
    
    let totalClasses = 0;
    let attendedClasses = 0;
    
    for (const enrollment of enrollmentsList) {
      const attendanceRecords = await db.select().from(attendance).where(eq(attendance.enrollmentId, enrollment.id));
      totalClasses += attendanceRecords.length;
      attendedClasses += attendanceRecords.filter(record => record.status === 'present').length;
    }
    
    const percentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    
    return { totalClasses, attendedClasses, percentage };
  }

  async getExams(courseId?: number, facultyId?: number): Promise<Exam[]> {
    let query = db.select().from(exams);
    
    if (courseId) {
      query = query.where(eq(exams.courseId, courseId));
    }
    if (facultyId) {
      query = query.where(eq(exams.createdBy, facultyId));
    }
    
    return await query.orderBy(desc(exams.createdAt));
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam || undefined;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const [updatedExam] = await db
      .update(exams)
      .set(exam)
      .where(eq(exams.id, id))
      .returning();
    return updatedExam || undefined;
  }

  async getSubmissions(examId?: number, studentId?: number): Promise<Submission[]> {
    let query = db.select().from(submissions);
    
    if (examId) {
      query = query.where(eq(submissions.examId, examId));
    }
    if (studentId) {
      query = query.where(eq(submissions.studentId, studentId));
    }
    
    return await query.orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(submission)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  async getAdmissions(status?: string): Promise<Admission[]> {
    if (status) {
      return await db.select().from(admissions).where(eq(admissions.status, status)).orderBy(desc(admissions.appliedAt));
    }
    return await db.select().from(admissions).orderBy(desc(admissions.appliedAt));
  }

  async getAdmissionById(id: number): Promise<Admission | undefined> {
    const [admission] = await db.select().from(admissions).where(eq(admissions.id, id));
    return admission || undefined;
  }

  async createAdmission(admission: InsertAdmission): Promise<Admission> {
    const [newAdmission] = await db.insert(admissions).values(admission).returning();
    return newAdmission;
  }

  async updateAdmission(id: number, admission: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const [updatedAdmission] = await db
      .update(admissions)
      .set(admission)
      .where(eq(admissions.id, id))
      .returning();
    return updatedAdmission || undefined;
  }

  async getUserPrivileges(userId: number): Promise<UserPrivilege[]> {
    return await db.select().from(userPrivileges).where(eq(userPrivileges.userId, userId));
  }

  async grantPrivilege(privilege: InsertUserPrivilege): Promise<UserPrivilege> {
    const [newPrivilege] = await db.insert(userPrivileges).values(privilege).returning();
    return newPrivilege;
  }

  async revokePrivilege(userId: number, permission: string, resource: string): Promise<boolean> {
    const result = await db
      .delete(userPrivileges)
      .where(
        and(
          eq(userPrivileges.userId, userId),
          eq(userPrivileges.permission, permission),
          eq(userPrivileges.resource, resource)
        )
      );
    return result.rowCount > 0;
  }

  async getDashboardStats(): Promise<{
    totalStudents: number;
    activeFaculty: number;
    attendanceRate: number;
    pendingApplications: number;
  }> {
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.status, 'active'));

    const [activeFacultyResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'faculty'), eq(users.isActive, true)));

    const [pendingApplicationsResult] = await db
      .select({ count: count() })
      .from(admissions)
      .where(eq(admissions.status, 'pending'));

    // Calculate attendance rate
    const attendanceRecords = await db.select().from(attendance);
    const presentRecords = attendanceRecords.filter(record => record.status === 'present');
    const attendanceRate = attendanceRecords.length > 0 ? (presentRecords.length / attendanceRecords.length) * 100 : 0;

    return {
      totalStudents: totalStudentsResult.count,
      activeFaculty: activeFacultyResult.count,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      pendingApplications: pendingApplicationsResult.count,
    };
  }
  async deleteStudent(id: number): Promise<boolean> {
    try {
      // First get the student to find their user ID
      const student = await this.getStudentById(id);
      if (!student) {
        throw new Error("Student not found");
      }

      // Delete the student record first (due to foreign key constraint)
      await db.delete(students).where(eq(students.id, id));
      
      // Then delete the associated user record
      await db.delete(users).where(eq(users.id, student.userId));
      
      return true;
    } catch (error) {
      console.error("Delete student error:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
