import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCancelClick = (user: any) => {
    setSelectedUser(user);
    setIsCancelModalOpen(true);
  };

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>User Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>42 registered users · 38 active · 4 deactivated</p>
        </div>
        <button style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px', border: 'none' }}>
          Add User
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
        />
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>Role: All</option>
        </select>
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>Status: All</option>
        </select>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--background)', width: '100%', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--surface)', height: '40px' }}>
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(th => (
                <th key={th} style={{ padding: '0 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { in: 'MG', inBg: '#2F5FE0', name: 'Malithi Guniyangoda', email: 'malithi@dev.lk', role: 'Developer', roleClass: 'badge-primary', status: 'Active', statusClass: 'badge-success', login: 'Today 09:14' },
              { in: 'PJ', inBg: '#D97706', name: 'Pasan Jayawardena', email: 'pasan@dev.lk', role: 'Team Lead', roleClass: 'badge-warning', status: 'Active', statusClass: 'badge-success', login: 'Yesterday' },
              { in: 'NK', inBg: '#534AB7', name: 'Nadeesha Kumari', email: 'nadeesha@hr.lk', role: 'HR Officer', roleClass: 'badge-purple', status: 'Active', statusClass: 'badge-success', login: '2 days ago' },
              { in: 'AR', inBg: '#2F5FE0', name: 'Ashen Rathnayake', email: 'ashen@dev.lk', role: 'Developer', roleClass: 'badge-primary', status: 'Active', statusClass: 'badge-success', login: '3 days ago' },
              { in: 'SM', inBg: '#0F1117', name: 'Sachini Mendis', email: 'sachini@admin.lk', role: 'Admin', roleClass: 'badge-dark', status: 'Active', statusClass: 'badge-success', login: 'Today 11:30' },
              { in: 'DW', inBg: '#2F5FE0', name: 'Dinuka Weerasinghe', email: 'dinuka@dev.lk', role: 'Developer', roleClass: 'badge-primary', status: 'Inactive', statusClass: 'badge-danger', login: '2 weeks ago' },
              { in: 'RK', inBg: '#7B7E8C', name: 'Ravindu Karunarathne', email: 'ravindu@research.lk', role: 'Research Admin', roleClass: 'badge-muted', status: 'Active', statusClass: 'badge-success', login: 'Today 08:45' },
            ].map((row, idx) => (
              <tr key={idx} style={{ height: '52px', borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: row.inBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>{row.in}</div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</span>
                  </div>
                </td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.email}</td>
                <td style={{ padding: '0 18px' }}>
                  <span className={`badge ${row.roleClass}`} style={row.roleClass === 'badge-dark' ? { backgroundColor: '#0F1117', color: 'white' } : {}}>{row.role}</span>
                </td>
                <td style={{ padding: '0 18px' }}>
                  <span className={`badge ${row.statusClass}`}>{row.status}</span>
                </td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.login}</td>
                <td style={{ padding: '0 18px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      onClick={() => handleEditClick(row)}
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    <button 
                      style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      onClick={() => handleCancelClick(row)}
                      title="Deactivate User"
                    >
                      🚫
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing 1–7 of 42 users</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--background)' }}>Prev</button>
          <button style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--primary)', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>1</button>
          <button style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--background)' }}>2</button>
          <button style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--background)' }}>Next</button>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Edit User</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Name</label>
                <input type="text" defaultValue={selectedUser.name} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Role</label>
                <select defaultValue={selectedUser.role} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <option value="Developer">Developer</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="Admin">Admin</option>
                  <option value="Research Admin">Research Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setIsEditModalOpen(false)}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel/Deactivate Confirmation Modal */}
      {isCancelModalOpen && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px', maxWidth: '90%', borderTop: '4px solid var(--danger)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Deactivate User?</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong>{selectedUser.name}</strong>? They will no longer be able to log in to BurnoutGuard. This action can be reversed later.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>Cancel</Button>
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Yes, Deactivate
              </button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default UserManagement;
