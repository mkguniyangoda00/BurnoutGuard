import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Loader2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { usePrediction } from '../../hooks/usePrediction';
import { CounterfactualCard } from '../../components/predictions/CounterfactualCard';
import { useTranslation } from 'react-i18next';

const Explanation: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    prediction,
    dimensionBreakdown,
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
          <Loader2
            className="animate-spin text-primary"
            size={40}
          />
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
            {t('explanation.noPrediction')}
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              maxWidth: '400px',
              margin: '0 auto 20px',
            }}
          >
            {t('explanation.noPredictionBody')}
          </p>

          <Button
            variant="primary"
            onClick={() => navigate('/developer/check-in')}
          >
            {t('explanation.submitCheckIn')}
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
      .trim();
  };

  const getPlainLanguageExplanation = () => {
    if (
      riskDrivers.length === 0 &&
      riskMitigators.length === 0
    ) {
      return t('explanation.stableSummary');
    }

    let text = '';

    if (riskDrivers.length > 0) {
      const topDriver = getFeatureName(
        riskDrivers[0].featureName
      );

      text += t('explanation.riskDriverSummary', {
        feature: topDriver.toLowerCase(),
      });

      if (riskDrivers[1]) {
        const secondDriver = getFeatureName(
          riskDrivers[1].featureName
        );

        text += t('explanation.secondRiskDriverSummary', {
          feature: secondDriver.toLowerCase(),
        });
      }
    } else {
      text += t('explanation.noRiskFactorsSummary');
    }

    if (riskMitigators.length > 0) {
      const topMitigator = getFeatureName(
        riskMitigators[0].featureName
      );

      text += t('explanation.protectiveSummary', {
        feature: topMitigator.toLowerCase(),
      });
    }

    return text;
  };

  const allFactors = [
    ...riskDrivers,
    ...riskMitigators,
  ];

  const rawMaxImpact =
    allFactors.length > 0
      ? Math.max(
          ...allFactors.map((f: any) =>
            Math.abs(f.shapValue)
          )
        )
      : 1;

  const maxImpact =
    rawMaxImpact > 0 ? rawMaxImpact : 1;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return '#DC2626';

      case 'High':
        return '#F97316';

      case 'Moderate':
        return '#EAB308';

      case 'Low':
        return '#1B8C6E';

      default:
        return 'var(--primary)';
    }
  };

  const getTrendLabel = () => {
    switch (prediction.trendDirection) {
      case 'Improving':
        return t('explanation.improving');

      case 'Worsening':
        return t('explanation.worsening');

      case 'Stable':
      default:
        return t('explanation.stable');
    }
  };

  const checkInsUsed = prediction.checkInsUsed || 1;

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          {t('explanation.title')}
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          {t('explanation.subtitle')}
        </p>
      </div>

      {/* Risk Score Hero Card */}
      <Card
        style={{
          padding: '32px 28px',
          marginBottom: '32px',
          background: `linear-gradient(135deg, ${getRiskColor(
            prediction.riskLevel
          )} 0%, ${getRiskColor(
            prediction.riskLevel
          )}22 100%)`,
          border: `2px solid ${getRiskColor(
            prediction.riskLevel
          )}33`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          {/* Risk Score Circle */}
          <div
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
            }}
          >
            <svg
              width="120"
              height="120"
              style={{
                transform: 'rotate(-90deg)',
              }}
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />

              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getRiskColor(
                  prediction.riskLevel
                )}
                strokeWidth="8"
                strokeDasharray={`${
                  prediction.riskScore * 100 * Math.PI
                } ${314.159}`}
                strokeLinecap="round"
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform:
                  'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: getRiskColor(
                    prediction.riskLevel
                  ),
                }}
              >
                {(prediction.riskScore * 100).toFixed(0)}%
              </p>

              <p
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                }}
              >
                {t('explanation.risk')}
              </p>
            </div>
          </div>

          {/* Risk Details */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.75)',
                  marginBottom: '4px',
                }}
              >
                {t('explanation.riskLevel')}
              </p>

              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: getRiskColor(
                    prediction.riskLevel
                  ),
                }}
              >
                {prediction.riskLevel}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
              }}
            >
              {/* Trend */}
              <div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.75)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {t('explanation.trend')}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {prediction.trendDirection ===
                    'Improving' && (
                    <>
                      <TrendingDown
                        size={18}
                        style={{
                          color: 'var(--success)',
                        }}
                      />

                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--success)',
                        }}
                      >
                        {getTrendLabel()}
                      </span>
                    </>
                  )}

                  {prediction.trendDirection ===
                    'Worsening' && (
                    <>
                      <TrendingUp
                        size={18}
                        style={{
                          color: 'var(--danger)',
                        }}
                      />

                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--danger)',
                        }}
                      >
                        {getTrendLabel()}
                      </span>
                    </>
                  )}

                  {prediction.trendDirection ===
                    'Stable' && (
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      → {getTrendLabel()}
                    </span>
                  )}
                </div>
              </div>

              {/* Data Points */}
              <div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.75)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {t('explanation.dataPoints')}
                </p>

                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {t(
                    checkInsUsed === 1
                      ? 'explanation.checkIn_one'
                      : 'explanation.checkIn_other',
                    {
                      count: checkInsUsed,
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Burnout Dimension Breakdown */}
      {dimensionBreakdown?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              🧭 {t('explanation.dimensionBreakdown')}
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {t('explanation.dimensionSubtitle')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[...dimensionBreakdown]
              .sort(
                (a: any, b: any) =>
                  b.normalizedPct -
                  a.normalizedPct
              )
              .map((dim: any, idx: number) => {
                const isTop = idx === 0;

                const barColor =
                  dim.score > 0
                    ? 'var(--danger)'
                    : 'var(--success)';

                return (
                  <Card
                    key={dim.dimension}
                    style={{
                      padding: '18px',
                      border: isTop
                        ? `2px solid ${barColor}`
                        : '1px solid var(--border)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        textTransform:
                          'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px',
                      }}
                    >
                      {dim.label}
                    </p>

                    <p
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: barColor,
                        marginBottom: '10px',
                      }}
                    >
                      {dim.normalizedPct}%
                    </p>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor:
                          'var(--soft-fill)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${dim.normalizedPct}%`,
                          backgroundColor:
                            barColor,
                          borderRadius: '3px',
                        }}
                      />
                    </div>

                    {isTop && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: barColor,
                          marginTop: '8px',
                          fontWeight: 600,
                        }}
                      >
                        {t(
                          'explanation.mostElevated'
                        )}
                      </p>
                    )}
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Risk Areas */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            ⚠ {t('explanation.riskAreas')}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            {t('explanation.riskAreasSubtitle')}
          </p>
        </div>

        {riskDrivers.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {riskDrivers
              .slice(0, 5)
              .map((factor: any, idx: number) => {
                const barWidth =
                  (Math.abs(
                    factor.shapValue
                  ) /
                    maxImpact) *
                  100;

                const featureName =
                  getFeatureName(
                    factor.featureName
                  );

                return (
                  <Card
                    key={factor.shapId}
                    style={{
                      padding: '16px 20px',
                      backgroundColor:
                        '#FEF2F2',
                      border:
                        '1px solid #FECACA',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color:
                              'var(--text-primary)',
                          }}
                        >
                          {idx + 1}.{' '}
                          {featureName}
                        </p>

                        <p
                          style={{
                            fontSize: '12px',
                            color:
                              'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          +
                          {factor.shapValue.toFixed(
                            3
                          )}{' '}
                          {t(
                            'explanation.impact'
                          )}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            'var(--danger)',
                          backgroundColor:
                            '#FEE2E2',
                          padding:
                            '4px 12px',
                          borderRadius:
                            '4px',
                        }}
                      >
                        {Math.round(
                          barWidth
                        )}
                        %
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor:
                          '#FECACA',
                        borderRadius: '3px',
                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          backgroundColor:
                            'var(--danger)',
                          borderRadius:
                            '3px',
                          transition:
                            'width 0.4s ease',
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card
            style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor:
                '#F0FDF4',
              border:
                '1px solid #BBFBBC',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {t(
                'explanation.noRiskAreas'
              )}
            </p>
          </Card>
        )}
      </div>

      {/* Protective Factors */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            ✓{' '}
            {t(
              'explanation.protectiveFactors'
            )}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            {t(
              'explanation.protectiveSubtitle'
            )}
          </p>
        </div>

        {riskMitigators.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {riskMitigators
              .slice(0, 5)
              .map((factor: any, idx: number) => {
                const barWidth =
                  (Math.abs(
                    factor.shapValue
                  ) /
                    maxImpact) *
                  100;

                const featureName =
                  getFeatureName(
                    factor.featureName
                  );

                return (
                  <Card
                    key={factor.shapId}
                    style={{
                      padding: '16px 20px',
                      backgroundColor:
                        '#F0FDF4',
                      border:
                        '1px solid #BBFBBC',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color:
                              'var(--text-primary)',
                          }}
                        >
                          {idx + 1}.{' '}
                          {featureName}
                        </p>

                        <p
                          style={{
                            fontSize: '12px',
                            color:
                              'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          -
                          {Math.abs(
                            factor.shapValue
                          ).toFixed(3)}{' '}
                          {t(
                            'explanation.impact'
                          )}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            'var(--success)',
                          backgroundColor:
                            '#DBEAFE',
                          padding:
                            '4px 12px',
                          borderRadius:
                            '4px',
                        }}
                      >
                        {Math.round(
                          barWidth
                        )}
                        %
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor:
                          '#BBFBBC',
                        borderRadius: '3px',
                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          backgroundColor:
                            'var(--success)',
                          borderRadius:
                            '3px',
                          transition:
                            'width 0.4s ease',
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card
            style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor:
                '#F0FDF4',
              border:
                '1px solid #BBFBBC',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {t(
                'explanation.noProtective'
              )}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Insight */}
      <Card
        style={{
          padding: '24px 28px',
          marginBottom: '32px',
          backgroundColor:
            'var(--primary-light)',
          border: '1px solid var(--border)',
          borderLeft:
            '4px solid var(--primary)',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: 'var(--primary)',
            lineHeight: 1.7,
            fontWeight: 500,
          }}
        >
          {getPlainLanguageExplanation()}
        </p>
      </Card>

      {/* Counterfactual Insight */}
      <div style={{ marginBottom: '32px' }}>
        <CounterfactualCard />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingBottom: '20px',
        }}
      >
        <Button
          variant="secondary"
          onClick={() =>
            navigate('/developer/dashboard')
          }
        >
          {t('explanation.backToDashboard')}
        </Button>

        <Button
          variant="primary"
          onClick={() =>
            navigate(
              '/developer/recommendations'
            )
          }
        >
          {t(
            'explanation.viewRecommendationsArrow'
          )}
        </Button>
      </div>
    </PageWrapper>
  );
};

export default Explanation;
