export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'teacher' | 'student';
  grade?: number; // Only for students
}

export interface Question {
  id: string;
  subject: string;
  grade: number;
  level: number;
  type: 'mcq' | 'short' | 'essay';
  content: string;
  options?: string[]; // For mcq
  correct?: number;   // For mcq
  sampleAnswer?: string; // For short answer
  keywords?: string[];   // For essay
}

export interface Lesson {
  id: string;
  subject: string;
  grade: number;
  order: number;
  title: string;
  desc: string;
  driveLink: string;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: 'pending' | 'approved';
  kind: 'official' | 'community';
  createdAt: string;
}

export interface Document {
  id: string;
  teacherId: string;
  subject: string;
  grade: number;
  title: string;
  content: string;
  uploadedAt: string;
}

export interface ExamDetail {
  qid: string;
  type: 'mcq' | 'short' | 'essay';
  content: string;
  given: any;
  score: number;
}

export interface Attempt {
  id: string;
  userId: string;
  subject: string;
  grade: number;
  level: number;
  score: number;
  total: number;
  passed: boolean;
  date: string;
  details: ExamDetail[];
}

export interface Certificate {
  id: string;
  userId: string;
  subject: string;
  grade: number;
  level: number;
  date: string;
}

export interface ToastData {
  msg: string;
  type: 'success' | 'error' | 'info';
}
