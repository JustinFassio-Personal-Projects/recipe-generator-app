/**
 * Progress Tracking API Layer
 *
 * Extracts progress metrics from evaluation reports and manages
 * progress tracking data for longitudinal health analysis.
 */

import { supabase } from '@/lib/supabase';
import type { EvaluationReport } from './evaluation-report-types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressMetric {
  user_id: string;
  report_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metric_category:
    | 'nutritional'
    | 'skill_development'
    | 'behavioral'
    | 'goal_achievement';
  progress_direction?: 'improving' | 'declining' | 'stable';
  significance_level?: number;
  change_percentage?: number;
}

export interface ProgressComparison {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change: number;
  change_percentage: number;
  direction: 'improving' | 'declining' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface UserProgressConfig {
  user_id: string;
  category_weights: {
    nutritional: number;
    skill_development: number;
    behavioral: number;
    goal_achievement: number;
  };
}

// ============================================================================
// METRIC EXTRACTION
// ============================================================================

/**
 * Extract all trackable metrics from an evaluation report
 */
export const extractMetricsFromReport = (
  userId: string,
  report: EvaluationReport
): ProgressMetric[] => {
  const metrics: ProgressMetric[] = [];
  const reportData = report.user_evaluation_report;
  const reportId = reportData.report_id;

  // Nutritional metrics
  if (reportData.nutritional_analysis?.current_status) {
    const nutrition = reportData.nutritional_analysis.current_status;

    if (nutrition.overall_diet_quality_score !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'overall_diet_quality_score',
        metric_value: nutrition.overall_diet_quality_score,
        metric_unit: 'percentage',
        metric_category: 'nutritional',
      });
    }

    if (nutrition.nutritional_completeness !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'nutritional_completeness',
        metric_value: nutrition.nutritional_completeness,
        metric_unit: 'percentage',
        metric_category: 'nutritional',
      });
    }

    if (nutrition.anti_inflammatory_index !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'anti_inflammatory_index',
        metric_value: nutrition.anti_inflammatory_index,
        metric_unit: 'percentage',
        metric_category: 'nutritional',
      });
    }

    if (nutrition.gut_health_score !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'gut_health_score',
        metric_value: nutrition.gut_health_score,
        metric_unit: 'percentage',
        metric_category: 'nutritional',
      });
    }

    if (nutrition.metabolic_health_score !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'metabolic_health_score',
        metric_value: nutrition.metabolic_health_score,
        metric_unit: 'percentage',
        metric_category: 'nutritional',
      });
    }
  }

  // Skill development metrics
  if (reportData.personalization_matrix?.skill_profile) {
    const skills = reportData.personalization_matrix.skill_profile;

    if (skills.confidence_score !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'cooking_confidence_score',
        metric_value: skills.confidence_score,
        metric_unit: 'percentage',
        metric_category: 'skill_development',
      });
    }

    if (skills.recommended_techniques) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'technique_count',
        metric_value: skills.recommended_techniques.length,
        metric_unit: 'count',
        metric_category: 'skill_development',
      });
    }
  }

  // Equipment utilization
  if (reportData.personalization_matrix?.equipment_optimization) {
    const equipment = reportData.personalization_matrix.equipment_optimization;

    if (equipment.utilization_rate !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'equipment_utilization_rate',
        metric_value: equipment.utilization_rate,
        metric_unit: 'percentage',
        metric_category: 'behavioral',
      });
    }
  }

  // Time efficiency
  if (reportData.personalization_matrix?.time_analysis) {
    const time = reportData.personalization_matrix.time_analysis;

    if (time.time_utilization_efficiency !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'time_utilization_efficiency',
        metric_value: time.time_utilization_efficiency,
        metric_unit: 'percentage',
        metric_category: 'behavioral',
      });
    }
  }

  // Overall scores from report metadata
  if (reportData.user_profile_summary) {
    const profile = reportData.user_profile_summary;

    if (profile.evaluation_completeness !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'evaluation_completeness',
        metric_value: profile.evaluation_completeness,
        metric_unit: 'percentage',
        metric_category: 'goal_achievement',
      });
    }

    if (profile.data_quality_score !== undefined) {
      metrics.push({
        user_id: userId,
        report_id: reportId,
        metric_name: 'data_quality_score',
        metric_value: profile.data_quality_score,
        metric_unit: 'percentage',
        metric_category: 'goal_achievement',
      });
    }
  }

  return metrics;
};

// ============================================================================
// PROGRESS METRIC OPERATIONS
// ============================================================================

/**
 * Save progress metrics to database
 */
export const saveProgressMetrics = async (
  metrics: ProgressMetric[]
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('evaluation_progress_tracking')
      .insert(metrics);

    if (error) {
      console.error('Error saving progress metrics:', error);
      throw new Error(`Failed to save progress metrics: ${error.message}`);
    }

    console.log(`Saved ${metrics.length} progress metrics`);
  } catch (error) {
    console.error('Error in saveProgressMetrics:', error);
    throw error;
  }
};

/**
 * Get progress metrics for a user
 */
export const getUserProgressMetrics = async (
  userId: string,
  metricName?: string,
  category?:
    | 'nutritional'
    | 'skill_development'
    | 'behavioral'
    | 'goal_achievement',
  limit?: number
): Promise<ProgressMetric[]> => {
  try {
    let query = supabase
      .from('evaluation_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    if (category) {
      query = query.eq('metric_category', category);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting progress metrics:', error);
      throw new Error(`Failed to get progress metrics: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserProgressMetrics:', error);
    throw error;
  }
};

/**
 * Get progress metrics for a specific report
 */
export const getReportProgressMetrics = async (
  reportId: string
): Promise<ProgressMetric[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_progress_tracking')
      .select('*')
      .eq('report_id', reportId);

    if (error) {
      console.error('Error getting report metrics:', error);
      throw new Error(`Failed to get report metrics: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReportProgressMetrics:', error);
    throw error;
  }
};

/**
 * Get metric history over time
 */
export const getMetricHistory = async (
  userId: string,
  metricName: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ value: number; date: string; report_id: string }>> => {
  try {
    let query = supabase
      .from('evaluation_progress_tracking')
      .select('metric_value, created_at, report_id')
      .eq('user_id', userId)
      .eq('metric_name', metricName)
      .order('created_at', { ascending: true });

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting metric history:', error);
      throw new Error(`Failed to get metric history: ${error.message}`);
    }

    return (data || []).map((item) => ({
      value: item.metric_value,
      date: item.created_at,
      report_id: item.report_id,
    }));
  } catch (error) {
    console.error('Error in getMetricHistory:', error);
    throw error;
  }
};

// ============================================================================
// PROGRESS COMPARISON
// ============================================================================

/**
 * Compare metrics between two reports
 */
export const compareReportMetrics = async (
  currentReportId: string,
  previousReportId: string
): Promise<ProgressComparison[]> => {
  try {
    const [currentMetrics, previousMetrics] = await Promise.all([
      getReportProgressMetrics(currentReportId),
      getReportProgressMetrics(previousReportId),
    ]);

    const comparisons: ProgressComparison[] = [];

    // Create a map of previous metrics for quick lookup
    const previousMap = new Map(
      previousMetrics.map((m) => [m.metric_name, m.metric_value])
    );

    for (const current of currentMetrics) {
      const previousValue = previousMap.get(current.metric_name);

      if (previousValue !== undefined) {
        const change = current.metric_value - previousValue;
        const changePercentage =
          previousValue !== 0 ? (change / previousValue) * 100 : 0;

        let direction: 'improving' | 'declining' | 'stable' = 'stable';
        if (changePercentage > 5) direction = 'improving';
        else if (changePercentage < -5) direction = 'declining';

        let significance: 'low' | 'medium' | 'high' = 'low';
        const absChange = Math.abs(changePercentage);
        if (absChange > 20) significance = 'high';
        else if (absChange > 10) significance = 'medium';

        comparisons.push({
          metric_name: current.metric_name,
          current_value: current.metric_value,
          previous_value: previousValue,
          change,
          change_percentage: changePercentage,
          direction,
          significance,
        });
      }
    }

    return comparisons;
  } catch (error) {
    console.error('Error in compareReportMetrics:', error);
    throw error;
  }
};

/**
 * Update metrics with comparison data
 */
export const updateMetricsWithComparison = async (
  reportId: string,
  comparisons: ProgressComparison[]
): Promise<void> => {
  try {
    // Update each metric with progress direction and change percentage
    for (const comparison of comparisons) {
      await supabase
        .from('evaluation_progress_tracking')
        .update({
          progress_direction: comparison.direction,
          change_percentage: comparison.change_percentage,
          significance_level:
            comparison.significance === 'high'
              ? 0.8
              : comparison.significance === 'medium'
                ? 0.5
                : 0.2,
        })
        .eq('report_id', reportId)
        .eq('metric_name', comparison.metric_name);
    }

    console.log(`Updated ${comparisons.length} metrics with comparison data`);
  } catch (error) {
    console.error('Error in updateMetricsWithComparison:', error);
    throw error;
  }
};

// ============================================================================
// USER PROGRESS CONFIG
// ============================================================================

/**
 * Get user progress configuration
 */
export const getUserProgressConfig = async (
  userId: string
): Promise<UserProgressConfig> => {
  try {
    const { data, error } = await supabase
      .from('user_progress_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No config found, return defaults
        return {
          user_id: userId,
          category_weights: {
            nutritional: 0.3,
            skill_development: 0.25,
            behavioral: 0.25,
            goal_achievement: 0.2,
          },
        };
      }
      console.error('Error getting progress config:', error);
      throw new Error(`Failed to get progress config: ${error.message}`);
    }

    return {
      user_id: data.user_id,
      category_weights: data.category_weights,
    };
  } catch (error) {
    console.error('Error in getUserProgressConfig:', error);
    throw error;
  }
};

/**
 * Update user progress configuration
 */
export const updateUserProgressConfig = async (
  config: UserProgressConfig
): Promise<void> => {
  try {
    // Validate weights sum to 1.0
    const weights = config.category_weights;
    const total =
      weights.nutritional +
      weights.skill_development +
      weights.behavioral +
      weights.goal_achievement;

    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Category weights must sum to 1.0');
    }

    const { error } = await supabase.from('user_progress_config').upsert({
      user_id: config.user_id,
      category_weights: config.category_weights,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error updating progress config:', error);
      throw new Error(`Failed to update progress config: ${error.message}`);
    }

    console.log('Progress config updated for user:', config.user_id);
  } catch (error) {
    console.error('Error in updateUserProgressConfig:', error);
    throw error;
  }
};

// ============================================================================
// PROGRESS SUMMARY
// ============================================================================

/**
 * Get progress summary by category
 */
export const getProgressSummaryByCategory = async (
  userId: string
): Promise<
  Record<
    string,
    {
      avg_value: number;
      improving_count: number;
      declining_count: number;
      stable_count: number;
      total_metrics: number;
    }
  >
> => {
  try {
    const { data, error } = await supabase
      .from('user_progress_summary')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting progress summary:', error);
      throw new Error(`Failed to get progress summary: ${error.message}`);
    }

    const summary: Record<
      string,
      {
        avg_value: number;
        improving_count: number;
        declining_count: number;
        stable_count: number;
        total_metrics: number;
      }
    > = {};

    for (const row of data || []) {
      summary[row.metric_category as string] = {
        avg_value: Number(row.avg_value),
        improving_count: Number(row.improving_count),
        declining_count: Number(row.declining_count),
        stable_count: Number(row.stable_count),
        total_metrics: Number(row.total_metrics),
      };
    }

    return summary;
  } catch (error) {
    console.error('Error in getProgressSummaryByCategory:', error);
    throw error;
  }
};

// ============================================================================
// REPORT INTEGRATION
// ============================================================================

/**
 * Process evaluation report and save progress metrics
 * This is the main integration point called when a report is saved
 */
export const processEvaluationReport = async (
  userId: string,
  report: EvaluationReport,
  previousReportId?: string
): Promise<void> => {
  try {
    // Extract metrics from report
    const metrics = extractMetricsFromReport(userId, report);

    // Save metrics to database
    await saveProgressMetrics(metrics);

    // If there's a previous report, compare and update
    if (previousReportId) {
      const comparisons = await compareReportMetrics(
        report.user_evaluation_report.report_id,
        previousReportId
      );

      await updateMetricsWithComparison(
        report.user_evaluation_report.report_id,
        comparisons
      );
    }

    console.log('Evaluation report processed for progress tracking');
  } catch (error) {
    console.error('Error processing evaluation report:', error);
    throw error;
  }
};
