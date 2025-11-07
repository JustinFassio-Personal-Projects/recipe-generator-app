/**
 * Progress Scoring System
 *
 * Calculates comprehensive progress scores with configurable category weights
 * for personalized health assessment.
 */

import type { EvaluationReport } from '../evaluation-report-types';
import type { ComparisonResult } from './comparison-engine';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressScore {
  overall_score: number;
  category_scores: {
    nutritional: number;
    skill_development: number;
    behavioral: number;
    goal_achievement: number;
  };
  improvement_areas: string[];
  celebration_points: string[];
  concern_areas: string[];
  next_priorities: string[];
  scoring_date: string;
}

export interface CategoryWeights {
  nutritional: number;
  skill_development: number;
  behavioral: number;
  goal_achievement: number;
}

// ============================================================================
// PROGRESS SCORER CLASS
// ============================================================================

export class ProgressScorer {
  private categoryWeights: CategoryWeights;

  constructor(categoryWeights?: CategoryWeights) {
    this.categoryWeights = categoryWeights || {
      nutritional: 0.3,
      skill_development: 0.25,
      behavioral: 0.25,
      goal_achievement: 0.2,
    };
  }

  /**
   * Calculate comprehensive progress score
   */
  async calculateProgressScore(
    currentReport: EvaluationReport,
    previousReport?: EvaluationReport,
    comparisons?: ComparisonResult[]
  ): Promise<ProgressScore> {
    // Calculate category scores
    const nutritionalScore = this.calculateNutritionalScore(
      currentReport,
      previousReport,
      comparisons
    );

    const skillScore = this.calculateSkillScore(
      currentReport,
      previousReport,
      comparisons
    );

    const behavioralScore = this.calculateBehavioralScore(
      currentReport,
      previousReport,
      comparisons
    );

    const goalScore = this.calculateGoalScore(
      currentReport,
      previousReport,
      comparisons
    );

    // Calculate weighted overall score
    const overallScore =
      nutritionalScore * this.categoryWeights.nutritional +
      skillScore * this.categoryWeights.skill_development +
      behavioralScore * this.categoryWeights.behavioral +
      goalScore * this.categoryWeights.goal_achievement;

    // Generate insights
    const categoryScores = {
      nutritional: nutritionalScore,
      skill_development: skillScore,
      behavioral: behavioralScore,
      goal_achievement: goalScore,
    };

    const improvementAreas = this.identifyImprovementAreas(
      categoryScores,
      comparisons
    );
    const celebrationPoints = this.identifyCelebrationPoints(
      categoryScores,
      comparisons
    );
    const concernAreas = this.identifyConcernAreas(categoryScores, comparisons);
    const nextPriorities = this.identifyNextPriorities(
      improvementAreas,
      concernAreas
    );

    return {
      overall_score: Math.round(overallScore * 100) / 100,
      category_scores: {
        nutritional: Math.round(nutritionalScore * 100) / 100,
        skill_development: Math.round(skillScore * 100) / 100,
        behavioral: Math.round(behavioralScore * 100) / 100,
        goal_achievement: Math.round(goalScore * 100) / 100,
      },
      improvement_areas: improvementAreas,
      celebration_points: celebrationPoints,
      concern_areas: concernAreas,
      next_priorities: nextPriorities,
      scoring_date: new Date().toISOString(),
    };
  }

  /**
   * Calculate nutritional category score
   */
  private calculateNutritionalScore(
    current: EvaluationReport,
    previous?: EvaluationReport,
    comparisons?: ComparisonResult[]
  ): number {
    const currentNutrition =
      current.user_evaluation_report.nutritional_analysis?.current_status;

    if (!currentNutrition) return 50; // Default middle score

    // Base score from current values
    const dietQuality = currentNutrition.overall_diet_quality_score || 0;
    const completeness = currentNutrition.nutritional_completeness || 0;
    const antiInflammatory = currentNutrition.anti_inflammatory_index || 0;
    const gutHealth = currentNutrition.gut_health_score || 0;
    const metabolicHealth = currentNutrition.metabolic_health_score || 0;

    let baseScore =
      (dietQuality +
        completeness +
        antiInflammatory +
        gutHealth +
        metabolicHealth) /
      5;

    // Apply improvement bonus if previous report exists
    if (previous && comparisons) {
      const nutritionalComparisons = comparisons.filter(
        (c) => c.category === 'nutritional'
      );
      const improvementBonus = this.calculateImprovementBonus(
        nutritionalComparisons
      );
      baseScore = baseScore * (1 + improvementBonus);
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate skill development category score
   */
  private calculateSkillScore(
    current: EvaluationReport,
    previous?: EvaluationReport,
    comparisons?: ComparisonResult[]
  ): number {
    const currentSkills =
      current.user_evaluation_report.personalization_matrix?.skill_profile;

    if (!currentSkills) return 50;

    // Base score from current values
    const confidence = currentSkills.confidence_score || 0;
    const techniqueCount = currentSkills.recommended_techniques?.length || 0;
    const techniqueScore = Math.min(100, techniqueCount * 10); // 10 points per technique

    let baseScore = (confidence + techniqueScore) / 2;

    // Apply improvement bonus
    if (previous && comparisons) {
      const skillComparisons = comparisons.filter(
        (c) => c.category === 'skill'
      );
      const improvementBonus = this.calculateImprovementBonus(skillComparisons);
      baseScore = baseScore * (1 + improvementBonus);
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate behavioral category score
   */
  private calculateBehavioralScore(
    current: EvaluationReport,
    previous?: EvaluationReport,
    comparisons?: ComparisonResult[]
  ): number {
    const currentEquipment =
      current.user_evaluation_report.personalization_matrix
        ?.equipment_optimization;
    const currentTime =
      current.user_evaluation_report.personalization_matrix?.time_analysis;

    if (!currentEquipment && !currentTime) return 50;

    // Base score from current values
    const equipmentUtilization = currentEquipment?.utilization_rate || 0;
    const timeEfficiency = currentTime?.time_utilization_efficiency || 0;

    let baseScore = (equipmentUtilization + timeEfficiency) / 2;

    // Apply improvement bonus
    if (previous && comparisons) {
      const behavioralComparisons = comparisons.filter(
        (c) => c.category === 'behavioral'
      );
      const improvementBonus = this.calculateImprovementBonus(
        behavioralComparisons
      );
      baseScore = baseScore * (1 + improvementBonus);
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate goal achievement category score
   */
  private calculateGoalScore(
    current: EvaluationReport,
    previous?: EvaluationReport,
    comparisons?: ComparisonResult[]
  ): number {
    const currentProfile = current.user_evaluation_report.user_profile_summary;

    if (!currentProfile) return 50;

    // Base score from current values
    const completeness = currentProfile.evaluation_completeness || 0;
    const dataQuality = currentProfile.data_quality_score || 0;

    let baseScore = (completeness + dataQuality) / 2;

    // Apply improvement bonus
    if (previous && comparisons) {
      const goalComparisons = comparisons.filter((c) => c.category === 'goal');
      const improvementBonus = this.calculateImprovementBonus(goalComparisons);
      baseScore = baseScore * (1 + improvementBonus);
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate improvement bonus from comparisons
   */
  private calculateImprovementBonus(comparisons: ComparisonResult[]): number {
    if (comparisons.length === 0) return 0;

    const improvingCount = comparisons.filter(
      (c) => c.trend === 'improving'
    ).length;
    const decliningCount = comparisons.filter(
      (c) => c.trend === 'declining'
    ).length;

    // Bonus/penalty based on net improvements
    const netImprovement = improvingCount - decliningCount;
    const bonusPercentage = (netImprovement / comparisons.length) * 0.2; // Up to 20% bonus

    return bonusPercentage;
  }

  /**
   * Identify areas for improvement
   */
  private identifyImprovementAreas(
    categoryScores: Record<string, number>,
    comparisons?: ComparisonResult[]
  ): string[] {
    const areas: string[] = [];

    // Identify low-scoring categories
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score < 60) {
        areas.push(
          `${category.replace(/_/g, ' ')} needs attention (score: ${score.toFixed(0)})`
        );
      }
    }

    // Add specific metrics that are declining
    if (comparisons) {
      const declining = comparisons
        .filter((c) => c.trend === 'declining' && c.significance !== 'low')
        .slice(0, 3);

      for (const comparison of declining) {
        areas.push(`${comparison.metric_name.replace(/_/g, ' ')} is declining`);
      }
    }

    return areas;
  }

  /**
   * Identify celebration points
   */
  private identifyCelebrationPoints(
    categoryScores: Record<string, number>,
    comparisons?: ComparisonResult[]
  ): string[] {
    const points: string[] = [];

    // Celebrate high scores
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score >= 80) {
        points.push(
          `Excellent ${category.replace(/_/g, ' ')} performance (score: ${score.toFixed(0)})`
        );
      }
    }

    // Celebrate significant improvements
    if (comparisons) {
      const improving = comparisons
        .filter((c) => c.trend === 'improving' && c.significance === 'high')
        .slice(0, 3);

      for (const comparison of improving) {
        points.push(
          `${comparison.metric_name.replace(/_/g, ' ')} improved by ${comparison.change_percentage.toFixed(1)}%`
        );
      }
    }

    return points;
  }

  /**
   * Identify areas of concern
   */
  private identifyConcernAreas(
    categoryScores: Record<string, number>,
    comparisons?: ComparisonResult[]
  ): string[] {
    const concerns: string[] = [];

    // Identify very low scores
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score < 40) {
        concerns.push(
          `${category.replace(/_/g, ' ')} requires immediate attention`
        );
      }
    }

    // Add significantly declining metrics
    if (comparisons) {
      const declining = comparisons
        .filter((c) => c.trend === 'declining' && c.significance === 'high')
        .slice(0, 3);

      for (const comparison of declining) {
        concerns.push(
          `${comparison.metric_name.replace(/_/g, ' ')} declined by ${Math.abs(comparison.change_percentage).toFixed(1)}%`
        );
      }
    }

    return concerns;
  }

  /**
   * Identify next priorities
   */
  private identifyNextPriorities(
    improvementAreas: string[],
    concernAreas: string[]
  ): string[] {
    const priorities: string[] = [];

    // Prioritize concerns first
    if (concernAreas.length > 0) {
      priorities.push('Address areas of concern immediately');
      priorities.push(...concernAreas.slice(0, 2));
    }

    // Then improvement areas
    if (improvementAreas.length > 0) {
      priorities.push('Focus on improvement opportunities');
      priorities.push(...improvementAreas.slice(0, 2));
    }

    // General recommendation if no specific priorities
    if (priorities.length === 0) {
      priorities.push('Continue current health strategies');
      priorities.push('Consider setting new challenging goals');
    }

    return priorities.slice(0, 5); // Limit to top 5 priorities
  }

  /**
   * Update category weights
   */
  updateWeights(weights: CategoryWeights): void {
    // Validate weights sum to 1.0
    const total = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Category weights must sum to 1.0');
    }

    this.categoryWeights = weights;
  }

  /**
   * Get current weights
   */
  getWeights(): CategoryWeights {
    return { ...this.categoryWeights };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format progress score for display
 */
export const formatProgressScore = (score: ProgressScore): string => {
  return `Overall: ${score.overall_score}/100 | Nutrition: ${score.category_scores.nutritional}/100 | Skills: ${score.category_scores.skill_development}/100 | Behavioral: ${score.category_scores.behavioral}/100`;
};

/**
 * Get score color based on value
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
};

/**
 * Get score emoji based on value
 */
export const getScoreEmoji = (score: number): string => {
  if (score >= 90) return '🌟';
  if (score >= 80) return '✅';
  if (score >= 70) return '👍';
  if (score >= 60) return '📈';
  if (score >= 50) return '➡️';
  return '⚠️';
};
