import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { journalService } from '../../services/journal.service';
import { Loader2, Sparkles, Zap, Briefcase, Sun, Shield, CheckCircle2, BookHeart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FIELD_META = [
  {
    key: 'stressTriggers',
    labelKey: 'stressTriggers',
    placeholderKey: 'stressTriggersPlaceholder',
    icon: Zap,
    color: 'var(--danger)',
  },
  {
    key: 'workChallenges',
    labelKey: 'workChallenges',
    placeholderKey: 'workChallengesPlaceholder',
    icon: Briefcase,
    color: 'var(--warning)',
  },
  {
    key: 'positiveEvents',
    labelKey: 'positiveEvents',
    placeholderKey: 'positiveEventsPlaceholder',
    icon: Sun,
    color: 'var(--success)',
  },
  {
    key: 'copingStrategiesUsed',
    labelKey: 'copingStrategies',
    placeholderKey: 'copingStrategiesPlaceholder',
    icon: Shield,
    color: 'var(--primary)',
  },
] as const;

const Journal: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    reflectionText: '',
    stressTriggers: '',
    workChallenges: '',
    positiveEvents: '',
    copingStrategiesUsed: '',
  });

  const [justSaved, setJustSaved] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', 'history'],
    queryFn: journalService.getHistory,
  });

  const mutation = useMutation({
    mutationFn: () => journalService.create(formData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['journal', 'history'],
      });

      setFormData({
        reflectionText: '',
        stressTriggers: '',
        workChallenges: '',
        positiveEvents: '',
        copingStrategiesUsed: '',
      });

      setJustSaved(true);

      setTimeout(() => {
        setJustSaved(false);
      }, 2500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reflectionText.trim()) return;

    mutation.mutate();
  };

  return (
    <PageWrapper>

      {/* ── Header ── */}
      <div
        style={{
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #1B8C6E 0%, #2F5FE0 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookHeart size={26} />
        </div>

        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '24px',
              marginBottom: '4px',
              color: '#fff',
            }}
          >
            🌿 {t('journal.title')}
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {t('journal.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Entry form ── */}
      <Card
        style={{
          padding: '28px 32px',
          marginBottom: '24px',
          borderRadius: '20px',
        }}
      >
        <form onSubmit={handleSubmit}>

          {/* Reflection */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Sparkles
                size={13}
                style={{ color: 'var(--primary)' }}
              />

              {t('journal.reflection')} *
            </label>

            <textarea
              placeholder={t('journal.reflectionPlaceholder')}
              value={formData.reflectionText}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reflectionText: e.target.value,
                })
              }
              required
              style={{
                width: '100%',
                minHeight: '110px',
                padding: '16px 18px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Optional fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '22px',
            }}
          >
            {FIELD_META.map(
              ({
                key,
                labelKey,
                placeholderKey,
                icon: Icon,
                color,
              }) => (
                <div key={key}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <Icon
                      size={12}
                      style={{ color }}
                    />

                    {t(`journal.${labelKey}`)}

                    <span
                      style={{
                        fontWeight: 400,
                        opacity: 0.6,
                      }}
                    >
                      ({t('journal.optional')})
                    </span>
                  </label>

                  <textarea
                    placeholder={t(`journal.${placeholderKey}`)}
                    value={(formData as any)[key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [key]: e.target.value,
                      })
                    }
                    style={{
                      width: '100%',
                      minHeight: '68px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )
            )}
          </div>

          {/* Save button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Button
              variant="primary"
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: '11px 22px',
              }}
            >
              {mutation.isPending ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Loader2
                    className="animate-spin"
                    size={14}
                  />

                  {t('journal.saving')}
                </span>
              ) : (
                t('journal.save')
              )}
            </Button>

            {justSaved && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--success)',
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={15} />

                {t('journal.entrySaved')}
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* ── Past reflections ── */}
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '16px',
          color: 'var(--text-primary)',
        }}
      >
        {t('journal.pastReflections')}
      </h2>

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '40px 0',
            color: 'var(--text-muted)',
          }}
        >
          <Loader2
            className="animate-spin"
            size={18}
          />

          {t('journal.loadingEntries')}
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card
          style={{
            padding: '32px',
            textAlign: 'center',
            borderRadius: '18px',
          }}
        >
          <BookHeart
            size={30}
            style={{
              color: 'var(--text-muted)',
              opacity: 0.4,
              marginBottom: 10,
            }}
          />

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            {t('journal.empty')}
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {entries.map((entry: any) => (
            <Card
              key={entry.entryId}
              style={{
                padding: '22px 26px',
                borderRadius: '18px',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {new Date(entry.entryDate).toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )}
              </p>

              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.7,
                  marginBottom: '14px',
                }}
              >
                {entry.reflectionText}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {entry.stressTriggers && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: 'var(--danger-light)',
                      color: 'var(--danger)',
                    }}
                  >
                    {t('journal.stress')}: {entry.stressTriggers}
                  </span>
                )}

                {entry.workChallenges && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: 'var(--warning-light)',
                      color: 'var(--warning)',
                    }}
                  >
                    {t('journal.work')}: {entry.workChallenges}
                  </span>
                )}

                {entry.positiveEvents && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                    }}
                  >
                    {t('journal.positive')}: {entry.positiveEvents}
                  </span>
                )}

                {entry.copingStrategiesUsed && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}
                  >
                    {t('journal.coping')}: {entry.copingStrategiesUsed}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default Journal;