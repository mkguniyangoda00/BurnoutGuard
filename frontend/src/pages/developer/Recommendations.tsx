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
      gap: '14px', 
      alignItems: 'flex-start',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }} className="rec-card">
      <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '10px', 
        backgroundColor: bg, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      
      <div style={{ flexGrow: 1 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>{body}</p>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 500, 
          padding: '2px 8px', 
          borderRadius: '20px', 
          backgroundColor: priorityBg, 
          color: priorityColor 
        }}>
          {priority}
        </span>
      </div>
      
      <div onClick={(e) => { e.stopPropagation(); setCompleted(!completed); }} style={{ padding: '4px' }}>
        {completed ? (
          <CheckCircle color="var(--success)" size={20} />
        ) : (
          <Circle style={{ opacity: 0.4 }} size={20} />
        )}
      </div>
    </Card>
  );
};

const Recommendations: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Your Action Plan</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>4 personalized recommendations based on your SHAP analysis</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          body="You exercised 0 of 7 days this week. Even a short walk during lunch lowers stress hormones. Start with 3 days this week — no gym required. Our model shows this can reduce your predicted score by ~0.06."
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
