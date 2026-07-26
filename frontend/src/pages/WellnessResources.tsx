import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { resourceService } from '../services/resource.service';
import { Loader2, ExternalLink } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  Article: { label: 'Articles & Guides', icon: '📖', bg: 'var(--primary-light)', color: 'var(--primary)' },
  SleepHygiene: { label: 'Sleep Hygiene', icon: '🌙', bg: 'var(--danger-light)', color: 'var(--danger)' },
  Exercise: { label: 'Exercise', icon: '🏃', bg: 'var(--success-light)', color: 'var(--success)' },
  Breathing: { label: 'Breathing Exercises', icon: '💨', bg: 'var(--warning-light)', color: 'var(--warning)' },
  Meditation: { label: 'Meditation', icon: '🧘', bg: 'var(--purple-light)', color: 'var(--purple)' },
  Counseling: { label: 'Counseling & Help', icon: '🤝', bg: 'var(--soft-fill)', color: 'var(--text-secondary)' },
};

const CATEGORY_ORDER = ['Article', 'SleepHygiene', 'Exercise', 'Breathing', 'Meditation', 'Counseling'];

const WellnessResources: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['resources', 'active'],
    queryFn: resourceService.getActive,
  });

  const resources = Array.isArray(data) ? data : [];

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: resources.filter((r: any) => r.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>
          Wellness Resource Center
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Articles, guides, and exercises to support your wellbeing
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : isError ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--danger)' }}>
          Failed to load resources. Please try again.
        </div>
      ) : grouped.length === 0 ? (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No resources available right now.</p>
        </Card>
      ) : (
        grouped.map(({ category, items }) => {
          const meta = CATEGORY_META[category] ?? { label: category, icon: '💡', bg: 'var(--soft-fill)', color: 'var(--text-secondary)' };
          const isPlaceholderMedia = category === 'Meditation' || category === 'Breathing';
          return (
            <div key={category} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>{meta.icon}</span>
                <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {meta.label}
                </h2>
              </div>
              {isPlaceholderMedia && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>
                  In-app audio playback and guided animations are not yet available — links currently point to external resources.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {items.map((item: any) => (
                  <Card key={item.resourceId} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: meta.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      {meta.icon}
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{item.description}</p>
                    {item.contentUrl && (
                        <a
                            href={item.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: meta.color,
                            }}
                        >
                            View resource <ExternalLink size={12} />
                        </a>
                        )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </PageWrapper>
  );
};

export default WellnessResources;