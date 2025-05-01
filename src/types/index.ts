import { DefaultSession } from 'next-auth';

export type PaymentStatus = 'completed' | 'pending';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque';
export type MemberStatus = 'active' | 'inactive' | 'on leave';

export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  month: string;
  year: string;
  status: PaymentStatus;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  phoneNumber: string | null;
  joinDate: string | null;
  birthday: string | null;
  anniversary: string | null;
  memberStatus: string;
  duesAmountPaid: number;
  outstandingYTD: number;
  totalDuesOwed: number;
  year: string;
  payments?: Payment[];
}

export interface UserCredentials {
  id?: string;     // Added for consistency with User interface
  email: string;
  password: string;
  isAdmin: boolean;
  name: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentFormData {
  amount: number;
  date: string;
  method: PaymentMethod;
  month: string;
  year: string;
}

export interface MemberFormData {
  name: string;
  email: string;
  phoneNumber?: string;
  joinDate?: string;
  birthday?: string;
  anniversary?: string;
  memberStatus: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  recentActivities: {
    id: string;
    type: 'join' | 'leave' | 'update' | 'payment';
    memberName: string;
    timestamp: string;
  }[];
} 