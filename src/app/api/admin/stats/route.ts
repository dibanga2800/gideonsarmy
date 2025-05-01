import { NextRequest, NextResponse } from 'next/server';
import { getMembers } from '@/lib/googleSheets';
import { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const members = await getMembers();
    
    // Calculate statistics
    const stats: DashboardStats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.memberStatus?.toLowerCase() === 'active').length,
      inactiveMembers: members.filter(m => m.memberStatus?.toLowerCase() !== 'active').length,
      recentActivities: members
        .filter(m => m.payments && m.payments.length > 0)
        .flatMap(m => m.payments || [])
        .map(p => ({
          id: p.id,
          type: 'payment' as const,
          memberName: members.find(m => m.id === p.memberId)?.name || 'Unknown',
          timestamp: p.date
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5) // Get only the 5 most recent activities
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 