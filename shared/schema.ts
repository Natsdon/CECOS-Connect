import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and role management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student, faculty, admin, epr_admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  headId: integer("head_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Students table with extended information
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  studentId: varchar("student_id", { length: 20 }).notNull().unique(),
  departmentId: integer("department_id").references(() => departments.id),
  year: integer("year"),
  semester: integer("semester"),
  enrollmentDate: timestamp("enrollment_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, graduated, suspended
  cgpa: decimal("cgpa", { precision: 3, scale: 2 }),
  totalCredits: integer("total_credits").default(0),
});

// Faculty table
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  designation: varchar("designation", { length: 50 }).notNull(),
  joiningDate: timestamp("joining_date").notNull(),
  qualifications: text("qualifications"),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  credits: integer("credits").notNull(),
  description: text("description"),
  prerequisites: jsonb("prerequisites"), // Array of course IDs
});

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  facultyId: integer("faculty_id").notNull().references(() => faculty.id),
  semester: varchar("semester", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("enrolled"), // enrolled, dropped, completed
  grade: varchar("grade", { length: 5 }),
  gradePoints: decimal("grade_points", { precision: 3, scale: 2 }),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

// Attendance records
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late, excused
  markedBy: integer("marked_by").notNull().references(() => faculty.id),
  notes: text("notes"),
  markedAt: timestamp("marked_at").notNull().defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: varchar("title", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // midterm, final, quiz, assignment
  totalMarks: integer("total_marks").notNull(),
  duration: integer("duration"), // in minutes
  examDate: timestamp("exam_date"),
  instructions: text("instructions"),
  createdBy: integer("created_by").notNull().references(() => faculty.id),
  isPublished: boolean("is_published").notNull().default(false),
  allowResubmission: boolean("allow_resubmission").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Student exam submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: integer("student_id").notNull().references(() => students.id),
  filePath: text("file_path"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  obtainedMarks: integer("obtained_marks"),
  feedback: text("feedback"),
  gradedBy: integer("graded_by").references(() => faculty.id),
  gradedAt: timestamp("graded_at"),
  status: varchar("status", { length: 20 }).notNull().default("submitted"), // submitted, graded, returned
  isResubmission: boolean("is_resubmission").notNull().default(false),
});

// Admissions table
export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  address: text("address").notNull(),
  preferredDepartment: integer("preferred_department").notNull().references(() => departments.id),
  previousEducation: jsonb("previous_education"),
  documents: jsonb("documents"), // Array of document paths
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, enrolled
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// User privileges table
export const userPrivileges = pgTable("user_privileges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  permission: varchar("permission", { length: 50 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  grantedBy: integer("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  faculty: one(faculty, { fields: [users.id], references: [faculty.userId] }),
  privileges: many(userPrivileges),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, { fields: [departments.headId], references: [users.id] }),
  students: many(students),
  faculty: many(faculty),
  courses: many(courses),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  department: one(departments, { fields: [students.departmentId], references: [departments.id] }),
  enrollments: many(enrollments),
  submissions: many(submissions),
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  user: one(users, { fields: [faculty.userId], references: [users.id] }),
  department: one(departments, { fields: [faculty.departmentId], references: [departments.id] }),
  enrollments: many(enrollments),
  exams: many(exams),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, { fields: [courses.departmentId], references: [departments.id] }),
  enrollments: many(enrollments),
  exams: many(exams),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  faculty: one(faculty, { fields: [enrollments.facultyId], references: [faculty.id] }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  enrollment: one(enrollments, { fields: [attendance.enrollmentId], references: [enrollments.id] }),
  markedBy: one(faculty, { fields: [attendance.markedBy], references: [faculty.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  course: one(courses, { fields: [exams.courseId], references: [courses.id] }),
  createdBy: one(faculty, { fields: [exams.createdBy], references: [faculty.id] }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  exam: one(exams, { fields: [submissions.examId], references: [exams.id] }),
  student: one(students, { fields: [submissions.studentId], references: [students.id] }),
  gradedBy: one(faculty, { fields: [submissions.gradedBy], references: [faculty.id] }),
}));

export const admissionsRelations = relations(admissions, ({ one }) => ({
  preferredDepartment: one(departments, { fields: [admissions.preferredDepartment], references: [departments.id] }),
  reviewedBy: one(users, { fields: [admissions.reviewedBy], references: [users.id] }),
}));

export const userPrivilegesRelations = relations(userPrivileges, ({ one }) => ({
  user: one(users, { fields: [userPrivileges.userId], references: [users.id] }),
  grantedBy: one(users, { fields: [userPrivileges.grantedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export const insertAdmissionSchema = createInsertSchema(admissions).omit({
  id: true,
  appliedAt: true,
  reviewedAt: true,
});

export const insertUserPrivilegeSchema = createInsertSchema(userPrivileges).omit({
  id: true,
  grantedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Admission = typeof admissions.$inferSelect;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type UserPrivilege = typeof userPrivileges.$inferSelect;
export type InsertUserPrivilege = z.infer<typeof insertUserPrivilegeSchema>;
