/**
 * CheckIn.tsx (pages/developer/CheckIn.tsx)
 * 
 * The daily wellbeing check-in form for developers.
 * 
 * This is the most critical data-entry point in BurnoutGuard.
 * Every field maps directly to a column in the DailyCheckIn Prisma model.
 * The backend Zod validator enforces the same ranges shown in the UI.
 * 
 * WHY useMutation from React Query:
 * useMutation handles the full lifecycle of a POST request —
 * isPending (show spinner), isSuccess (show confirmation), isError (show message).
 * Without it, you'd need 3+ separate useState hooks to track the same state.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { checkinService, type CheckInPayload } from '../../services/checkin.service';
import { Loader2, CheckCircle } from 'lucide-react';

/**
 * ScaleInput — reusable 1-to-N button scale selector.
 * Used for Stress Level, Sleep Quality, Mood, etc.
 * 
 * WHY custom component instead of a range input (<input type="range">):
 * Discrete button scales are more usable on both desktop and mobile,
 * and make the selected value visually obvious without reading a tooltip.
 */
const ScaleInput: React.FC<{
  label: string;
  max: number;
  value: number;
  onChange: (v: number) => void;
  description?: string;
}> = ({ label, max, value, onChange, description }) => (
  <div className="mb-6">
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{description}</p>}
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            height: '32px',
            minWidth: '32px',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid',
            transition: 'all 0.15s',
            backgroundColor: n === value ? 'var(--primary)' : 'var(--soft-fill)',
            borderColor: n === value ? 'var(--primary)' : 'var(--border)',
            color: n === value ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form state — each field mirrors the backend CheckInPayload interface ──
  const [formData, setFormData] = useState<CheckInPayload>({
    // Sleep & Rest
    sleepHours: 7,
    sleepQuality: 3,
    
    // Physical Activity
    exerciseLevel: 2,
    screenTimeHours: 6,
    
    // Work & Productivity
    workHours: 8,
    workloadRating: 3,
    overtimeHours: 0,
    breaksTaken: 3,
    commuteMinutes: 30,
    
    // Mental & Emotional
    stressLevel: 5,
    moodScore: 6,
    energyLevel: 3,
    workSatisfaction: 3,
    
    // Lifestyle & Health
    caffeineIntake: 2,
    mealQuality: 3,
    socialSupportLevel: 3,
    
    // Psychological Wellbeing
    anxietyLevel: 4,
    emotionalFatigue: 4,
    motivationLevel: 3,
    concentrationIssues: 2,
    irritabilityLevel: 2,
    lonelinessLevel: 2,
    selfEfficacy: 3,
    copingAbility: 3,

    // Work Context (Sri Lankan & Global)
    powerInternetDisruption: 2,
    wfhEnvironmentQuality: 3,
    familyResponsibilityLoad: 2,
    salaryWorkloadSatisfaction: 3,
    afterHoursMessaging: false,
    // Notes
    notes: '',
  });

  // ── Submit mutation ────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => checkinService.submit(formData),
    onSuccess: () => {
      // Invalidate cached queries so all panels update immediately
      queryClient.invalidateQueries({ queryKey: ['checkin', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['checkin', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['prediction', 'latest'] });
      queryClient.invalidateQueries({ queryKey: ['prediction', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  // Extract custom error message from backend if available
  // const getErrorMessage = () => {
  //   if (!mutation.error) return null;
  //   const err = mutation.error as any;
  //   return err.response?.data?.error || err.message || 'Submission failed. Please check your inputs and try again.';
  // };

  // ── Show success state after submission ────────────────────────────────
  if (mutation.isSuccess) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 24px', display: 'block' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Check-in Submitted!
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
              Great job. Your wellness data has been saved and used to update your burnout risk prediction, recommendations, and weekly wellness report immediately.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => navigate('/developer/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="primary" onClick={() => mutation.reset()}>
                Submit Another
              </Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>Today's Check-in</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })} · Takes about 90 seconds
          </p>
        </div>
      </div>

      {/* ── Motivational Banner ──────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid #C7D5FA', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: 'var(--primary)', marginBottom: '24px', fontWeight: 500 }}>
        💡 Submit today's check-in to get your updated burnout risk score.
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Sleep & Rest Section ──────────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>😴 Sleep & Rest</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sleep hours last night
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={formData.sleepHours}
                onChange={(e) => setFormData({ ...formData, sleepHours: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <ScaleInput
                label="Sleep quality last night"
                description="1 = Very poor, 5 = Excellent"
                max={5}
                value={formData.sleepQuality}
                onChange={(v) => setFormData({ ...formData, sleepQuality: v })}
              />
            </div>
          </div>
        </Card>

        {/* ── Physical Activity Section ──────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>🏃 Physical Activity</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <ScaleInput
                label="Exercise level today"
                description="1 = None, 5 = Intense"
                max={5}
                value={formData.exerciseLevel}
                onChange={(v) => setFormData({ ...formData, exerciseLevel: v })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Screen time (hrs, outside work)
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={formData.screenTimeHours}
                onChange={(e) => setFormData({ ...formData, screenTimeHours: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
          </div>
        </Card>

        {/* ── Work & Productivity Section ────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>💼 Work & Productivity</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hours worked today
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={formData.workHours}
                onChange={(e) => setFormData({ ...formData, workHours: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overtime hours
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={formData.overtimeHours}
                onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <ScaleInput
                label="Workload feeling"
                description="1 = Very light, 5 = Overwhelming"
                max={5}
                value={formData.workloadRating}
                onChange={(v) => setFormData({ ...formData, workloadRating: v })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Breaks taken today
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={formData.breaksTaken}
                onChange={(e) => setFormData({ ...formData, breaksTaken: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Commute duration (minutes)
              </label>
              <input
                type="number"
                min={0}
                max={480}
                value={formData.commuteMinutes}
                onChange={(e) => setFormData({ ...formData, commuteMinutes: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <ScaleInput
                label="Work satisfaction"
                description="1 = Very unsatisfied, 5 = Very satisfied"
                max={5}
                value={formData.workSatisfaction}
                onChange={(v) => setFormData({ ...formData, workSatisfaction: v })}
              />
            </div>
          </div>
        </Card>

        {/* ── Mental & Emotional Section ─────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>🧠 Mental & Emotional</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <ScaleInput
                label="Stress level today"
                description="1 = Very calm, 10 = Extremely stressed"
                max={10}
                value={formData.stressLevel}
                onChange={(v) => setFormData({ ...formData, stressLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Mood score"
                description="1 = Very low, 10 = Excellent"
                max={10}
                value={formData.moodScore}
                onChange={(v) => setFormData({ ...formData, moodScore: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Energy level"
                description="1 = Exhausted, 5 = Energised"
                max={5}
                value={formData.energyLevel}
                onChange={(v) => setFormData({ ...formData, energyLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Social support level"
                description="1 = Very isolated, 5 = Well supported"
                max={5}
                value={formData.socialSupportLevel}
                onChange={(v) => setFormData({ ...formData, socialSupportLevel: v })}
              />
            </div>
          </div>
        </Card>

        {/* ── Lifestyle & Health Section ────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>🍽️ Lifestyle & Health</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Caffeine intake (cups/scale 0-10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.caffeineIntake}
                onChange={(e) => setFormData({ ...formData, caffeineIntake: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <ScaleInput
                label="Meal quality today"
                description="1 = Poor, 5 = Excellent"
                max={5}
                value={formData.mealQuality}
                onChange={(v) => setFormData({ ...formData, mealQuality: v })}
              />
            </div>
          </div>
        </Card>
        
        {/* ── Psychological Wellbeing Section ────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>🧠 Psychological Wellbeing</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <ScaleInput
                label="Anxiety level today"
                description="1 = None, 10 = Severe"
                max={10}
                value={formData.anxietyLevel}
                onChange={(v) => setFormData({ ...formData, anxietyLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Emotional fatigue"
                description="1 = None, 10 = Completely drained"
                max={10}
                value={formData.emotionalFatigue}
                onChange={(v) => setFormData({ ...formData, emotionalFatigue: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Motivation level"
                description="1 = Very low, 5 = Very high"
                max={5}
                value={formData.motivationLevel}
                onChange={(v) => setFormData({ ...formData, motivationLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Concentration issues"
                description="1 = None, 5 = Severe difficulty focusing"
                max={5}
                value={formData.concentrationIssues}
                onChange={(v) => setFormData({ ...formData, concentrationIssues: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Irritability level"
                description="1 = Very calm, 5 = Very irritable"
                max={5}
                value={formData.irritabilityLevel}
                onChange={(v) => setFormData({ ...formData, irritabilityLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Loneliness level"
                description="1 = Well connected, 5 = Very isolated"
                max={5}
                value={formData.lonelinessLevel}
                onChange={(v) => setFormData({ ...formData, lonelinessLevel: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Self-efficacy"
                description="1 = Very low confidence, 5 = Very confident"
                max={5}
                value={formData.selfEfficacy}
                onChange={(v) => setFormData({ ...formData, selfEfficacy: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Coping ability"
                description="1 = Struggling to cope, 5 = Coping very well"
                max={5}
                value={formData.copingAbility}
                onChange={(v) => setFormData({ ...formData, copingAbility: v })}
              />
            </div>
          </div>
        </Card>

        {/* ── Work Context Section (Sri Lankan & Global) ─────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>🇱🇰 Work Context</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <ScaleInput
                label="Power / internet disruption stress"
                description="1 = No disruption, 5 = Severely disrupted my work"
                max={5}
                value={formData.powerInternetDisruption}
                onChange={(v) => setFormData({ ...formData, powerInternetDisruption: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="WFH environment quality"
                description="1 = Very poor setup, 5 = Excellent setup"
                max={5}
                value={formData.wfhEnvironmentQuality}
                onChange={(v) => setFormData({ ...formData, wfhEnvironmentQuality: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Family responsibility load"
                description="1 = Very light, 5 = Very heavy"
                max={5}
                value={formData.familyResponsibilityLoad}
                onChange={(v) => setFormData({ ...formData, familyResponsibilityLoad: v })}
              />
            </div>
            <div>
              <ScaleInput
                label="Salary vs workload satisfaction"
                description="1 = Very unsatisfied, 5 = Very satisfied"
                max={5}
                value={formData.salaryWorkloadSatisfaction}
                onChange={(v) => setFormData({ ...formData, salaryWorkloadSatisfaction: v })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                After-hours work messaging?
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, afterHoursMessaging: false })}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid',
                    backgroundColor: !formData.afterHoursMessaging ? 'var(--soft-fill)' : 'var(--bg)',
                    borderColor: !formData.afterHoursMessaging ? 'var(--text-muted)' : 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, afterHoursMessaging: true })}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid',
                    backgroundColor: formData.afterHoursMessaging ? 'var(--success-light)' : 'var(--bg)',
                    borderColor: formData.afterHoursMessaging ? 'var(--success)' : 'var(--border)',
                    color: formData.afterHoursMessaging ? 'var(--success)' : 'var(--text-secondary)',
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Notes Section (Full Width) ────────────────────────────── */}
        <Card style={{ padding: '28px 32px', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Any notes? (optional, max 500 characters)
          </label>
          <textarea
            placeholder="e.g. Had a tough sprint review today, feeling overwhelmed..."
            maxLength={500}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{ width: '100%', height: '100px', padding: '10px 12px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-body)', resize: 'none' }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            {formData.notes?.length ?? 0}/500
          </p>
        </Card>

        {/* ── Error message from backend ────────────────────────── */}
        {mutation.isError && (
          <Card style={{ padding: '12px 14px', backgroundColor: '#FEE2E2', color: 'var(--danger)', border: '1px solid #FECACA', marginBottom: '20px', fontSize: '13px' }}>
            Submission failed. Please check your inputs and try again.
          </Card>
        )}

        {/* ── Submit button ─────────────────────────────────────── */}
        <Button
          variant="primary"
          type="submit"
          disabled={mutation.isPending}
          style={{ width: '100%', padding: '14px 16px', fontSize: '15px', fontWeight: 600 }}
        >
          {mutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </span>
          ) : (
            'Submit Check-in →'
          )}
        </Button>
      </form>
    </PageWrapper>
  );
};

export default CheckIn;
