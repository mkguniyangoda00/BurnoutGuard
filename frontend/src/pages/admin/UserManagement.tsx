/**
 * UserManagement.tsx (pages/admin/UserManagement.tsx)
 * 
 * Admin panel for managing all registered users.
 * 
 * DATA: Fetches from GET /api/admin/users (backend strips passwordHash).
 * ACTIONS:
 *   - Change Role  → PUT /api/admin/users/:id/role
 *   - Deactivate   → PUT /api/admin/users/:id/deactivate
 * 
 * WHY soft-delete (isActive flag) instead of hard DELETE:
 * For a research system, preserving historical data is essential.
 * If we hard-deleted a user, all their check-ins, predictions, and
 * SHAP explanations would be orphaned. Setting isActive = false keeps
 * all research data intact while preventing further access.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/admin.service';
import { Loader2, UserX, Edit2, Check, X } from 'lucide-react';

// Backend UserRole enum values (PascalCase)
const ROLES = ['Developer', 'Manager', 'HRofficer', 'Admin', 'ResearchAdmin'] as const;

/** Badge colours per role for quick visual scanning */
const ROLE_COLORS: Record<string, string> = {
  Developer: 'bg-blue-100 text-blue-700',
  Manager: 'bg-amber-100 text-amber-700',
  HRofficer: 'bg-purple-100 text-purple-700',
  Admin: 'bg-gray-800 text-white',
  ResearchAdmin: 'bg-gray-200 text-gray-700',
};

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  // ── Fetch all users from the backend ──────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.getAllUsers,
  });

  const users: any[] = data?.users ?? [];

  // ── Role change mutation ───────────────────────────────────────────────
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateRole(userId, role),
    onSuccess: () => {
      // Refetch the user list after role change
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditModalOpen(false);
    },
  });

  // ── Deactivate mutation (soft-delete) ─────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => adminService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeactivateModalOpen(false);
    },
  });

  // ── Filter users based on search input ───────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditModalOpen(true);
  };

  const openDeactivate = (user: any) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  return (
    <PageWrapper>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} registered · {users.filter((u) => u.isActive).length} active ·{' '}
            {users.filter((u) => !u.isActive).length} deactivated
          </p>
        </div>
      </div>

      {/* ── Search Filter ─────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* ── Users Table ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading users...
        </div>
      ) : isError ? (
        <div className="text-red-500 text-center py-10">
          Failed to load users. Please check your connection.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Company', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                // Compute avatar initials from full name
                const initials = user.fullName
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr key={user.userId} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* Edit role button */}
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Role"
                        >
                          <Edit2 size={14} />
                        </button>
                        {/* Deactivate button — only shown for active users */}
                        {user.isActive && (
                          <button
                            onClick={() => openDeactivate(user)}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Deactivate User"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Role Modal ───────────────────────────────────────────── */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card style={{ width: '400px', maxWidth: '90%', padding: '24px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Change Role</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Changing role for <strong>{selectedUser.fullName}</strong>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white mb-4"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={roleMutation.isPending}
                onClick={() => roleMutation.mutate({ userId: selectedUser.userId, role: newRole })}
              >
                {roleMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Save</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Deactivate Confirmation Modal ─────────────────────────────── */}
      {deactivateModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card style={{ width: '400px', maxWidth: '90%', padding: '24px', borderTop: '4px solid #EF4444' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Deactivate User?</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong>{selectedUser.fullName}</strong>? Their account will be
              suspended but all data is preserved for research integrity.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeactivateModalOpen(false)}>Cancel</Button>
              <button
                disabled={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate(selectedUser.userId)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {deactivateMutation.isPending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  'Yes, Deactivate'
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default UserManagement;
