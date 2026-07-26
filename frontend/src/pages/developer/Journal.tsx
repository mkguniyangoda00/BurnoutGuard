import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { journalService } from '../../services/journal.service';
import type { JournalEntryPayload } from '../../services/journal.service';
import { Loader2 } from 'lucide-react';

const Journal: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<JournalEntryPayload>({
    reflectionText: '',
    stressTriggers: '',
    workChallenges: '',
    positiveEvents: '',
    copingStrategiesUsed: '',
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', 'history'],
    queryFn: journalService.getHistory,
  });

  const mutation = useMutation({
    mutationFn: () => journalService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'history'] });
      setFormData({
        reflectionText: '',
        stressTriggers: '',
        workChallenges: '',
        positiveEvents: '',
        copingStrategiesUsed: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reflectionText.trim()) return;
    mutation.mutate();
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: '14px 16px',
    backgroundColor: '#FBF7EE',
    border: '1px solid #EDE0C8',
    borderRadius: '14px',
    fontSize: '13.5px',
    fontFamily: "'DM Serif Display', Georgia, serif",
    lineHeight: 1.7,
    color: '#4A3F35',
    resize: 'vertical',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: '#5A4A3A', marginBottom: '6px' }}>
          🌿 Journal & Reflection
        </h1>
        <p style={{ fontSize: '13px', color: '#8A7B6C' }}>A private, quiet space to reflect on your day</p>
      </div>

      <Card style={{padding: '32px 36px',marginBottom: '24px',backgroundColor: '#FFFDF7',border: '1px solid #F0E6D2',borderRadius: '20px',boxShadow: '0 2px 12px rgba(180, 150, 100, 0.08)',}}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Reflection *</label>
            <textarea
              placeholder="How was your day? What's on your mind?"
              value={formData.reflectionText}
              onChange={(e) => setFormData({ ...formData, reflectionText: e.target.value })}
              style={textareaStyle}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4" style={{ marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Stress triggers (optional)</label>
              <textarea
                placeholder="What caused stress today?"
                value={formData.stressTriggers}
                onChange={(e) => setFormData({ ...formData, stressTriggers: e.target.value })}
                style={{ ...textareaStyle, minHeight: '60px' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Work challenges (optional)</label>
              <textarea
                placeholder="Any specific work challenges?"
                value={formData.workChallenges}
                onChange={(e) => setFormData({ ...formData, workChallenges: e.target.value })}
                style={{ ...textareaStyle, minHeight: '60px' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Positive events (optional)</label>
              <textarea
                placeholder="Anything good happen today?"
                value={formData.positiveEvents}
                onChange={(e) => setFormData({ ...formData, positiveEvents: e.target.value })}
                style={{ ...textareaStyle, minHeight: '60px' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Coping strategies used (optional)</label>
              <textarea
                placeholder="What helped you cope today?"
                value={formData.copingStrategiesUsed}
                onChange={(e) => setFormData({ ...formData, copingStrategiesUsed: e.target.value })}
                style={{ ...textareaStyle, minHeight: '60px' }}
              />
            </div>
          </div>

          <Button variant="primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Entry'}
          </Button>
        </form>
      </Card>

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600, marginBottom: '16px', color: '#5A4A3A' }}>Past Reflections</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading journal entries...
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No journal entries yet. Write your first reflection above.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map((entry: any) => (
            <Card key={entry.entryId} style={{padding: '22px 24px', backgroundColor: '#FFFDF7',border: '1px solid #F0E6D2',borderRadius: '16px',}}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {new Date(entry.entryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '8px' }}>{entry.reflectionText}</p>
              {entry.stressTriggers && <p style={{ fontSize: '12px', color: 'var(--danger)' }}><strong>Stress triggers:</strong> {entry.stressTriggers}</p>}
              {entry.workChallenges && <p style={{ fontSize: '12px', color: 'var(--warning)' }}><strong>Work challenges:</strong> {entry.workChallenges}</p>}
              {entry.positiveEvents && <p style={{ fontSize: '12px', color: 'var(--success)' }}><strong>Positive events:</strong> {entry.positiveEvents}</p>}
              {entry.copingStrategiesUsed && <p style={{ fontSize: '12px', color: 'var(--primary)' }}><strong>Coping strategies:</strong> {entry.copingStrategiesUsed}</p>}
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default Journal;