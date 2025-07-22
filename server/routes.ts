import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAdmissionSchema, insertAttendanceSchema, insertExamSchema, insertSubmissionSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cecos-sis-secret";

interface AuthRequest extends Request {
  user?: any;
}

// Authentication middleware
const authenticateToken = (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.validatePassword(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Student management routes
  app.get("/api/students", authenticateToken, authorize(['admin', 'epr_admin', 'faculty']), async (req: Request, res: Response) => {
    try {
      const { departmentId, year, status, search } = req.query;
      const filters = {
        departmentId: departmentId ? parseInt(departmentId as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        status: status as string,
        search: search as string,
      };
      
      const students = await storage.getStudents(filters);
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/students/detailed", authenticateToken, authorize(['admin', 'epr_admin', 'faculty']), async (req: Request, res: Response) => {
    try {
      const { departmentId, year, status, search } = req.query;
      const filters = {
        departmentId: departmentId ? parseInt(departmentId as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        status: status as string,
        search: search as string,
      };
      
      const students = await storage.getStudentsWithUserDetails(filters);
      res.json(students);
    } catch (error) {
      console.error("Get detailed students error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/student-requests", authenticateToken, authorize(['admin', 'epr_admin', 'faculty']), async (req: Request, res: Response) => {
    try {
      const { status, type } = req.query;
      const filters = {
        status: status as string,
        type: type as string,
      };
      
      const requests = await storage.getStudentRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Get student requests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/student-requests/:id/review", authenticateToken, authorize(['admin', 'epr_admin', 'faculty']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      const reviewerId = (req as any).user.id;
      
      const result = await storage.reviewStudentRequest(id, status, reviewNotes, reviewerId);
      res.json(result);
    } catch (error) {
      console.error("Review student request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Move specific routes before parameterized routes
  app.get("/api/students/next-ccl-id", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const nextCCLId = await storage.generateNextCCLId();
      res.json({ cclId: nextCCLId });
    } catch (error) {
      console.error("Generate CCL ID error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Create student error:", error);
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  app.get("/api/students/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if id is valid
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const student = await storage.getStudentById(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Get student error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students/:id/suspend", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = (req as any).user.id;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Suspension reason is required" });
      }
      
      const result = await storage.suspendStudent(id, reason.trim(), adminId);
      res.json(result);
    } catch (error) {
      console.error("Suspend student error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/students/:id", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const updateData = req.body;
      const updatedStudent = await storage.updateStudent(id, updateData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const updateData = req.body;
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/students/:id", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      await storage.deleteStudent(id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Delete student error:", error);
      if (error instanceof Error && error.message === "Student not found") {
        res.status(404).json({ message: "Student not found" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Attendance routes
  app.get("/api/attendance", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { enrollmentId, startDate, endDate } = req.query;
      
      if (!enrollmentId) {
        return res.status(400).json({ message: "Enrollment ID is required" });
      }
      
      const attendance = await storage.getAttendance(
        parseInt(enrollmentId as string),
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(attendance);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendance", authenticateToken, authorize(['faculty', 'admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.markAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.get("/api/attendance/stats/:studentId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const stats = await storage.getAttendanceStats(studentId);
      res.json(stats);
    } catch (error) {
      console.error("Get attendance stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Exam routes
  app.get("/api/exams", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { courseId, facultyId } = req.query;
      const exams = await storage.getExams(
        courseId ? parseInt(courseId as string) : undefined,
        facultyId ? parseInt(facultyId as string) : undefined
      );
      res.json(exams);
    } catch (error) {
      console.error("Get exams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/exams", authenticateToken, authorize(['faculty', 'admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const examData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Create exam error:", error);
      res.status(400).json({ message: "Invalid exam data" });
    }
  });

  app.put("/api/exams/:id", authenticateToken, authorize(['faculty', 'admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const examData = req.body;
      const exam = await storage.updateExam(id, examData);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      res.json(exam);
    } catch (error) {
      console.error("Update exam error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Submission routes
  app.get("/api/submissions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { examId, studentId } = req.query;
      const submissions = await storage.getSubmissions(
        examId ? parseInt(examId as string) : undefined,
        studentId ? parseInt(studentId as string) : undefined
      );
      res.json(submissions);
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/submissions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const submissionData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Create submission error:", error);
      res.status(400).json({ message: "Invalid submission data" });
    }
  });

  app.put("/api/submissions/:id/grade", authenticateToken, authorize(['faculty', 'admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { obtainedMarks, feedback, gradedBy } = req.body;
      
      const submission = await storage.updateSubmission(id, {
        obtainedMarks,
        feedback,
        gradedBy,
        gradedAt: new Date(),
        status: 'graded'
      });
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Grade submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admissions routes
  app.get("/api/admissions", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const admissions = await storage.getAdmissions(status as string);
      res.json(admissions);
    } catch (error) {
      console.error("Get admissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admissions", async (req: Request, res: Response) => {
    try {
      const admissionData = insertAdmissionSchema.parse(req.body);
      const admission = await storage.createAdmission(admissionData);
      res.status(201).json(admission);
    } catch (error) {
      console.error("Create admission error:", error);
      res.status(400).json({ message: "Invalid admission data" });
    }
  });

  app.put("/api/admissions/:id", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNotes, reviewedBy } = req.body;
      
      const admission = await storage.updateAdmission(id, {
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date()
      });
      
      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }
      
      res.json(admission);
    } catch (error) {
      console.error("Update admission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Department routes
  app.get("/api/departments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Get departments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User privilege routes
  app.get("/api/users/:id/privileges", authenticateToken, authorize(['admin', 'epr_admin']), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const privileges = await storage.getUserPrivileges(userId);
      res.json(privileges);
    } catch (error) {
      console.error("Get user privileges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/privileges", authenticateToken, authorize(['epr_admin']), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { permission, resource, grantedBy } = req.body;
      
      const privilege = await storage.grantPrivilege({
        userId,
        permission,
        resource,
        grantedBy
      });
      
      res.status(201).json(privilege);
    } catch (error) {
      console.error("Grant privilege error:", error);
      res.status(400).json({ message: "Invalid privilege data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
