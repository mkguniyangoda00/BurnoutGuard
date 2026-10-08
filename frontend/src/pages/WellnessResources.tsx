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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category] ?? { label: category, icon: '💡', bg: 'var(--soft-fill)', color: 'var(--text-secondary)' };
            const isPlaceholderMedia = category === 'Meditation' || category === 'Breathing';
            return (
              <Card key={category} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      {meta.label}
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {items.length} resource{items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {isPlaceholderMedia && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    In-app audio playback and guided animations are not yet available — links currently point to external resources.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {items.map((item: any, idx: number) => (
                    <div
                      key={item.resourceId}
                      style={{
                        padding: '12px 0',
                        borderTop: idx === 0 ? undefined : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {item.description}
                      </p>
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
                            marginTop: '2px',
                          }}
                        >
                          View resource <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
};

export default WellnessResources;
