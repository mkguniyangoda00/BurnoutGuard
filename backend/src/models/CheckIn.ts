export interface CheckIn {
  checkInId: string;
  userId: string;
  checkInDate: Date;
  workHours: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: number;
  exerciseDone: boolean;
  screenTimeHours: number;
  workloadRating: number;
  moodScore: number;
  energyLevel: number;
  notes: string | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
