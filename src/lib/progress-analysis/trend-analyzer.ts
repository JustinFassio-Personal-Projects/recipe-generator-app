/**
 * Trend Analysis System
 *
 * Detects trends and patterns in health metrics over time using
 * statistical analysis and regression techniques.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TrendAnalysis {
  metric_name: string;
  trend_direction: 'upward' | 'downward' | 'stable' | 'volatile';
  trend_strength: 'weak' | 'moderate' | 'strong';
  trend_consistency: number;
  predicted_next_value: number;
  confidence_interval: [number, number];
  key_insights: string[];
  data_points: number;
  time_period_days: number;
}

export interface TrendStats {
  slope: number;
  intercept: number;
  rSquared: number;
  volatility: number;
  acceleration: number;
  dataPoints: number;
}

export interface PredictionResult {
  value: number;
  confidenceInterval: [number, number];
  confidence: number;
}

export interface DataPoint {
  value: number;
  date: Date;
}

// ============================================================================
// TREND ANALYZER CLASS
// ============================================================================

export class TrendAnalyzer {
  /**
   * Analyze trends for a specific metric
   */
  async analyzeTrends(
    metricName: string,
    dataPoints: DataPoint[]
  ): Promise<TrendAnalysis> {
    if (dataPoints.length < 3) {
      return this.createInsufficientDataAnalysis(metricName);
    }

    // Sort data points by date
    const sortedData = dataPoints.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const values = sortedData.map((d) => d.value);

    // Calculate trend statistics
    const trendStats = this.calculateTrendStatistics(values);

    // Determine trend characteristics
    const trendDirection = this.determineTrendDirection(trendStats);
    const trendStrength = this.calculateTrendStrength(trendStats);
    const trendConsistency = this.calculateTrendConsistency(values);

    // Generate predictions
    const prediction = this.predictNextValue(values, trendStats);

    // Extract insights
    const insights = this.generateInsights(
      trendStats,
      trendDirection,
      trendStrength,
      trendConsistency
    );

    // Calculate time period
    const timePeriodDays = Math.ceil(
      (sortedData[sortedData.length - 1].date.getTime() -
        sortedData[0].date.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      metric_name: metricName,
      trend_direction: trendDirection,
      trend_strength: trendStrength,
      trend_consistency: trendConsistency,
      predicted_next_value: prediction.value,
      confidence_interval: prediction.confidenceInterval,
      key_insights: insights,
      data_points: dataPoints.length,
      time_period_days: timePeriodDays,
    };
  }

  /**
   * Calculate statistical measures for trend analysis
   */
  private calculateTrendStatistics(dataPoints: number[]): TrendStats {
    const n = dataPoints.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = dataPoints;

    // Linear regression
    const slope = this.calculateSlope(x, y);
    const intercept = this.calculateIntercept(x, y, slope);
    const rSquared = this.calculateRSquared(x, y, slope, intercept);

    // Volatility analysis (standard deviation normalized)
    const volatility = this.calculateVolatility(dataPoints);

    // Acceleration (second derivative)
    const acceleration = this.calculateAcceleration(dataPoints);

    return {
      slope,
      intercept,
      rSquared,
      volatility,
      acceleration,
      dataPoints: n,
    };
  }

  /**
   * Calculate slope for linear regression
   */
  private calculateSlope(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Calculate intercept for linear regression
   */
  private calculateIntercept(x: number[], y: number[], slope: number): number {
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    return meanY - slope * meanX;
  }

  /**
   * Calculate R-squared (coefficient of determination)
   */
  private calculateRSquared(
    x: number[],
    y: number[],
    slope: number,
    intercept: number
  ): number {
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;

    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < x.length; i++) {
      const predicted = slope * x[i] + intercept;
      ssTotal += (y[i] - meanY) ** 2;
      ssResidual += (y[i] - predicted) ** 2;
    }

    return 1 - ssResidual / ssTotal;
  }

  /**
   * Calculate volatility (normalized standard deviation)
   */
  private calculateVolatility(dataPoints: number[]): number {
    if (dataPoints.length < 2) return 0;

    const mean = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
    const variance =
      dataPoints.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
      dataPoints.length;
    const stdDev = Math.sqrt(variance);

    // Normalize by mean to get coefficient of variation
    return mean !== 0 ? stdDev / mean : 0;
  }

  /**
   * Calculate acceleration (change in slope)
   */
  private calculateAcceleration(dataPoints: number[]): number {
    if (dataPoints.length < 3) return 0;

    // Calculate slopes between consecutive points
    const slopes: number[] = [];
    for (let i = 1; i < dataPoints.length; i++) {
      slopes.push(dataPoints[i] - dataPoints[i - 1]);
    }

    // Calculate change in slopes (acceleration)
    let accelerationSum = 0;
    for (let i = 1; i < slopes.length; i++) {
      accelerationSum += slopes[i] - slopes[i - 1];
    }

    return slopes.length > 1 ? accelerationSum / (slopes.length - 1) : 0;
  }

  /**
   * Determine overall trend direction
   */
  private determineTrendDirection(
    stats: TrendStats
  ): 'upward' | 'downward' | 'stable' | 'volatile' {
    const { slope, rSquared, volatility } = stats;

    // High volatility indicates volatile trend
    if (volatility > 0.3) return 'volatile';

    // Low R-squared indicates unreliable trend
    if (rSquared < 0.3) return 'volatile';

    // Determine direction based on slope
    if (slope > 0.5) return 'upward';
    if (slope < -0.5) return 'downward';
    return 'stable';
  }

  /**
   * Calculate trend strength
   */
  private calculateTrendStrength(
    stats: TrendStats
  ): 'weak' | 'moderate' | 'strong' {
    const { rSquared } = stats;

    if (rSquared > 0.7) return 'strong';
    if (rSquared > 0.4) return 'moderate';
    return 'weak';
  }

  /**
   * Calculate trend consistency
   */
  private calculateTrendConsistency(dataPoints: number[]): number {
    if (dataPoints.length < 2) return 0;

    // Calculate how consistently the trend moves in the same direction
    let consistentMoves = 0;
    let totalMoves = 0;

    for (let i = 1; i < dataPoints.length; i++) {
      const currentDirection = dataPoints[i] > dataPoints[i - 1] ? 1 : -1;

      // Compare with overall trend
      const overallDirection =
        dataPoints[dataPoints.length - 1] > dataPoints[0] ? 1 : -1;

      if (currentDirection === overallDirection) {
        consistentMoves++;
      }
      totalMoves++;
    }

    return totalMoves > 0 ? consistentMoves / totalMoves : 0;
  }

  /**
   * Predict next value
   */
  private predictNextValue(
    dataPoints: number[],
    stats: TrendStats
  ): PredictionResult {
    const nextIndex = dataPoints.length;
    const predictedValue = stats.slope * nextIndex + stats.intercept;

    // Calculate confidence interval based on volatility and R-squared
    const standardError = this.calculateStandardError(dataPoints, stats);
    const marginOfError = 1.96 * standardError; // 95% confidence interval

    const confidenceInterval: [number, number] = [
      Math.max(0, predictedValue - marginOfError),
      Math.min(100, predictedValue + marginOfError),
    ];

    const confidence = stats.rSquared;

    return {
      value: Math.max(0, Math.min(100, predictedValue)),
      confidenceInterval,
      confidence,
    };
  }

  /**
   * Calculate standard error for prediction
   */
  private calculateStandardError(
    dataPoints: number[],
    stats: TrendStats
  ): number {
    const n = dataPoints.length;

    let sumSquaredErrors = 0;
    for (let i = 0; i < n; i++) {
      const predicted = stats.slope * i + stats.intercept;
      sumSquaredErrors += (dataPoints[i] - predicted) ** 2;
    }

    const mse = sumSquaredErrors / (n - 2); // n-2 for degrees of freedom
    return Math.sqrt(mse);
  }

  /**
   * Generate insights from trend analysis
   */
  private generateInsights(
    stats: TrendStats,
    direction: string,
    strength: string,
    consistency: number
  ): string[] {
    const insights: string[] = [];

    // Direction and strength insights
    if (direction === 'upward' && strength === 'strong') {
      insights.push('Consistent improvement trend detected');
      insights.push(
        'Strong positive trajectory indicates effective strategies'
      );
    } else if (direction === 'downward' && strength === 'strong') {
      insights.push('Concerning decline in this metric');
      insights.push('Immediate attention and intervention recommended');
    } else if (direction === 'volatile') {
      insights.push('Inconsistent progress pattern observed');
      insights.push(
        'Consider stabilizing factors before focusing on improvement'
      );
    } else if (direction === 'stable') {
      insights.push('Metric is maintaining current level');
      insights.push('May be ready for next level of challenges');
    }

    // Consistency insights
    if (consistency > 0.8) {
      insights.push('Highly consistent progress pattern');
    } else if (consistency < 0.5) {
      insights.push(
        'Variable progress - look for external factors affecting consistency'
      );
    }

    // Acceleration insights
    if (stats.acceleration > 0.1) {
      insights.push('Accelerating improvement rate detected');
    } else if (stats.acceleration < -0.1) {
      insights.push('Declining improvement rate - intervention may be needed');
    }

    // R-squared insights
    if (stats.rSquared < 0.3) {
      insights.push(
        'High variability in data - more consistent tracking recommended'
      );
    }

    return insights;
  }

  /**
   * Create analysis for insufficient data
   */
  private createInsufficientDataAnalysis(metricName: string): TrendAnalysis {
    return {
      metric_name: metricName,
      trend_direction: 'stable',
      trend_strength: 'weak',
      trend_consistency: 0,
      predicted_next_value: 0,
      confidence_interval: [0, 0],
      key_insights: [
        'Insufficient data points for trend analysis',
        'Complete at least 3 evaluations to see trends',
      ],
      data_points: 0,
      time_period_days: 0,
    };
  }
}

// ============================================================================
// MULTI-METRIC TREND ANALYSIS
// ============================================================================

/**
 * Analyze trends across multiple metrics
 */
export const analyzeTrendsForMetrics = async (
  metricsData: Record<string, DataPoint[]>
): Promise<Record<string, TrendAnalysis>> => {
  const analyzer = new TrendAnalyzer();
  const results: Record<string, TrendAnalysis> = {};

  for (const [metricName, dataPoints] of Object.entries(metricsData)) {
    results[metricName] = await analyzer.analyzeTrends(metricName, dataPoints);
  }

  return results;
};

/**
 * Identify strongest trends
 */
export const identifyStrongestTrends = (
  analyses: Record<string, TrendAnalysis>,
  count: number = 5
): TrendAnalysis[] => {
  return Object.values(analyses)
    .filter((a) => a.data_points >= 3)
    .sort((a, b) => {
      // Sort by strength and consistency
      const scoreA =
        (a.trend_strength === 'strong'
          ? 3
          : a.trend_strength === 'moderate'
            ? 2
            : 1) * a.trend_consistency;
      const scoreB =
        (b.trend_strength === 'strong'
          ? 3
          : b.trend_strength === 'moderate'
            ? 2
            : 1) * b.trend_consistency;
      return scoreB - scoreA;
    })
    .slice(0, count);
};

/**
 * Format trend analysis for display
 */
export const formatTrendAnalysis = (analysis: TrendAnalysis): string => {
  const direction =
    analysis.trend_direction === 'upward'
      ? '📈'
      : analysis.trend_direction === 'downward'
        ? '📉'
        : analysis.trend_direction === 'volatile'
          ? '📊'
          : '➡️';

  const strength = analysis.trend_strength;
  const metric = analysis.metric_name.replace(/_/g, ' ');

  return `${direction} ${metric}: ${strength} ${analysis.trend_direction} trend (${analysis.data_points} data points)`;
};
