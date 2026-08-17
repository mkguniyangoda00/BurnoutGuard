import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/admin.service';
import { Loader2, UserX, Edit2, Check, X } from 'lucide-react';

const ROLES = ['Developer', 'Manager', 'HRofficer', 'Admin', 'ResearchAdmin'] as const;
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.getUsers,
  });

  const users: any[] = Array.isArray(data) ? data : [];

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => adminService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditModalOpen(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => adminService.deactivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeactivateModalOpen(false);
    },
  });

  const filteredUsers = users.filter(
    (u) => u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>User Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {users.length} registered · {users.filter((u) => u.isActive).length} active · {users.filter((u) => !u.isActive).length} deactivated
          </p>
        </div>
      </div>

      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }}
        />
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={20} />
          <span>Loading users...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--danger)' }}>
          <UserX size={20} />
          <span>Failed to load users. Please check your connection.</span>
        </div>
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <table className="w-full text-left border-collapse">
            <thead style={{ background: 'var(--surface)' }}>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Company', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={user.userId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)', color: 'white' }}>{initials}</div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{user.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</td>
                    <td style={{ padding: '14px 18px' }}><span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>{user.role}</span></td>
                    <td style={{ padding: '14px 18px' }}><span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)' }}>{user.company ?? '—'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedUser(user); setNewRole(user.role); setEditModalOpen(true); }} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)' }}><Edit2 size={14} /></button>
                        {user.isActive && <button onClick={() => { setSelectedUser(user); setDeactivateModalOpen(true); }} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)' }}><UserX size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card style={{ width: '400px', maxWidth: '90%', padding: '24px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Change Role</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Changing role for <strong>{selectedUser.fullName}</strong></p>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-3 py-2 text-sm outline-none" style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={roleMutation.isPending} onClick={() => roleMutation.mutate({ userId: selectedUser.userId, role: newRole })}>
                {roleMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Save</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {deactivateModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card style={{ width: '400px', maxWidth: '90%', padding: '24px', borderTop: '4px solid var(--danger)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Deactivate User?</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to deactivate <strong>{selectedUser.fullName}</strong>? Their account will be suspended but all data is preserved for research integrity.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeactivateModalOpen(false)}>Cancel</Button>
              <button disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(selectedUser.userId)} style={{ padding: '10px 16px', background: 'var(--danger)', color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: 500, opacity: deactivateMutation.isPending ? 0.6 : 1 }}>
                {deactivateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Yes, Deactivate'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default UserManagement;
