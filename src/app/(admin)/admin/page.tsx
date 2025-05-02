'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { sendDuesStatusEmail, sendBulkDuesStatusEmails } from '@/lib/actions/email';

// Define interface for member with events
interface MemberWithEvents {
  id: string;
  name: string;
  email: string;
  birthday: string;
  anniversary: string;
  hasBirthday: boolean;
  hasAnniversary: boolean;
}

// Define interface for dashboard stats
interface DashboardStats {
  totalMembers: number;
  totalUsers: number;
  totalAmount: number;
  currentMonthBirthdays: number;
  currentMonthAnniversaries: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalUsers: 0,
    totalAmount: 0,
    currentMonthBirthdays: 0,
    currentMonthAnniversaries: 0
  });
  const [membersWithEvents, setMembersWithEvents] = useState<MemberWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

  // Calculate pagination
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = membersWithEvents.slice(indexOfFirstMember, indexOfLastMember);
  const totalPages = Math.ceil(membersWithEvents.length / membersPerPage);

  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Fetch stats for the dashboard
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch members
      const membersResponse = await fetch('/api/members');
      const members = await membersResponse.json();
      
      // Fetch users
      const usersResponse = await fetch('/api/users');
      const users = await usersResponse.json();
      
      // Get current month 
      const currentMonth = new Date().getMonth() + 1;
      
      // Filter members with birthdays or anniversaries in current month
      const membersWithBirthdays = members.filter((member: any) => {
        if (!member.birthday) return false;
        
        // Handle different date formats
        let birthMonth;
        
        if (member.birthday.includes('/')) {
          birthMonth = parseInt(member.birthday.split('/')[1]);
        } else if (member.birthday.includes('-')) {
          birthMonth = parseInt(member.birthday.split('-')[1]);
        }
        
        return birthMonth === currentMonth;
      });
      
      const membersWithAnniversaries = members.filter((member: any) => {
        if (!member.anniversary) return false;
        
        let anniversaryMonth;
        
        if (member.anniversary.includes('/')) {
          anniversaryMonth = parseInt(member.anniversary.split('/')[1]);
        } else if (member.anniversary.includes('-')) {
          anniversaryMonth = parseInt(member.anniversary.split('-')[1]);
        }
        
        return anniversaryMonth === currentMonth;
      });
      
      // Calculate statistics
      const totalPaid = members.reduce((sum: number, m: any) => sum + (parseFloat(m.amountPaid) || 0), 0);
      
      // Set statistics
      setStats({
        totalMembers: members.length,
        totalUsers: users.length,
        totalAmount: totalPaid,
        currentMonthBirthdays: membersWithBirthdays.length,
        currentMonthAnniversaries: membersWithAnniversaries.length
      });
      
      // Prepare members with events for the table
      const combineMembers = [...membersWithBirthdays, ...membersWithAnniversaries];
      
      // Remove duplicates and enrich data
      const uniqueMembers = Array.from(new Set(combineMembers.map((m: any) => m.id)))
        .map(id => {
          const member = combineMembers.find((m: any) => m.id === id);
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            birthday: member.birthday || 'N/A',
            anniversary: member.anniversary || 'N/A',
            hasBirthday: membersWithBirthdays.some((m: any) => m.id === member.id),
            hasAnniversary: membersWithAnniversaries.some((m: any) => m.id === member.id)
          };
        });
      
      setMembersWithEvents(uniqueMembers);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInitializeSheet = async () => {
    try {
      toast.info('Initializing Google Sheets...');
      const response = await fetch('/api/admin/initialize', { method: 'POST' });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to initialize Google Sheet');
      }
      
      toast.success('Google Sheet initialized successfully!');
    } catch (error) {
      console.error('Error initializing sheet:', error);
      toast.error('Failed to initialize Google Sheet');
    }
  };

  const handleSeedTestData = async () => {
    try {
      toast.info('Seeding test data...');
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to seed test data');
      }
      
      toast.success('Test data seeded successfully!');
      fetchStats(); // Refresh stats after seeding
    } catch (error) {
      console.error('Error seeding test data:', error);
      toast.error('Failed to seed test data');
    }
  };

  // Format date for better display
  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
      // Try various date formats
      let date;
      
      if (dateString.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = dateString.split('/');
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        date = new Date(dateString);
      } else {
        // Try direct parsing
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Add function to send event emails
  const handleSendEmail = async (memberId: string, hasBirthday: boolean, hasAnniversary: boolean) => {
    let toastId: string | number = '';
    
    try {
      let emailType: string;
      
      // Determine which email to send
      if (hasBirthday && hasAnniversary) {
        // If both, ask which one to send
        const userChoice = window.confirm(
          "This member has both a birthday and anniversary this month. Press OK to send birthday greetings or Cancel to send anniversary greetings."
        );
        emailType = userChoice ? 'birthday' : 'anniversary';
      } else if (hasBirthday) {
        emailType = 'birthday';
      } else if (hasAnniversary) {
        emailType = 'anniversary';
      } else {
        toast.error('No birthday or anniversary event found for this member.');
        return;
      }
      
      // Show loading toast
      toastId = toast.loading(`Sending ${emailType} email...`);
      
      console.log('Sending email request:', { memberId, emailType });
      
      const response = await fetch('/api/email/event-greetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          emailType,
        }),
      });
      
      // Parse the response
      const data = await response.json();
      console.log('Email API response:', data);
      
      // Dismiss the loading toast
      toast.dismiss(toastId);
      
      if (response.ok) {
        toast.success(data.message || `${emailType} email sent successfully`);
      } else {
        throw new Error(data.message || `Failed to send ${emailType} email`);
      }
    } catch (error) {
      // Dismiss the loading toast if it exists
      if (toastId) toast.dismiss(toastId);
      
      console.error('Error sending email:', error);
      
      // Display a more informative error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send email. Please try again later.';
        
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, session, router, fetchStats]);

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3">Admin Dashboard</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Members</h6>
                  <h2 className="display-5 fw-bold">{stats.totalMembers}</h2>
                </div>
                <div>
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
              </div>
              <Link href="/admin/members" className="text-white">
                <small>View all members <i className="bi bi-arrow-right"></i></small>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Birthdays This Month</h6>
                  <h2 className="display-5 fw-bold">{stats.currentMonthBirthdays}</h2>
                </div>
                <div>
                  <i className="bi bi-gift fs-1"></i>
                </div>
              </div>
              <span className="text-white">
                <small>Members with birthdays in {new Date().toLocaleDateString('en-US', { month: 'long' })}</small>
              </span>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Anniversaries This Month</h6>
                  <h2 className="display-5 fw-bold">{stats.currentMonthAnniversaries}</h2>
                </div>
                <div>
                  <i className="bi bi-calendar-heart fs-1"></i>
                </div>
              </div>
              <span className="text-white">
                <small>Members with anniversaries in {new Date().toLocaleDateString('en-US', { month: 'long' })}</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Members with Birthdays and Anniversaries Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Members with Events This Month</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Birthday</th>
                      <th>Anniversary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">No members with birthdays or anniversaries this month</td>
                      </tr>
                    ) : (
                      currentMembers.map((member, index) => (
                        <tr key={member.id}>
                          <td>{indexOfFirstMember + index + 1}</td>
                          <td>{member.name}</td>
                          <td>
                            {formatDate(member.birthday)}
                            {member.hasBirthday && (
                              <span className="badge bg-success ms-2">This Month</span>
                            )}
                          </td>
                          <td>
                            {formatDate(member.anniversary)}
                            {member.hasAnniversary && (
                              <span className="badge bg-danger ms-2">This Month</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title={`Send ${member.hasBirthday ? 'Birthday' : ''}${member.hasBirthday && member.hasAnniversary ? ' or ' : ''}${member.hasAnniversary ? 'Anniversary' : ''} Email`}
                              onClick={() => handleSendEmail(
                                member.id, 
                                member.hasBirthday, 
                                member.hasAnniversary
                              )}
                              disabled={!member.hasBirthday && !member.hasAnniversary}
                            >
                              <i className="bi bi-envelope"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {membersWithEvents.length > 0 && (
                <div className="card-footer bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">
                      Showing {indexOfFirstMember + 1} to {Math.min(indexOfLastMember, membersWithEvents.length)} of {membersWithEvents.length} members
                    </div>
                    <nav aria-label="Member events pagination">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {pageNumbers.map(number => (
                          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(number)}
                            >
                              {number}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 