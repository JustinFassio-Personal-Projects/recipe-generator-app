/**
 * Milestone Management System
 *
 * Manages health milestones, goal tracking, and achievement detection.
 */

import { supabase } from '@/lib/supabase';
import type { EvaluationReport } from '../evaluation-report-types';

// ============================================================================
// TYPES
// ============================================================================

export interface Milestone {
  id: string;
  user_id: string;
  milestone_type:
    | 'nutritional'
    | 'skill'
    | 'behavioral'
    | 'goal'
    | 'achievement';
  milestone_name: string;
  description?: string;
  target_value?: number;
  current_value: number;
  target_date?: string;
  achieved_at?: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface MilestoneProgress {
  milestone: Milestone;
  progress_percentage: number;
  days_remaining?: number;
  is_on_track: boolean;
}

// ============================================================================
// MILESTONE MANAGER CLASS
// ============================================================================

export class MilestoneManager {
  /**
   * Create a new milestone
   */
  async createMilestone(
    userId: string,
    milestoneData: Omit<
      Milestone,
      'id' | 'user_id' | 'created_at' | 'updated_at'
    >
  ): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('health_milestones')
        .insert({
          user_id: userId,
          ...milestoneData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating milestone:', error);
        throw new Error(`Failed to create milestone: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createMilestone:', error);
      throw error;
    }
  }

  /**
   * Auto-generate milestones from evaluation report
   */
  async generateMilestonesFromReport(
    userId: string,
    report: EvaluationReport
  ): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    const reportData = report.user_evaluation_report;

    // Generate nutritional milestones
    if (reportData.nutritional_analysis?.current_status) {
      const nutrition = reportData.nutritional_analysis.current_status;

      // Diet quality milestone
      if (nutrition.overall_diet_quality_score < 80) {
        const milestone = await this.createMilestone(userId, {
          milestone_type: 'nutritional',
          milestone_name: 'Improve Diet Quality',
          description: 'Reach diet quality score of 80 or higher',
          target_value: 80,
          current_value: nutrition.overall_diet_quality_score,
          status: 'pending',
          priority: 'high',
        });
        milestones.push(milestone);
      }

      // Nutritional completeness milestone
      if (nutrition.nutritional_completeness < 85) {
        const milestone = await this.createMilestone(userId, {
          milestone_type: 'nutritional',
          milestone_name: 'Complete Nutritional Profile',
          description: 'Achieve 85% nutritional completeness',
          target_value: 85,
          current_value: nutrition.nutritional_completeness,
          status: 'pending',
          priority: 'medium',
        });
        milestones.push(milestone);
      }
    }

    // Generate skill milestones
    if (reportData.personalization_matrix?.skill_profile) {
      const skills = reportData.personalization_matrix.skill_profile;

      if (skills.confidence_score < 75) {
        const milestone = await this.createMilestone(userId, {
          milestone_type: 'skill',
          milestone_name: 'Build Cooking Confidence',
          description: 'Reach 75% cooking confidence',
          target_value: 75,
          current_value: skills.confidence_score,
          status: 'pending',
          priority: 'medium',
        });
        milestones.push(milestone);
      }
    }

    // Generate behavioral milestones
    if (reportData.personalization_matrix?.equipment_optimization) {
      const equipment =
        reportData.personalization_matrix.equipment_optimization;

      if (equipment.utilization_rate < 80) {
        const milestone = await this.createMilestone(userId, {
          milestone_type: 'behavioral',
          milestone_name: 'Maximize Equipment Use',
          description: 'Utilize 80% of available cooking equipment',
          target_value: 80,
          current_value: equipment.utilization_rate,
          status: 'pending',
          priority: 'low',
        });
        milestones.push(milestone);
      }
    }

    return milestones;
  }

  /**
   * Update milestone progress
   */
  async updateMilestoneProgress(
    milestoneId: string,
    currentValue: number
  ): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('health_milestones')
        .update({
          current_value: currentValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) {
        console.error('Error updating milestone:', error);
        throw new Error(`Failed to update milestone: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateMilestoneProgress:', error);
      throw error;
    }
  }

  /**
   * Check and update milestone status based on progress
   */
  async checkMilestoneAchievements(userId: string): Promise<Milestone[]> {
    try {
      const { data: milestones, error } = await supabase
        .from('health_milestones')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;

      const achieved: Milestone[] = [];

      for (const milestone of milestones || []) {
        if (
          milestone.target_value &&
          milestone.current_value >= milestone.target_value
        ) {
          // Mark as achieved
          const { data: updated, error: updateError } = await supabase
            .from('health_milestones')
            .update({
              status: 'achieved',
              achieved_at: new Date().toISOString(),
            })
            .eq('id', milestone.id)
            .select()
            .single();

          if (!updateError && updated) {
            achieved.push(updated);
          }
        }
      }

      return achieved;
    } catch (error) {
      console.error('Error checking milestone achievements:', error);
      throw error;
    }
  }

  /**
   * Get user milestones
   */
  async getUserMilestones(
    userId: string,
    status?: Milestone['status'],
    type?: Milestone['milestone_type']
  ): Promise<Milestone[]> {
    try {
      let query = supabase
        .from('health_milestones')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (type) {
        query = query.eq('milestone_type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting milestones:', error);
        throw new Error(`Failed to get milestones: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserMilestones:', error);
      throw error;
    }
  }

  /**
   * Get milestone progress details
   */
  async getMilestoneProgress(milestoneId: string): Promise<MilestoneProgress> {
    try {
      const { data, error } = await supabase
        .from('health_milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (error) throw error;

      const progressPercentage = data.target_value
        ? (data.current_value / data.target_value) * 100
        : 0;

      let daysRemaining: number | undefined;
      if (data.target_date) {
        const targetDate = new Date(data.target_date);
        const today = new Date();
        daysRemaining = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      const isOnTrack = this.calculateIfOnTrack(data);

      return {
        milestone: data,
        progress_percentage: Math.min(100, progressPercentage),
        days_remaining: daysRemaining,
        is_on_track: isOnTrack,
      };
    } catch (error) {
      console.error('Error in getMilestoneProgress:', error);
      throw error;
    }
  }

  /**
   * Calculate if milestone is on track
   */
  private calculateIfOnTrack(milestone: Milestone): boolean {
    if (!milestone.target_value || !milestone.target_date) return true;

    const progressPercentage =
      (milestone.current_value / milestone.target_value) * 100;
    const targetDate = new Date(milestone.target_date);
    const createdDate = new Date(milestone.created_at);
    const today = new Date();

    const totalDays =
      (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    const expectedProgress = (daysPassed / totalDays) * 100;

    // On track if actual progress is within 10% of expected progress
    return progressPercentage >= expectedProgress - 10;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('health_milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) {
        console.error('Error deleting milestone:', error);
        throw new Error(`Failed to delete milestone: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteMilestone:', error);
      throw error;
    }
  }

  /**
   * Get milestone statistics
   */
  async getMilestoneStats(userId: string): Promise<{
    total: number;
    achieved: number;
    in_progress: number;
    pending: number;
    overdue: number;
    achievement_rate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('health_milestones')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data?.length || 0;
      const achieved = data?.filter((m) => m.status === 'achieved').length || 0;
      const inProgress =
        data?.filter((m) => m.status === 'in_progress').length || 0;
      const pending = data?.filter((m) => m.status === 'pending').length || 0;
      const overdue = data?.filter((m) => m.status === 'overdue').length || 0;

      const achievementRate = total > 0 ? (achieved / total) * 100 : 0;

      return {
        total,
        achieved,
        in_progress: inProgress,
        pending,
        overdue,
        achievement_rate: achievementRate,
      };
    } catch (error) {
      console.error('Error in getMilestoneStats:', error);
      throw error;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format milestone for display
 */
export const formatMilestone = (milestone: Milestone): string => {
  const status =
    milestone.status === 'achieved'
      ? '✅'
      : milestone.status === 'in_progress'
        ? '🔄'
        : milestone.status === 'overdue'
          ? '⚠️'
          : '📋';

  const progress = milestone.target_value
    ? ` (${milestone.current_value}/${milestone.target_value})`
    : '';

  return `${status} ${milestone.milestone_name}${progress}`;
};

/**
 * Get milestone priority color
 */
export const getMilestonePriorityColor = (
  priority: Milestone['priority']
): string => {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
};

/**
 * Get milestone status color
 */
export const getMilestoneStatusColor = (
  status: Milestone['status']
): string => {
  switch (status) {
    case 'achieved':
      return 'green';
    case 'in_progress':
      return 'blue';
    case 'overdue':
      return 'red';
    case 'pending':
      return 'yellow';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
};
