import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * Submit a new daily/weekly check-in and corresponding work metrics.
 * Route: POST /api/checkins
 */
export const submitCheckin = async (req: Request, res: Response) => {
  try {
    // In a real app, userId would come from req.user (after auth middleware)
    const {
      userId,
      stressLevel,
      sleepHours,
      moodScore,
      fatigueLevel,
      hoursLogged,
      commitsPushed,
      meetingsDurationMins,
      sprintPressureScore
    } = req.body;

    // Basic validation
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Wrap in a transaction to ensure both records are created or neither is
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Save subjective telemetry (Lifestyle/Psychosocial)
      const dailyCheckin = await tx.dailyCheckin.create({
        data: {
          userId,
          stressLevel: stressLevel || 5,
          sleepHours: sleepHours || 7,
          moodScore: moodScore || 5,
          fatigueLevel: fatigueLevel || 5,
        }
      });

      // 2. Save objective/work telemetry
      const workMetric = await tx.workMetric.create({
        data: {
          userId,
          hoursLogged: hoursLogged || 8,
          commitsPushed: commitsPushed || 0,
          meetingsDurationMins: meetingsDurationMins || 0,
          sprintPressureScore: sprintPressureScore || 5,
        }
      });

      return { dailyCheckin, workMetric };
    });

    return res.status(201).json({
      message: 'Check-in submitted successfully.',
      data: result
    });

  } catch (error) {
    console.error('Error in submitCheckin:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while saving check-in data.' });
  }
};

/**
 * Get check-in history for a specific user
 * Route: GET /api/checkins/user/:userId
 */
export const getUserCheckins = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Fetch the last 14 days of checkins for the trend charts
    const checkins = await prisma.dailyCheckin.findMany({
      where: { userId },
      orderBy: { recordDate: 'desc' },
      take: 14
    });

    return res.status(200).json({ data: checkins });
  } catch (error) {
    console.error('Error fetching checkins:', error);
    return res.status(500).json({ error: 'Failed to retrieve check-in history.' });
  }
};
