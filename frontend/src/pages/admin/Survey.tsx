import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { surveyService } from '../../services/survey.service';
import { Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const Survey: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ questionText: '', category: 'Sleep', type: 'Scale', scaleMax: 5 });

  const { data, isLoading } = useQuery({
    queryKey: ['survey', 'all'],
    queryFn: surveyService.getAll,
  });

  const questions = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: () => surveyService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', 'all'] });
      setForm({ questionText: '', category: 'Sleep', type: 'Scale', scaleMax: 5 });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => surveyService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', 'all'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => surveyService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', 'all'] }),
  });

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Survey Management</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage the question bank used in check-ins and research surveys.</p>
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Add new question</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
          <input
            placeholder="Question text"
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
          <input
            placeholder="Category (e.g. Sleep)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <option value="Scale">Scale</option>
            <option value="Boolean">Yes/No</option>
            <option value="Text">Free text</option>
          </select>
          {form.type === 'Scale' && (
            <input
              type="number"
              placeholder="Max"
              value={form.scaleMax}
              onChange={(e) => setForm({ ...form, scaleMax: parseInt(e.target.value) })}
              style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
          )}
          <Button
            variant="primary"
            disabled={!form.questionText.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Question bank ({questions.length})</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 className="animate-spin" size={18} /> Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No survey questions yet — add one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {questions.map((q: any) => (
              <div
                key={q.questionId}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px',
                  opacity: q.isActive ? 1 : 0.5,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{q.questionText}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.category} · {q.type}{q.scaleMax ? ` (1–${q.scaleMax})` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleMutation.mutate({ id: q.questionId, isActive: !q.isActive })} title={q.isActive ? 'Deactivate' : 'Activate'}>
                    {q.isActive ? <ToggleRight size={20} color="var(--success)" /> : <ToggleLeft size={20} color="var(--text-muted)" />}
                  </button>
                  <button onClick={() => deleteMutation.mutate(q.questionId)} title="Delete">
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  );
};

export default Survey;