/**
 * Progress Comparison Engine
 *
 * Compares evaluations across time to identify progress, improvements,
 * and areas needing attention.
 */

import type { EvaluationReport } from '../evaluation-report-types';

// ============================================================================
// TYPES
// ============================================================================

export interface ComparisonResult {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change: number;
  change_percentage: number;
  change_magnitude: 'small' | 'medium' | 'large';
  significance: 'low' | 'medium' | 'high';
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  category: 'nutritional' | 'skill' | 'behavioral' | 'goal';
}

export interface DetailedComparison {
  overall_summary: {
    total_metrics_compared: number;
    improving_count: number;
    declining_count: number;
    stable_count: number;
    overall_trend: 'improving' | 'declining' | 'stable';
    average_change_percentage: number;
  };
  nutritional_comparison: ComparisonResult[];
  skill_comparison: ComparisonResult[];
  behavioral_comparison: ComparisonResult[];
  goal_comparison: ComparisonResult[];
  key_improvements: string[];
  areas_of_concern: string[];
}

// ============================================================================
// COMPARISON ENGINE CLASS
// ============================================================================

export class ProgressComparisonEngine {
  private readonly SIGNIFICANCE_THRESHOLDS = {
    low: 10,
    medium: 20,
    high: 30,
  };

  private readonly MAGNITUDE_THRESHOLDS = {
    small: 5,
    medium: 15,
    large: 30,
  };

  /**
   * Compare two evaluation reports
   */
  async compareEvaluations(
    currentReport: EvaluationReport,
    previousReport: EvaluationReport
  ): Promise<DetailedComparison> {
    const nutritionalComparison = this.compareNutritionalAnalysis(
      currentReport,
      previousReport
    );

    const skillComparison = this.compareSkillProfile(
      currentReport,
      previousReport
    );

    const behavioralComparison = this.compareBehavioralMetrics(
      currentReport,
      previousReport
    );

    const goalComparison = this.compareGoalMetrics(
      currentReport,
      previousReport
    );

    const allComparisons = [
      ...nutritionalComparison,
      ...skillComparison,
      ...behavioralComparison,
      ...goalComparison,
    ];

    const summary = this.createSummary(allComparisons);
    const keyImprovements = this.identifyKeyImprovements(allComparisons);
    const areasOfConcern = this.identifyAreasOfConcern(allComparisons);

    return {
      overall_summary: summary,
      nutritional_comparison: nutritionalComparison,
      skill_comparison: skillComparison,
      behavioral_comparison: behavioralComparison,
      goal_comparison: goalComparison,
      key_improvements: keyImprovements,
      areas_of_concern: areasOfConcern,
    };
  }

  /**
   * Compare nutritional analysis between reports
   */
  private compareNutritionalAnalysis(
    current: EvaluationReport,
    previous: EvaluationReport
  ): ComparisonResult[] {
    const comparisons: ComparisonResult[] = [];
    const currentNutrition =
      current.user_evaluation_report.nutritional_analysis?.current_status;
    const previousNutrition =
      previous.user_evaluation_report.nutritional_analysis?.current_status;

    if (!currentNutrition || !previousNutrition) return comparisons;

    // Diet quality score
    if (
      currentNutrition.overall_diet_quality_score !== undefined &&
      previousNutrition.overall_diet_quality_score !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'diet_quality_score',
          currentNutrition.overall_diet_quality_score,
          previousNutrition.overall_diet_quality_score,
          'nutritional'
        )
      );
    }

    // Nutritional completeness
    if (
      currentNutrition.nutritional_completeness !== undefined &&
      previousNutrition.nutritional_completeness !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'nutritional_completeness',
          currentNutrition.nutritional_completeness,
          previousNutrition.nutritional_completeness,
          'nutritional'
        )
      );
    }

    // Anti-inflammatory index
    if (
      currentNutrition.anti_inflammatory_index !== undefined &&
      previousNutrition.anti_inflammatory_index !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'anti_inflammatory_index',
          currentNutrition.anti_inflammatory_index,
          previousNutrition.anti_inflammatory_index,
          'nutritional'
        )
      );
    }

    // Gut health score
    if (
      currentNutrition.gut_health_score !== undefined &&
      previousNutrition.gut_health_score !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'gut_health_score',
          currentNutrition.gut_health_score,
          previousNutrition.gut_health_score,
          'nutritional'
        )
      );
    }

    // Metabolic health score
    if (
      currentNutrition.metabolic_health_score !== undefined &&
      previousNutrition.metabolic_health_score !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'metabolic_health_score',
          currentNutrition.metabolic_health_score,
          previousNutrition.metabolic_health_score,
          'nutritional'
        )
      );
    }

    return comparisons;
  }

  /**
   * Compare skill profile between reports
   */
  private compareSkillProfile(
    current: EvaluationReport,
    previous: EvaluationReport
  ): ComparisonResult[] {
    const comparisons: ComparisonResult[] = [];
    const currentSkills =
      current.user_evaluation_report.personalization_matrix?.skill_profile;
    const previousSkills =
      previous.user_evaluation_report.personalization_matrix?.skill_profile;

    if (!currentSkills || !previousSkills) return comparisons;

    // Confidence score
    if (
      currentSkills.confidence_score !== undefined &&
      previousSkills.confidence_score !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'cooking_confidence',
          currentSkills.confidence_score,
          previousSkills.confidence_score,
          'skill'
        )
      );
    }

    // Technique count
    if (
      currentSkills.recommended_techniques &&
      previousSkills.recommended_techniques
    ) {
      comparisons.push(
        this.createComparison(
          'technique_mastery',
          currentSkills.recommended_techniques.length,
          previousSkills.recommended_techniques.length,
          'skill'
        )
      );
    }

    return comparisons;
  }

  /**
   * Compare behavioral metrics between reports
   */
  private compareBehavioralMetrics(
    current: EvaluationReport,
    previous: EvaluationReport
  ): ComparisonResult[] {
    const comparisons: ComparisonResult[] = [];

    // Equipment utilization
    const currentEquipment =
      current.user_evaluation_report.personalization_matrix
        ?.equipment_optimization;
    const previousEquipment =
      previous.user_evaluation_report.personalization_matrix
        ?.equipment_optimization;

    if (
      currentEquipment?.utilization_rate !== undefined &&
      previousEquipment?.utilization_rate !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'equipment_utilization',
          currentEquipment.utilization_rate,
          previousEquipment.utilization_rate,
          'behavioral'
        )
      );
    }

    // Time efficiency
    const currentTime =
      current.user_evaluation_report.personalization_matrix?.time_analysis;
    const previousTime =
      previous.user_evaluation_report.personalization_matrix?.time_analysis;

    if (
      currentTime?.time_utilization_efficiency !== undefined &&
      previousTime?.time_utilization_efficiency !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'time_efficiency',
          currentTime.time_utilization_efficiency,
          previousTime.time_utilization_efficiency,
          'behavioral'
        )
      );
    }

    return comparisons;
  }

  /**
   * Compare goal-related metrics between reports
   */
  private compareGoalMetrics(
    current: EvaluationReport,
    previous: EvaluationReport
  ): ComparisonResult[] {
    const comparisons: ComparisonResult[] = [];

    const currentProfile = current.user_evaluation_report.user_profile_summary;
    const previousProfile =
      previous.user_evaluation_report.user_profile_summary;

    if (!currentProfile || !previousProfile) return comparisons;

    // Evaluation completeness
    if (
      currentProfile.evaluation_completeness !== undefined &&
      previousProfile.evaluation_completeness !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'evaluation_completeness',
          currentProfile.evaluation_completeness,
          previousProfile.evaluation_completeness,
          'goal'
        )
      );
    }

    // Data quality
    if (
      currentProfile.data_quality_score !== undefined &&
      previousProfile.data_quality_score !== undefined
    ) {
      comparisons.push(
        this.createComparison(
          'data_quality',
          currentProfile.data_quality_score,
          previousProfile.data_quality_score,
          'goal'
        )
      );
    }

    return comparisons;
  }

  /**
   * Create a comparison result for a single metric
   */
  private createComparison(
    metricName: string,
    currentValue: number,
    previousValue: number,
    category: 'nutritional' | 'skill' | 'behavioral' | 'goal'
  ): ComparisonResult {
    const change = currentValue - previousValue;
    const changePercentage =
      previousValue !== 0 ? (change / previousValue) * 100 : 0;

    const changeMagnitude = this.calculateChangeMagnitude(
      Math.abs(changePercentage)
    );

    const significance = this.calculateSignificance(Math.abs(changePercentage));

    const trend = this.determineTrend(changePercentage);
    const confidence = this.calculateConfidence(currentValue, previousValue);

    return {
      metric_name: metricName,
      current_value: currentValue,
      previous_value: previousValue,
      change,
      change_percentage: changePercentage,
      change_magnitude: changeMagnitude,
      significance,
      trend,
      confidence,
      category,
    };
  }

  /**
   * Calculate change magnitude
   */
  private calculateChangeMagnitude(
    changePercentage: number
  ): 'small' | 'medium' | 'large' {
    if (changePercentage >= this.MAGNITUDE_THRESHOLDS.large) return 'large';
    if (changePercentage >= this.MAGNITUDE_THRESHOLDS.medium) return 'medium';
    return 'small';
  }

  /**
   * Calculate significance level
   */
  private calculateSignificance(
    changePercentage: number
  ): 'low' | 'medium' | 'high' {
    if (changePercentage >= this.SIGNIFICANCE_THRESHOLDS.high) return 'high';
    if (changePercentage >= this.SIGNIFICANCE_THRESHOLDS.medium)
      return 'medium';
    return 'low';
  }

  /**
   * Determine trend direction
   */
  private determineTrend(
    changePercentage: number
  ): 'improving' | 'declining' | 'stable' {
    if (changePercentage > 5) return 'improving';
    if (changePercentage < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate confidence in comparison
   */
  private calculateConfidence(
    currentValue: number,
    previousValue: number
  ): number {
    // Higher confidence when values are more consistent
    // Lower confidence when there's high variance
    const variance =
      Math.abs(currentValue - previousValue) /
      Math.max(currentValue, previousValue, 1);
    return Math.max(0, Math.min(1, 1 - variance * 0.5));
  }

  /**
   * Create overall summary from all comparisons
   */
  private createSummary(
    comparisons: ComparisonResult[]
  ): DetailedComparison['overall_summary'] {
    const improvingCount = comparisons.filter(
      (c) => c.trend === 'improving'
    ).length;
    const decliningCount = comparisons.filter(
      (c) => c.trend === 'declining'
    ).length;
    const stableCount = comparisons.filter((c) => c.trend === 'stable').length;

    const totalChangePercentage = comparisons.reduce(
      (sum, c) => sum + c.change_percentage,
      0
    );
    const averageChangePercentage =
      comparisons.length > 0 ? totalChangePercentage / comparisons.length : 0;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvingCount > decliningCount && improvingCount > stableCount) {
      overallTrend = 'improving';
    } else if (
      decliningCount > improvingCount &&
      decliningCount > stableCount
    ) {
      overallTrend = 'declining';
    }

    return {
      total_metrics_compared: comparisons.length,
      improving_count: improvingCount,
      declining_count: decliningCount,
      stable_count: stableCount,
      overall_trend: overallTrend,
      average_change_percentage: averageChangePercentage,
    };
  }

  /**
   * Identify key improvements
   */
  private identifyKeyImprovements(comparisons: ComparisonResult[]): string[] {
    return comparisons
      .filter((c) => c.trend === 'improving' && c.significance !== 'low')
      .sort((a, b) => b.change_percentage - a.change_percentage)
      .slice(0, 5)
      .map((c) => {
        const metric = c.metric_name.replace(/_/g, ' ');
        const change = c.change_percentage.toFixed(1);
        return `${metric}: improved by ${change}%`;
      });
  }

  /**
   * Identify areas of concern
   */
  private identifyAreasOfConcern(comparisons: ComparisonResult[]): string[] {
    return comparisons
      .filter((c) => c.trend === 'declining' && c.significance !== 'low')
      .sort((a, b) => a.change_percentage - b.change_percentage)
      .slice(0, 5)
      .map((c) => {
        const metric = c.metric_name.replace(/_/g, ' ');
        const change = Math.abs(c.change_percentage).toFixed(1);
        return `${metric}: declined by ${change}%`;
      });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format comparison for display
 */
export const formatComparison = (comparison: ComparisonResult): string => {
  const direction =
    comparison.trend === 'improving'
      ? '↑'
      : comparison.trend === 'declining'
        ? '↓'
        : '→';
  const change = comparison.change_percentage.toFixed(1);
  const metric = comparison.metric_name.replace(/_/g, ' ');

  return `${direction} ${metric}: ${change}% (${comparison.significance} significance)`;
};

/**
 * Calculate category averages from comparisons
 */
export const calculateCategoryAverages = (
  comparisons: ComparisonResult[]
): Record<string, { avg_change: number; trend: string }> => {
  const categories = ['nutritional', 'skill', 'behavioral', 'goal'];
  const result: Record<string, { avg_change: number; trend: string }> = {};

  for (const category of categories) {
    const categoryComparisons = comparisons.filter(
      (c) => c.category === category
    );
    if (categoryComparisons.length === 0) continue;

    const avgChange =
      categoryComparisons.reduce((sum, c) => sum + c.change_percentage, 0) /
      categoryComparisons.length;

    const trend =
      avgChange > 5 ? 'improving' : avgChange < -5 ? 'declining' : 'stable';

    result[category] = {
      avg_change: avgChange,
      trend,
    };
  }

  return result;
};
