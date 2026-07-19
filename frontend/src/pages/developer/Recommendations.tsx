import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { CheckCircle, Circle } from 'lucide-react';

const RecCard: React.FC<{
  icon: React.ReactNode,
  bg: string,
  title: string,
  body: string,
  priority: string,
  priorityColor: string,
  priorityBg: string,
  completed?: boolean
}> = ({ icon, bg, title, body, priority, priorityColor, priorityBg, completed: initialCompleted = false }) => {
  const [completed, setCompleted] = useState(initialCompleted);
  
  return (
    <Card style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '12px',
      padding: '18px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, border-color 0.2s',
      borderColor: completed ? 'var(--success)' : 'var(--border)',
      opacity: completed ? 0.7 : 1,
    }} className="rec-card">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '8px', 
          backgroundColor: bg, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '20px'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{title}</h3>
            <div onClick={(e) => { e.stopPropagation(); setCompleted(!completed); }} style={{ padding: '0', marginTop: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {completed ? (
                <CheckCircle color="var(--success)" size={18} />
              ) : (
                <Circle style={{ opacity: 0.3 }} size={18} />
              )}
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>{body}</p>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            padding: '4px 10px', 
            borderRadius: '12px', 
            backgroundColor: priorityBg, 
            color: priorityColor 
          }}>
            {priority}
          </span>
        </div>
      </div>
    </Card>
  );
};

const Recommendations: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>Your Action Plan</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>4 personalized recommendations based on your SHAP analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <RecCard 
          icon="🌙" 
          bg="var(--danger-light)" 
          title="Improve your sleep routine"
          body="Your sleep quality (avg 2.1/5) is the #1 driver of your burnout risk. Try setting a consistent sleep time of 10:30 PM and avoiding screens 45 minutes before bed. Even one extra hour significantly reduces your predicted risk score."
          priority="High priority"
          priorityColor="var(--danger)"
          priorityBg="var(--danger-light)"
        />
        <RecCard 
          icon="🕒" 
          bg="var(--warning-light)" 
          title="Cap your workday at 8.5 hours"
          body="Averaging 10.3h/day is a second major risk factor. Set a hard-stop calendar reminder at 6:30 PM. Discuss sprint scope with your manager if pressure is the cause — this is sustainable-pace engineering."
          priority="High priority"
          priorityColor="var(--danger)"
          priorityBg="var(--danger-light)"
        />
        <RecCard 
          icon="🏃" 
          bg="var(--success-light)" 
          title="Add 20-minute walks on work days"
          body="Even a short walk during lunch lowers stress hormones. Start with one walk this week — no gym required. Our model shows this can reduce your predicted score by ~0.06."
          priority="Medium priority"
          priorityColor="var(--warning)"
          priorityBg="var(--warning-light)"
          completed={true}
        />
        <RecCard 
          icon="📵" 
          bg="var(--primary-light)" 
          title="Reduce screen time after 9 PM"
          body="Your 11+ hours of daily screen time is straining your eyes and disrupting melatonin. Try enabling Night Shift mode and using a 10 PM screen cutoff. Correlates positively with sleep quality improvement."
          priority="Low priority"
          priorityColor="var(--success)"
          priorityBg="var(--success-light)"
        />
      </div>

      <style>{`
        .rec-card:hover {
          background-color: var(--surface) !important;
        }
      `}</style>
    </PageWrapper>
  );
};

export default Recommendations;
