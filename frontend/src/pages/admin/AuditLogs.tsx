import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const AuditLogs: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Audit Logs</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Complete record of all system actions · Retained for 90 days</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value="01 Apr 2026 – 30 Apr 2026" 
          readOnly
          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
        />
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>All Users</option>
        </select>
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>All Actions</option>
        </select>
        <button style={{ backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px' }}>
          Export CSV
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--surface)', height: '40px' }}>
            <tr>
              {['Timestamp', 'Actor', 'Action', 'Entity', 'IP Address', 'Result'].map(th => (
                <th key={th} style={{ padding: '0 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { time: 'Today 11:45:02', actor: 'Sachini Mendis', action: 'LOGIN', actionClass: 'badge-success', entity: 'User account', ip: '192.168.1.42', result: 'Success', resultClass: 'badge-success' },
              { time: 'Today 11:30:18', actor: 'Sachini Mendis', action: 'ROLE CHANGE', actionClass: 'badge-purple', entity: 'User: Ravindu K.', ip: '192.168.1.42', result: 'Success', resultClass: 'badge-success' },
              { time: 'Today 10:15:44', actor: 'Malithi Guniyangoda', action: 'CHECK-IN', actionClass: 'badge-primary', entity: 'CheckIn #2241', ip: '10.0.0.15', result: 'Success', resultClass: 'badge-success' },
              { time: 'Today 09:58:31', actor: 'System', action: 'PREDICTION', actionClass: 'badge-warning', entity: 'Prediction #881', ip: 'Internal', result: 'Success', resultClass: 'badge-success' },
              { time: 'Today 09:14:02', actor: 'Malithi Guniyangoda', action: 'LOGIN', actionClass: 'badge-success', entity: 'User account', ip: '10.0.0.15', result: 'Success', resultClass: 'badge-success' },
              { time: 'Yesterday 23:59:00', actor: 'System', action: 'WEEKLY REPORT', actionClass: 'badge-muted', entity: 'All users', ip: 'Internal', result: 'Success', resultClass: 'badge-success' },
              { time: 'Yesterday 18:32:10', actor: 'Pasan Jayawardena', action: 'EXPORT', actionClass: 'badge-warning', entity: 'Team Report PDF', ip: '10.0.0.22', result: 'Success', resultClass: 'badge-success' },
              { time: 'Yesterday 14:20:55', actor: 'Unknown', action: 'LOGIN', actionClass: 'badge-danger', entity: 'User account', ip: '41.89.12.5', result: 'Failed', resultClass: 'badge-danger' },
            ].map((row, idx) => (
              <tr key={idx} style={{ height: '48px', borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.time}</td>
                <td style={{ padding: '0 18px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.actor}</td>
                <td style={{ padding: '0 18px' }}>
                  <span className={`badge ${row.actionClass}`}>{row.action}</span>
                </td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.entity}</td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.ip}</td>
                <td style={{ padding: '0 18px' }}>
                  <span className={`badge ${row.resultClass}`}>{row.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default AuditLogs;
