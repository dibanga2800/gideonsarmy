import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDashboardStats } from '@/lib/googleSheets';
import { authOptions } from '@/lib/auth';
import type { DashboardStats } from '@/types';

// Mock data for when Google Sheets fails
const mockStats: DashboardStats = {
  totalMembers: 5,
  activeMembers: 4,
  inactiveMembers: 1,
  recentActivities: [
    {
      id: '1',
      type: 'payment',
      memberName: 'John Doe',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: '2',
      type: 'payment',
      memberName: 'Jane Smith',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: '3',
      type: 'payment',
      memberName: 'David Ibanga',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access Denied - Admin privileges required' },
        { status: 403 }
      );
    }

    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Sheets not configured, using mock data');
      return NextResponse.json(mockStats);
    }

    // Fetch real dashboard stats
    try {
      const stats = await getDashboardStats();
      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching from Google Sheets, falling back to mock data:', error);
      return NextResponse.json(mockStats);
    }

  } catch (error) {
    console.error('Error in admin stats endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GETMock() {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // For now, return mock data
    // TODO: Replace with actual database queries
    const mockStats: DashboardStats = {
      totalMembers: 50,
      activeMembers: 35,
      inactiveMembers: 15,
      recentActivities: [
        {
          id: '1',
          type: 'join',
          memberName: 'John Smith',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: '2',
          type: 'update',
          memberName: 'David Johnson',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        {
          id: '3',
          type: 'leave',
          memberName: 'Michael Brown',
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
      ],
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 