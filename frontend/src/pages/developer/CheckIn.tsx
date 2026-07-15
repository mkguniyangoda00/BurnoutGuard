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
  <div className="mb-4">
    <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
    {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button" // Prevent accidental form submission
          onClick={() => onChange(n)}
          className={`h-8 min-w-[32px] px-2 rounded-md text-xs font-medium border transition-all ${n === value
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
            }`}
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
    workHours: 8,
    stressLevel: 5,
    sleepHours: 7,
    sleepQuality: 3,
    exerciseDone: false,
    screenTimeHours: 6,
    workloadRating: 3,
    moodScore: 6,
    energyLevel: 3,
    notes: '',
  });

  // ── Submit mutation ────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => checkinService.submit(formData),
    onSuccess: () => {
      // Invalidate cached queries so all panels update immediately
      queryClient.invalidateQueries({ queryKey: ['checkin', 'streak'] });
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
        <div className="max-w-md mx-auto mt-16 text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Great job. Your wellness data has been saved and used to update your burnout risk
            prediction, recommendations, and weekly wellness report immediately.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/developer/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="primary" onClick={() => mutation.reset()}>
              Submit Another
            </Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Today's Check-in</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })} · Takes about 90 seconds
          </p>
        </div>
      </div>

      {/* ── Motivational Banner ──────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-primary mb-5">
        💡 Complete 7 consecutive check-ins to unlock your weekly burnout risk prediction.
      </div>

      <form onSubmit={handleSubmit}>
        <Card style={{ padding: '24px' }}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* ── Left Column ───────────────────────────────────── */}
            <div>
              {/* Number input for work hours */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-medium">
                  Hours worked today
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={formData.workHours}
                  onChange={(e) => setFormData({ ...formData, workHours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <ScaleInput
                label="Sleep quality last night"
                description="1 = Very poor, 5 = Excellent"
                max={5}
                value={formData.sleepQuality}
                onChange={(v) => setFormData({ ...formData, sleepQuality: v })}
              />

              <ScaleInput
                label="Workload feeling"
                description="1 = Very light, 5 = Overwhelming"
                max={5}
                value={formData.workloadRating}
                onChange={(v) => setFormData({ ...formData, workloadRating: v })}
              />

              <ScaleInput
                label="Energy level"
                description="1 = Exhausted, 5 = Energised"
                max={5}
                value={formData.energyLevel}
                onChange={(v) => setFormData({ ...formData, energyLevel: v })}
              />

              {/* Exercise toggle — maps to boolean exerciseDone field */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-medium">
                  Did you exercise today?
                </label>
                <div className="flex gap-2">
                  {(['No', 'Yes'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, exerciseDone: opt === 'Yes' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${formData.exerciseDone === (opt === 'Yes')
                        ? opt === 'Yes'
                          ? 'bg-green-50 border-green-400 text-green-700'
                          : 'bg-gray-100 border-gray-400 text-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column ──────────────────────────────────── */}
            <div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-medium">
                  Sleep hours last night
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={formData.sleepHours}
                  onChange={(e) => setFormData({ ...formData, sleepHours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <ScaleInput
                label="Stress level today"
                description="1 = Very calm, 10 = Extremely stressed"
                max={10}
                value={formData.stressLevel}
                onChange={(v) => setFormData({ ...formData, stressLevel: v })}
              />

              <ScaleInput
                label="Mood score"
                description="1 = Very low, 10 = Excellent"
                max={10}
                value={formData.moodScore}
                onChange={(v) => setFormData({ ...formData, moodScore: v })}
              />

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-medium">
                  Screen time (hours, outside of work)
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={formData.screenTimeHours}
                  onChange={(e) => setFormData({ ...formData, screenTimeHours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Notes field (full width) ───────────────────────────── */}
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1 font-medium">
              Any notes? (optional, max 500 characters)
            </label>
            <textarea
              placeholder="e.g. Had a tough sprint review today..."
              maxLength={500}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* ── Error message from backend ────────────────────────── */}
          {mutation.isError && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              Submission failed. Please check your inputs and try again.
            </div>
          )}

          {/* ── Submit button ─────────────────────────────────────── */}
          <Button
            variant="primary"
            type="submit"
            disabled={mutation.isPending}
            style={{ width: '100%', marginTop: '20px', padding: '12px' }}
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
        </Card>
      </form>
    </PageWrapper>
  );
};

export default CheckIn;
