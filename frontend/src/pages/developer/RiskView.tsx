import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrediction } from '../../hooks/usePrediction';
import { CounterfactualCard } from '../../components/predictions/CounterfactualCard';
import { useTranslation } from 'react-i18next';

const RiskView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    prediction,
    isLoading,
    isError,
    isEmpty,
  } = usePrediction();

  if (isLoading) {
    return (
      <PageWrapper>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </PageWrapper>
    );
  }

  if (isError || isEmpty) {
    return (
      <PageWrapper>
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <HelpCircle
            size={48}
            style={{
              color: 'var(--text-muted)',
              marginBottom: '16px',
              opacity: 0.5,
            }}
          />

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            {t('myRisk.noPrediction')}
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              maxWidth: '400px',
              margin: '0 auto 20px',
            }}
          >
            {t('myRisk.noPredictionBody')}
          </p>

          <Button
            variant="primary"
            onClick={() => navigate('/developer/check-in')}
          >
            {t('myRisk.submitCheckIn')}
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const riskDrivers =
    prediction.shapExplanations
      ?.filter((s: any) => s.direction === 'IncreasesRisk')
      ?.sort((a: any, b: any) => b.shapValue - a.shapValue) ?? [];

  const riskMitigators =
    prediction.shapExplanations
      ?.filter((s: any) => s.direction === 'DecreasesRisk')
      ?.sort((a: any, b: any) => a.shapValue - b.shapValue) ?? [];

  const getFeatureName = (featureName: string) => {
    return featureName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase();
  };

  const getPlainLanguageExplanation = () => {
    if (riskDrivers.length === 0 && riskMitigators.length === 0) {
      return t('myRisk.stableSummary');
    }

    let text = '';

    if (riskDrivers.length > 0) {
      const topDriver = getFeatureName(riskDrivers[0].featureName);

      text += t('myRisk.riskDriverSummary', {
        feature: topDriver,
      });

      if (riskDrivers[1]) {
        const secondDriver = getFeatureName(riskDrivers[1].featureName);

        text += t('myRisk.secondRiskDriverSummary', {
          feature: secondDriver,
        });
      }
    } else {
      text += t('myRisk.noRiskFactorsSummary');
    }

    if (riskMitigators.length > 0) {
      const topMitigator = getFeatureName(
        riskMitigators[0].featureName
      );

      text += t('myRisk.protectiveSummary', {
        feature: topMitigator,
      });
    }

    return text;
  };

  const RISK_CARD_STYLES: Record<
    string,
    {
      bg: string;
      border: string;
      color: string;
    }
  > = {
    Low: {
      bg: 'var(--success-light)',
      border: 'var(--success)',
      color: 'var(--success)',
    },
    Moderate: {
      bg: 'var(--warning-light)',
      border: 'var(--warning)',
      color: 'var(--warning)',
    },
    High: {
      bg: 'var(--warning-light)',
      border: '#EA580C',
      color: '#EA580C',
    },
    Critical: {
      bg: 'var(--danger-light)',
      border: 'var(--danger)',
      color: 'var(--danger)',
    },
  };

  const riskStyle =
    RISK_CARD_STYLES[prediction.riskLevel] ??
    RISK_CARD_STYLES.Moderate;

  const TREND_STYLES: Record<
    string,
    {
      bg: string;
      border: string;
      color: string;
    }
  > = {
    Improving: {
      bg: 'var(--success-light)',
      border: 'var(--success)',
      color: 'var(--success)',
    },
    Worsening: {
      bg: 'var(--danger-light)',
      border: 'var(--danger)',
      color: 'var(--danger)',
    },
    Stable: {
      bg: 'var(--soft-fill)',
      border: 'var(--border)',
      color: 'var(--text-secondary)',
    },
  };

  const trendStyle =
    TREND_STYLES[prediction.trendDirection] ??
    TREND_STYLES.Stable;

  const getTrendLabel = () => {
    switch (prediction.trendDirection) {
      case 'Improving':
        return `↓ ${t('myRisk.improving')}`;

      case 'Worsening':
        return `↑ ${t('myRisk.worsening')}`;

      case 'Stable':
      default:
        return t('myRisk.stableWithArrow');
    }
  };

  const dataCompleteness =
    prediction.dataCompletenessScore !== null
      ? prediction.dataCompletenessScore.toFixed(0)
      : null;

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '22px',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          {t('myRisk.title')}
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          {t('myRisk.subtitle')}
        </p>
      </div>

      {dataCompleteness !== null && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor:
              prediction.dataCompletenessScore >= 70
                ? 'var(--success-light)'
                : 'var(--warning-light)',
            color:
              prediction.dataCompletenessScore >= 70
                ? 'var(--success)'
                : 'var(--warning)',
            border: `1px solid ${
              prediction.dataCompletenessScore >= 70
                ? 'var(--success)'
                : 'var(--warning)'
            }`,
          }}
        >
          {prediction.dataCompletenessScore >= 70
            ? t('myRisk.dataCompletenessMessage', {
                value: dataCompleteness,
              })
            : t('myRisk.lowConfidenceMessage', {
                value: dataCompleteness,
              })}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <Card
          style={{
            padding: '20px',
            backgroundColor: riskStyle.bg,
            border: `1px solid ${riskStyle.border}`,
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            {t('myRisk.riskLevel')}
          </h3>

          <p
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: riskStyle.color,
            }}
          >
            {prediction.riskLevel}
          </p>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}
          >
            {(prediction.riskScore * 100).toFixed(0)}%{' '}
            {t('myRisk.riskLabel')}
          </p>
        </Card>

        <Card
          style={{
            padding: '20px',
            backgroundColor: trendStyle.bg,
            border: `1px solid ${trendStyle.border}`,
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            {t('myRisk.trend')}
          </h3>

          <p
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: trendStyle.color,
            }}
          >
            {getTrendLabel()}
          </p>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}
          >
            {t('dashboard.today')}
          </p>
        </Card>
      </div>

      {prediction.modelVersion === 'fallback' && (
        <div
          style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {t('myRisk.fallbackWarning')}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        <Card style={{ padding: '20px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            {t('myRisk.positiveFactors')}
          </h3>

          {riskMitigators.length > 0 ? (
            <ul
              style={{
                paddingLeft: '20px',
                color: 'var(--success)',
                fontSize: '13px',
              }}
            >
              {riskMitigators.slice(0, 2).map((factor: any) => (
                <li key={factor.shapId}>
                  {factor.plainLanguageText}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {t('explanation.noProtective')}
            </p>
          )}
        </Card>

        <Card style={{ padding: '20px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            {t('myRisk.riskAreas')}
          </h3>

          {riskDrivers.length > 0 ? (
            <ul
              style={{
                paddingLeft: '20px',
                color: 'var(--danger)',
                fontSize: '13px',
              }}
            >
              {riskDrivers.slice(0, 2).map((factor: any) => (
                <li key={factor.shapId}>
                  {factor.plainLanguageText}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {t('explanation.noRiskAreas')}
            </p>
          )}
        </Card>
      </div>

      <Card
        style={{
          padding: '24px',
          marginTop: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          {t('myRisk.summary')}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
          }}
        >
          {getPlainLanguageExplanation()}
        </p>
      </Card>

      <div style={{ marginTop: '16px' }}>
        <CounterfactualCard />
      </div>
    </PageWrapper>
  );
};

export default RiskView;
