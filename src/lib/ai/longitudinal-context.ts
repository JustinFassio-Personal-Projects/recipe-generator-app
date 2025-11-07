/**
 * Longitudinal Context Builder
 *
 * Aggregates user history, progress patterns, and health journey data
 * to enhance AI prompts with comprehensive longitudinal awareness.
 */

import { getUserEvaluationReportsFromDB } from '../evaluation-report-db';
import { getConversationHistorySummary } from '../conversation-db';
import {
  getUserProgressMetrics,
  getProgressSummaryByCategory,
} from '../progress-tracking-api';
import { MilestoneManager } from '../milestones/milestone-manager';
import { TrendAnalyzer } from '../progress-analysis/trend-analyzer';
import type { EvaluationReport } from '../evaluation-report-types';

// ============================================================================
// TYPES
// ============================================================================

export interface LongitudinalContext {
  user_history: {
    total_evaluations: number;
    evaluation_timeline: Date[];
    first_evaluation_date: Date | null;
    most_recent_evaluation_date: Date | null;
    evaluation_frequency_days: number;
  };
  progress_trajectory: {
    overall_trend: 'improving' | 'declining' | 'stable';
    category_trends: Record<string, string>;
    key_improvements: string[];
    areas_of_concern: string[];
  };
  milestones: {
    total_milestones: number;
    achieved_count: number;
    in_progress_count: number;
    achievement_rate: number;
    recent_achievements: Array<{ name: string; achieved_at: string }>;
  };
  conversation_history: {
    total_conversations: number;
    most_recent_conversation_date: string | null;
    conversation_topics: string[];
  };
  current_state: {
    latest_scores: Record<string, number>;
    active_goals: string[];
    priority_areas: string[];
  };
}

// ============================================================================
// LONGITUDINAL CONTEXT BUILDER
// ============================================================================

export class LongitudinalContextBuilder {
  private trendAnalyzer: TrendAnalyzer;
  private milestoneManager: MilestoneManager;

  constructor() {
    this.trendAnalyzer = new TrendAnalyzer();
    this.milestoneManager = new MilestoneManager();
  }

  /**
   * Build comprehensive longitudinal context for a user
   */
  async buildContext(userId: string): Promise<LongitudinalContext> {
    try {
      // Gather all data in parallel
      const [
        evaluationReports,
        progressMetrics,
        progressSummary,
        milestoneStats,
        activeMilestones,
        achievedMilestones,
        conversationHistory,
      ] = await Promise.all([
        getUserEvaluationReportsFromDB(userId),
        getUserProgressMetrics(userId, undefined, undefined, 100),
        getProgressSummaryByCategory(userId),
        this.milestoneManager.getMilestoneStats(userId),
        this.milestoneManager.getUserMilestones(userId, 'in_progress'),
        this.milestoneManager.getUserMilestones(userId, 'achieved'),
        getConversationHistorySummary(userId, 5),
      ]);

      // Build user history section
      const userHistory = this.buildUserHistory(evaluationReports);

      // Build progress trajectory
      const progressTrajectory = await this.buildProgressTrajectory(
        progressMetrics,
        progressSummary
      );

      // Build milestones section
      const milestones = this.buildMilestonesSection(
        milestoneStats,
        achievedMilestones
      );

      // Build conversation history section
      const conversationSummary =
        this.buildConversationHistory(conversationHistory);

      // Build current state section
      const currentState = this.buildCurrentState(
        evaluationReports,
        activeMilestones,
        progressTrajectory
      );

      return {
        user_history: userHistory,
        progress_trajectory: progressTrajectory,
        milestones,
        conversation_history: conversationSummary,
        current_state: currentState,
      };
    } catch (error) {
      console.error('Error building longitudinal context:', error);
      // Return minimal context on error
      return this.createMinimalContext();
    }
  }

  /**
   * Build user history section
   */
  private buildUserHistory(
    reports: EvaluationReport[]
  ): LongitudinalContext['user_history'] {
    if (reports.length === 0) {
      return {
        total_evaluations: 0,
        evaluation_timeline: [],
        first_evaluation_date: null,
        most_recent_evaluation_date: null,
        evaluation_frequency_days: 0,
      };
    }

    const timeline = reports.map(
      (r) => new Date(r.user_evaluation_report.evaluation_date)
    );
    timeline.sort((a, b) => a.getTime() - b.getTime());

    const firstDate = timeline[0];
    const lastDate = timeline[timeline.length - 1];

    // Calculate average frequency
    let totalDaysBetween = 0;
    for (let i = 1; i < timeline.length; i++) {
      const days =
        (timeline[i].getTime() - timeline[i - 1].getTime()) /
        (1000 * 60 * 60 * 24);
      totalDaysBetween += days;
    }
    const avgFrequency =
      timeline.length > 1 ? totalDaysBetween / (timeline.length - 1) : 0;

    return {
      total_evaluations: reports.length,
      evaluation_timeline: timeline,
      first_evaluation_date: firstDate,
      most_recent_evaluation_date: lastDate,
      evaluation_frequency_days: Math.round(avgFrequency),
    };
  }

  /**
   * Build progress trajectory section
   */
  private async buildProgressTrajectory(
    metrics: Array<{ progress_direction?: string; metric_name: string }>,
    summary: Record<
      string,
      { improving_count?: number; declining_count?: number }
    >
  ): Promise<LongitudinalContext['progress_trajectory']> {
    // Analyze overall trend
    const categoryTrends: Record<string, string> = {};

    for (const [category, data] of Object.entries(summary)) {
      const improvingCount = data.improving_count || 0;
      const decliningCount = data.declining_count || 0;

      if (improvingCount > decliningCount) {
        categoryTrends[category] = 'improving';
      } else if (decliningCount > improvingCount) {
        categoryTrends[category] = 'declining';
      } else {
        categoryTrends[category] = 'stable';
      }
    }

    // Determine overall trend
    const improvingCategories = Object.values(categoryTrends).filter(
      (t) => t === 'improving'
    ).length;
    const decliningCategories = Object.values(categoryTrends).filter(
      (t) => t === 'declining'
    ).length;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvingCategories > decliningCategories) {
      overallTrend = 'improving';
    } else if (decliningCategories > improvingCategories) {
      overallTrend = 'declining';
    }

    // Extract key improvements and concerns from metrics
    const improvingMetrics = metrics.filter(
      (m) => m.progress_direction === 'improving'
    );
    const decliningMetrics = metrics.filter(
      (m) => m.progress_direction === 'declining'
    );

    const keyImprovements = improvingMetrics
      .slice(0, 5)
      .map((m) => `${m.metric_name.replace(/_/g, ' ')} is improving`);

    const areasOfConcern = decliningMetrics
      .slice(0, 5)
      .map((m) => `${m.metric_name.replace(/_/g, ' ')} needs attention`);

    return {
      overall_trend: overallTrend,
      category_trends: categoryTrends,
      key_improvements: keyImprovements,
      areas_of_concern: areasOfConcern,
    };
  }

  /**
   * Build milestones section
   */
  private buildMilestonesSection(
    stats: {
      total?: number;
      achieved?: number;
      in_progress?: number;
      achievement_rate?: number;
    },
    achievedMilestones: Array<{ achieved_at?: string; milestone_name: string }>
  ): LongitudinalContext['milestones'] {
    const recentAchievements = achievedMilestones
      .filter((m) => m.achieved_at)
      .sort(
        (a, b) =>
          new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
      )
      .slice(0, 5)
      .map((m) => ({
        name: m.milestone_name,
        achieved_at: m.achieved_at,
      }));

    return {
      total_milestones: stats.total || 0,
      achieved_count: stats.achieved || 0,
      in_progress_count: stats.in_progress || 0,
      achievement_rate: stats.achievement_rate || 0,
      recent_achievements: recentAchievements,
    };
  }

  /**
   * Build conversation history section
   */
  private buildConversationHistory(
    history: Array<{ created_at: string; title?: string }>
  ): LongitudinalContext['conversation_history'] {
    const mostRecent = history.length > 0 ? history[0].created_at : null;

    // Extract topics from conversation titles
    const topics = history
      .filter((c) => c.title)
      .map((c) => c.title)
      .slice(0, 5);

    return {
      total_conversations: history.length,
      most_recent_conversation_date: mostRecent,
      conversation_topics: topics,
    };
  }

  /**
   * Build current state section
   */
  private buildCurrentState(
    reports: EvaluationReport[],
    activeMilestones: Array<{ milestone_name: string }>,
    progressTrajectory: LongitudinalContext['progress_trajectory']
  ): LongitudinalContext['current_state'] {
    // Get latest scores from most recent report
    const latestScores: Record<string, number> = {};
    if (reports.length > 0) {
      const latest = reports[0];
      const nutrition =
        latest.user_evaluation_report.nutritional_analysis?.current_status;

      if (nutrition) {
        latestScores.diet_quality = nutrition.overall_diet_quality_score || 0;
        latestScores.nutritional_completeness =
          nutrition.nutritional_completeness || 0;
        latestScores.gut_health = nutrition.gut_health_score || 0;
      }

      const skills =
        latest.user_evaluation_report.personalization_matrix?.skill_profile;
      if (skills) {
        latestScores.cooking_confidence = skills.confidence_score || 0;
      }
    }

    // Extract active goals
    const activeGoals = activeMilestones
      .slice(0, 5)
      .map((m) => m.milestone_name);

    // Identify priority areas
    const priorityAreas = progressTrajectory.areas_of_concern.slice(0, 3);

    return {
      latest_scores: latestScores,
      active_goals: activeGoals,
      priority_areas: priorityAreas,
    };
  }

  /**
   * Create minimal context for error cases
   */
  private createMinimalContext(): LongitudinalContext {
    return {
      user_history: {
        total_evaluations: 0,
        evaluation_timeline: [],
        first_evaluation_date: null,
        most_recent_evaluation_date: null,
        evaluation_frequency_days: 0,
      },
      progress_trajectory: {
        overall_trend: 'stable',
        category_trends: {},
        key_improvements: [],
        areas_of_concern: [],
      },
      milestones: {
        total_milestones: 0,
        achieved_count: 0,
        in_progress_count: 0,
        achievement_rate: 0,
        recent_achievements: [],
      },
      conversation_history: {
        total_conversations: 0,
        most_recent_conversation_date: null,
        conversation_topics: [],
      },
      current_state: {
        latest_scores: {},
        active_goals: [],
        priority_areas: [],
      },
    };
  }

  /**
   * Format context for AI prompt
   */
  formatForPrompt(context: LongitudinalContext): string {
    const parts: string[] = [];

    // User History
    if (context.user_history.total_evaluations > 0) {
      parts.push(
        `**Patient Journey**: ${context.user_history.total_evaluations} evaluations over ${this.calculateTimeSpan(context.user_history)}`
      );
      parts.push(
        `Evaluation frequency: approximately every ${context.user_history.evaluation_frequency_days} days`
      );
    }

    // Progress Trajectory
    parts.push(
      `\n**Progress Trajectory**: Overall trend is ${context.progress_trajectory.overall_trend}`
    );

    if (context.progress_trajectory.key_improvements.length > 0) {
      parts.push(
        `Key improvements: ${context.progress_trajectory.key_improvements.join(', ')}`
      );
    }

    if (context.progress_trajectory.areas_of_concern.length > 0) {
      parts.push(
        `Areas needing attention: ${context.progress_trajectory.areas_of_concern.join(', ')}`
      );
    }

    // Milestones
    if (context.milestones.total_milestones > 0) {
      parts.push(
        `\n**Milestones**: ${context.milestones.achieved_count} of ${context.milestones.total_milestones} achieved (${context.milestones.achievement_rate.toFixed(0)}% success rate)`
      );

      if (context.milestones.recent_achievements.length > 0) {
        parts.push(
          `Recent achievements: ${context.milestones.recent_achievements.map((a) => a.name).join(', ')}`
        );
      }
    }

    // Current State
    if (Object.keys(context.current_state.latest_scores).length > 0) {
      parts.push(`\n**Current State**:`);
      for (const [metric, score] of Object.entries(
        context.current_state.latest_scores
      )) {
        parts.push(`- ${metric.replace(/_/g, ' ')}: ${score.toFixed(0)}/100`);
      }
    }

    if (context.current_state.active_goals.length > 0) {
      parts.push(
        `Active goals: ${context.current_state.active_goals.join(', ')}`
      );
    }

    return parts.join('\n');
  }

  /**
   * Calculate time span from evaluation history
   */
  private calculateTimeSpan(
    history: LongitudinalContext['user_history']
  ): string {
    if (
      !history.first_evaluation_date ||
      !history.most_recent_evaluation_date
    ) {
      return 'unknown period';
    }

    const days = Math.ceil(
      (history.most_recent_evaluation_date.getTime() -
        history.first_evaluation_date.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick context builder for immediate use
 */
export const buildLongitudinalContext = async (
  userId: string
): Promise<LongitudinalContext> => {
  const builder = new LongitudinalContextBuilder();
  return await builder.buildContext(userId);
};

/**
 * Format context as a summary string
 */
export const formatContextSummary = (context: LongitudinalContext): string => {
  const builder = new LongitudinalContextBuilder();
  return builder.formatForPrompt(context);
};
