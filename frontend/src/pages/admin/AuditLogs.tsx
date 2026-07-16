import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { adminService } from '../../services/admin.service';

const AuditLogs: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
  });

  const logs = Array.isArray(data) ? data : [];

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const matchesUser = filter === 'all' || log.actorEmail === filter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesUser && matchesAction;
    });
  }, [logs, filter, actionFilter]);

  const exportCsv = () => {
    const rows = filteredLogs.map((log: any) => ({
      timestamp: new Date(log.createdDateTime).toISOString(),
      actor: log.actorEmail,
      action: log.action,
      entity: log.entityType,
      result: log.result,
      details: log.details ?? '',
    }));

    const csv = [
      ['Timestamp', 'Actor', 'Action', 'Entity', 'Result', 'Details'].join(','),
      ...rows.map((row) => [row.timestamp, row.actor, row.action, row.entity, row.result, row.details].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Audit Logs</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Complete record of all system actions · Retained for 90 days</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option value="all">All Users</option>
          {logs.map((log: any) => (
            <option key={log.logId} value={log.actorEmail}>{log.actorEmail}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option value="all">All Actions</option>
          {Array.from(new Set(logs.map((log: any) => log.action))).map((action: any) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <button onClick={exportCsv} style={{ backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px' }}>
          Export CSV
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--surface)', height: '40px' }}>
            <tr>
              {['Timestamp', 'Actor', 'Action', 'Entity', 'Result', 'Details'].map((th) => (
                <th key={th} style={{ padding: '0 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>Unable to load audit logs.</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit entries found.</td></tr>
            ) : filteredLogs.map((row: any) => (
              <tr key={row.logId} style={{ height: '48px', borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(row.createdDateTime).toLocaleString()}</td>
                <td style={{ padding: '0 18px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.actorEmail}</td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.action}</td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.entityType}</td>
                <td style={{ padding: '0 18px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: row.result === 'Failed' ? 'var(--danger)' : 'var(--success)' }}>{row.result}</span>
                </td>
                <td style={{ padding: '0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.details ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default AuditLogs;
