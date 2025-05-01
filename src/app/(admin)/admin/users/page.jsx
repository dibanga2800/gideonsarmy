'use client';

import React, { useState, useEffect } from 'react';
import UserList from '@/components/UserList';
import UserForm from '@/components/UserForm';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch all users on page load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user => 
        (user.name?.toLowerCase().includes(query)) ||
        user.email.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (formData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }
      
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      toast.success(`${newUser.email} added successfully`);
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleEditUser = async (formData) => {
    try {
      if (!selectedUser) return;
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const updatedUser = await response.json();
      
      setUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        )
      );
      
      toast.success(`${updatedUser.email} updated successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message);
    }
  };

  const openAddDialog = () => {
    setSelectedUser(null);
    setAddDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h1 className="h3">Manage Users</h1>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-primary" onClick={openAddDialog}>
            <i className="bi bi-person-plus me-2"></i>
            Add New User
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <UserList
          users={filteredUsers}
          onEdit={openEditDialog}
          onDelete={handleDeleteUser}
          currentUserId={session?.user?.id}
        />
      )}

      <UserForm
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddUser}
        isEditMode={false}
      />

      <UserForm
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditUser}
        initialData={selectedUser}
        isEditMode={true}
      />
    </div>
  );
} 