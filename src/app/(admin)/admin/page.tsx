'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

// Define interface for member with events
interface MemberWithEvents {
  id: string;
  name: string;
  email: string;
  birthday: string;
  anniversary: string;
  hasBirthday: boolean;
  hasAnniversary: boolean;
  joinDate: string;
  memberStatus: string;
}

// Define interface for dashboard stats
interface DashboardStats {
  totalMembers: number;
  totalUsers: number;
  activeMembers: number;
  currentMonthBirthdays: number;
  currentMonthAnniversaries: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalUsers: 0,
    activeMembers: 0,
    currentMonthBirthdays: 0,
    currentMonthAnniversaries: 0
  });
  const [membersWithEvents, setMembersWithEvents] = useState<MemberWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Function to check if a date is in current month
  const isCurrentMonth = (dateString: string): boolean => {
    if (!dateString || dateString.trim() === '' || dateString === 'N/A') return false;
    
    const currentMonth = new Date().getMonth() + 1; // 1-based month
    const currentYear = new Date().getFullYear();
    let dateMonth: number;
    let dateYear: number;
    
    try {
      // Handle various date formats
      if (dateString.includes('/')) {
        // Handle dd/mm/yyyy format
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          dateMonth = parseInt(month, 10);
          dateYear = parseInt(year, 10);
        } else {
          console.warn('Invalid dd/mm/yyyy format:', dateString);
          return false;
        }
      } else if (dateString.includes('-')) {
        // Handle yyyy-mm-dd format (converting from Google Sheets)
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          dateYear = parseInt(year, 10);
          dateMonth = parseInt(month, 10);
        } else {
          console.warn('Invalid yyyy-mm-dd format:', dateString);
          return false;
        }
      } else {
        console.warn('Unrecognized date format:', dateString);
        return false;
      }
      
      // Validate month and year
      if (isNaN(dateMonth) || isNaN(dateYear) || dateMonth < 1 || dateMonth > 12) {
        console.warn('Invalid month or year:', { dateString, dateMonth, dateYear });
        return false;
      }
      
      // Check if it's current month (ignore year for birthday/anniversary checking)
      const isMatch = dateMonth === currentMonth;
      
      // Debug logging for date checking
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 Date check: "${dateString}" -> month: ${dateMonth}, current month: ${currentMonth}, match: ${isMatch ? '✅' : '❌'}`);
      }
      
      return isMatch;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return false;
    }
  };

  // Fetch stats and members with events
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch members and users in parallel
      const [membersResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/members'),
        fetch('/api/users')
      ]);
      
      if (!membersResponse.ok) {
        throw new Error(`Failed to fetch members: ${membersResponse.status}`);
      }
      
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const members = await membersResponse.json();
      const users = await usersResponse.json();
      
      // Calculate stats
      const activeMembers = members.filter((m: any) => m.status?.toLowerCase() === 'active').length;
      const currentMonthBirthdays = members.filter((m: any) => isCurrentMonth(m.birthday)).length;
      const currentMonthAnniversaries = members.filter((m: any) => isCurrentMonth(m.anniversary)).length;
      
      setStats({
        totalMembers: members.length,
        totalUsers: users.length,
        activeMembers,
        currentMonthBirthdays,
        currentMonthAnniversaries
      });
      
      // Get members with events this month
      const membersWithCurrentEvents = members.filter((m: any) => 
        isCurrentMonth(m.birthday) || isCurrentMonth(m.anniversary)
      ).map((m: any) => ({
        ...m,
        hasBirthday: isCurrentMonth(m.birthday),
        hasAnniversary: isCurrentMonth(m.anniversary)
      }));
      
      setMembersWithEvents(membersWithCurrentEvents);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data function
  const refreshData = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  // Fix sheet formatting function
  const fixSheetFormatting = async () => {
    try {
      toast.info('Fixing Google Sheets formatting...');
      
      const response = await fetch('/api/admin/fix-formatting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`✅ ${data.message}. Fixed ${data.rowsFixed} rows.`);
        // Refresh the dashboard data after fixing
        await fetchStats();
      } else {
        throw new Error(data.error || 'Failed to fix sheet formatting');
      }
    } catch (error) {
      console.error('Error fixing sheet formatting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fix sheet formatting');
    }
  };

  // Format date for better display
  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
      let date: Date;
      
      if (dateString.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = dateString.split('/');
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        date = new Date(dateString);
      } else {
        return dateString;
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
      
      toastId = toast.loading(`Sending ${emailType} email...`);
      
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
      
      const data = await response.json();
      toast.dismiss(toastId);
      
      if (response.ok) {
        toast.success(data.message || `${emailType} email sent successfully`);
      } else {
        throw new Error(data.message || `Failed to send ${emailType} email`);
      }
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error('Error sending email:', error);
      
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
          <p className="text-muted">Manage members with birthdays and anniversaries this month</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Members</h6>
                  <h2 className="display-6 fw-bold">{stats.totalMembers}</h2>
                </div>
                <div>
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
              </div>
              <Link href="/admin/members" className="text-white text-decoration-none">
                <small>View all members <i className="bi bi-arrow-right"></i></small>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Active Members</h6>
                  <h2 className="display-6 fw-bold">{stats.activeMembers}</h2>
                </div>
                <div>
                  <i className="bi bi-person-check-fill fs-1"></i>
                </div>
              </div>
              <small>Members with active status</small>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Birthdays This Month</h6>
                  <h2 className="display-6 fw-bold">{stats.currentMonthBirthdays}</h2>
                </div>
                <div>
                  <i className="bi bi-gift fs-1"></i>
                </div>
              </div>
              <small>Birthdays in {new Date().toLocaleDateString('en-US', { month: 'long' })}</small>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Anniversaries This Month</h6>
                  <h2 className="display-6 fw-bold">{stats.currentMonthAnniversaries}</h2>
                </div>
                <div>
                  <i className="bi bi-calendar-heart fs-1"></i>
                </div>
              </div>
              <small>Anniversaries in {new Date().toLocaleDateString('en-US', { month: 'long' })}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Members with Events This Month Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                Members with Events This Month ({membersWithEvents.length})
              </h5>
              <span className="badge bg-secondary">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Birthday</th>
                      <th>Anniversary</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="text-muted">
                            <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                            No members with birthdays or anniversaries this month
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentMembers.map((member, index) => (
                        <tr key={member.id}>
                          <td>{indexOfFirstMember + index + 1}</td>
                          <td>
                            <strong>{member.name}</strong>
                            <br />
                            <small className="text-muted">Joined: {formatDate(member.joinDate)}</small>
                          </td>
                          <td>{member.email}</td>
                          <td>
                            {formatDate(member.birthday)}
                            {member.hasBirthday && (
                              <span className="badge bg-success ms-2">This Month!</span>
                            )}
                          </td>
                          <td>
                            {formatDate(member.anniversary)}
                            {member.hasAnniversary && (
                              <span className="badge bg-danger ms-2">This Month!</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              member.memberStatus === 'active' ? 'bg-success' : 'bg-secondary'
                            }`}>
                              {member.memberStatus}
                            </span>
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
              {membersWithEvents.length > membersPerPage && (
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

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-2">
                  <Link href="/admin/members" className="btn btn-outline-primary w-100">
                    <i className="bi bi-people me-2"></i>
                    Manage All Members
                  </Link>
                </div>
                <div className="col-md-6 mb-2">
                  <Link href="/admin/users" className="btn btn-outline-secondary w-100">
                    <i className="bi bi-person-gear me-2"></i>
                    Manage Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 