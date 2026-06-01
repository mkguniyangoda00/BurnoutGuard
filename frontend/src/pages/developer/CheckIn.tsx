import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const ScaleInput: React.FC<{ 
  label: string, 
  max: number, 
  value: number, 
  onChange: (v: number) => void 
}> = ({ label, max, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            height: '32px',
            minWidth: '32px',
            padding: '0 8px',
            borderRadius: '6px',
            border: n === value ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: n === value ? 'var(--primary)' : 'var(--soft-fill)',
            color: n === value ? 'white' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const CheckIn: React.FC = () => {
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(7);
  const [workload, setWorkload] = useState(4);
  const [mood, setMood] = useState(5);
  const [exercise, setExercise] = useState<'Yes' | 'No'>('No');

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Today's Check-in</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Wednesday, 1 April 2026 · Takes about 90 seconds</p>
        </div>
        <div style={{ padding: '6px 12px', backgroundColor: 'var(--soft-fill)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          5 of 7 this week
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#F0F4FF', 
        border: '1px solid #C7D5FA', 
        borderRadius: '14px', 
        padding: '14px 18px', 
        fontSize: '13px', 
        color: 'var(--primary)',
        marginBottom: '20px'
      }}>
        💡 You're close to unlocking your weekly prediction — submit today's check-in to get your updated risk score.
      </div>

      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Hours worked today</label>
              <input type="number" defaultValue="9.5" style={{
                width: '100%', padding: '9px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px'
              }} />
            </div>
            
            <ScaleInput label="Sleep quality" max={5} value={sleepQuality} onChange={setSleepQuality} />
            <ScaleInput label="Workload feeling" max={5} value={workload} onChange={setWorkload} />
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Exercise today?</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['No', 'Yes'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setExercise(opt as any)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: exercise === opt ? (opt === 'Yes' ? '1.5px solid var(--success)' : '1px solid var(--border-color)') : '1px solid var(--border-color)',
                      backgroundColor: exercise === opt ? (opt === 'Yes' ? 'var(--success-light)' : 'var(--soft-fill)') : 'var(--soft-fill)',
                      color: exercise === opt ? (opt === 'Yes' ? 'var(--success)' : 'var(--text-primary)') : 'var(--text-muted)',
                      fontSize: '13px', fontWeight: exercise === opt ? 500 : 400
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sleep hours last night</label>
              <input type="number" defaultValue="6.0" style={{
                width: '100%', padding: '9px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px'
              }} />
            </div>

            <ScaleInput label="Stress level today" max={10} value={stressLevel} onChange={setStressLevel} />
            <ScaleInput label="Mood score" max={10} value={mood} onChange={setMood} />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Screen time (hrs)</label>
              <input type="number" defaultValue="11.0" style={{
                width: '100%', padding: '9px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px'
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Any notes? (optional)</label>
          <textarea placeholder="e.g. Had a tough sprint review today..." style={{
            width: '100%', height: '64px', padding: '9px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', resize: 'none'
          }} />
        </div>

        <Button variant="primary" style={{ width: '100%', marginTop: '24px', padding: '12px' }}>
          Submit Check-in →
        </Button>
      </Card>
    </PageWrapper>
  );
};

export default CheckIn;
