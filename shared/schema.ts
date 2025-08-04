import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, date } from "drizzle-orm/pg-core";
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
  groupId: integer("group_id").references(() => groups.id), // Changed from departmentId to groupId
  departmentId: integer("department_id").references(() => departments.id), // Legacy support
  year: integer("year"),
  semester: integer("semester"),
  enrollmentDate: timestamp("enrollment_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, graduated, suspended
  cgpa: decimal("cgpa", { precision: 3, scale: 2 }),
  totalCredits: integer("total_credits").default(0),
  suspensionHistory: jsonb("suspension_history").default([]), // Array of suspension records
  notes: text("notes"), // Private notes about the student
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

// Academic Programs (Courses like Computer Science, Business Administration)
export const academicPrograms = pgTable("academic_programs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  durationSemesters: integer("duration_semesters").notNull(), // Duration in semesters
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Intakes within programs (e.g., Fall 2024, Spring 2025)
export const intakes = pgTable("intakes", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => academicPrograms.id),
  name: varchar("name", { length: 50 }).notNull(), // e.g., "Fall 2024"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Groups within intakes (e.g., Group A, Group B)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  intakeId: integer("intake_id").notNull().references(() => intakes.id),
  termId: integer("term_id").references(() => terms.id), // Current term the group is in
  name: varchar("name", { length: 50 }).notNull(), // e.g., "Group A"
  capacity: integer("capacity").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Terms/Semesters for academic calendar
export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g., "Year 1 - Semester 1"
  number: integer("number").notNull(), // 1, 2, 3, 4
  credits: integer("credits").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subjects/Courses within terms
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  credits: integer("credits").notNull(),
  description: text("description"),
  termId: integer("term_id").notNull().references(() => terms.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Class schedules for groups and subjects
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  facultyId: integer("faculty_id").notNull().references(() => faculty.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS format
  endTime: varchar("end_time", { length: 8 }).notNull(),
  room: varchar("room", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subject enrollments (students enrolled in specific subjects)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  scheduleId: integer("schedule_id").notNull().references(() => schedules.id),
  termId: integer("term_id").notNull().references(() => terms.id),
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
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  groupId: integer("group_id").notNull().references(() => groups.id),
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
  academicPrograms: many(academicPrograms),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  group: one(groups, { fields: [students.groupId], references: [groups.id] }),
  department: one(departments, { fields: [students.departmentId], references: [departments.id] }),
  enrollments: many(enrollments),
  submissions: many(submissions),
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  user: one(users, { fields: [faculty.userId], references: [users.id] }),
  department: one(departments, { fields: [faculty.departmentId], references: [departments.id] }),
  schedules: many(schedules),
  exams: many(exams),
}));

// Academic Program Relations
export const academicProgramsRelations = relations(academicPrograms, ({ one, many }) => ({
  department: one(departments, { fields: [academicPrograms.departmentId], references: [departments.id] }),
  intakes: many(intakes),
}));

export const intakesRelations = relations(intakes, ({ one, many }) => ({
  program: one(academicPrograms, { fields: [intakes.programId], references: [academicPrograms.id] }),
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  intake: one(intakes, { fields: [groups.intakeId], references: [intakes.id] }),
  students: many(students),
  schedules: many(schedules),
  exams: many(exams),
}));

export const termsRelations = relations(terms, ({ many }) => ({
  subjects: many(subjects),
  enrollments: many(enrollments),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  term: one(terms, { fields: [subjects.termId], references: [terms.id] }),
  schedules: many(schedules),
  enrollments: many(enrollments),
  exams: many(exams),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  group: one(groups, { fields: [schedules.groupId], references: [groups.id] }),
  subject: one(subjects, { fields: [schedules.subjectId], references: [subjects.id] }),
  faculty: one(faculty, { fields: [schedules.facultyId], references: [faculty.id] }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  subject: one(subjects, { fields: [enrollments.subjectId], references: [subjects.id] }),
  schedule: one(schedules, { fields: [enrollments.scheduleId], references: [schedules.id] }),
  term: one(terms, { fields: [enrollments.termId], references: [terms.id] }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  enrollment: one(enrollments, { fields: [attendance.enrollmentId], references: [enrollments.id] }),
  markedBy: one(faculty, { fields: [attendance.markedBy], references: [faculty.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  group: one(groups, { fields: [exams.groupId], references: [groups.id] }),
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
}).extend({
  enrollmentDate: z.string().transform((str) => new Date(str)),
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
});

export const insertAcademicProgramSchema = createInsertSchema(academicPrograms).omit({
  id: true,
  createdAt: true,
});

export const insertIntakeSchema = createInsertSchema(intakes).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export const insertTermSchema = createInsertSchema(terms).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
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
export type AcademicProgram = typeof academicPrograms.$inferSelect;
export type InsertAcademicProgram = z.infer<typeof insertAcademicProgramSchema>;
export type Intake = typeof intakes.$inferSelect;
export type InsertIntake = z.infer<typeof insertIntakeSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Term = typeof terms.$inferSelect;
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
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
