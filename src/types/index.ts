export type PaymentMethod = 'cash' | 'transfer' | 'check';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type MemberStatus = 'active' | 'inactive' | 'on leave';

export interface Member {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  password?: string; // Optional as it should never be exposed to frontend
  isAdmin?: boolean; // Optional as it's only used during creation
  joinDate: string;
  memberStatus: MemberStatus;
  birthday: string;
  anniversaryDate: string;
  duesAmountPaid: number;
  outstandingYTD: number;
  year: string;
  payments?: Payment[]; // Optional array of payments
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

export interface UserCredentials {
  id?: string;     // Added for consistency with User interface
  email: string;
  password: string;
  isAdmin: boolean;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
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

export interface User {
  email: string;
  name?: string;
  image?: string;
  isAdmin: boolean;
} 