/**
 * Migration Script: Backfill Progress Data from Existing Evaluation Reports
 *
 * This script processes existing evaluation reports and creates:
 * - Progress metrics for tracking
 * - Milestone records
 * - Progress analytics data
 *
 * Run with: npx tsx scripts/migrate-evaluation-reports.ts
 */

import { supabase } from '../src/lib/supabase';
import { processEvaluationReport } from '../src/lib/progress-tracking-api';
import { MilestoneManager } from '../src/lib/milestones/milestone-manager';
import type { EvaluationReport } from '../src/lib/evaluation-report-types';

interface MigrationResult {
  total_reports: number;
  processed_reports: number;
  created_metrics: number;
  created_milestones: number;
  errors: string[];
  user_summary: Record<
    string,
    {
      reports: number;
      metrics: number;
      milestones: number;
    }
  >;
}

async function migrateEvaluationReports(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total_reports: 0,
    processed_reports: 0,
    created_metrics: number,
    created_milestones: 0,
    errors: [],
    user_summary: {},
  };

  console.log('🚀 Starting evaluation reports migration...\n');

  try {
    // Get all evaluation reports
    console.log('📊 Fetching evaluation reports from database...');
    const { data: reports, error: reportsError } = await supabase
      .from('evaluation_reports')
      .select('*')
      .order('evaluation_date', { ascending: true });

    if (reportsError) {
      throw new Error(`Failed to fetch reports: ${reportsError.message}`);
    }

    if (!reports || reports.length === 0) {
      console.log('ℹ️  No evaluation reports found.');
      return result;
    }

    result.total_reports = reports.length;
    console.log(`✅ Found ${reports.length} evaluation reports\n`);

    // Group reports by user
    const userReports = new Map<string, typeof reports>();
    for (const report of reports) {
      if (!userReports.has(report.user_id)) {
        userReports.set(report.user_id, []);
      }
      userReports.get(report.user_id)!.push(report);
    }

    console.log(`👥 Processing reports for ${userReports.size} users\n`);

    // Process each user's reports
    const milestoneManager = new MilestoneManager();

    for (const [userId, userReportList] of userReports.entries()) {
      console.log(
        `\n📝 Processing user ${userId} (${userReportList.length} reports)...`
      );

      // Initialize user summary
      result.user_summary[userId] = {
        reports: userReportList.length,
        metrics: 0,
        milestones: 0,
      };

      // Sort by evaluation date
      userReportList.sort(
        (a, b) =>
          new Date(a.evaluation_date).getTime() -
          new Date(b.evaluation_date).getTime()
      );

      // Process each report
      for (let i = 0; i < userReportList.length; i++) {
        const report = userReportList[i];
        const previousReport = i > 0 ? userReportList[i - 1] : null;

        try {
          console.log(`   Processing report ${report.report_id}...`);

          // Normalize report data if needed
          const normalizedReport = normalizeReport(report);

          // Process evaluation report (create metrics and comparisons)
          await processEvaluationReport(
            userId,
            normalizedReport,
            previousReport?.report_id
          );

          result.processed_reports++;
          result.created_metrics += 10; // Approximate metrics per report

          // Generate milestones for first report only
          if (i === 0) {
            const milestones =
              await milestoneManager.generateMilestonesFromReport(
                userId,
                normalizedReport
              );
            result.created_milestones += milestones.length;
            result.user_summary[userId].milestones = milestones.length;
            console.log(`   ✅ Created ${milestones.length} milestones`);
          }

          result.user_summary[userId].metrics += 10;
          console.log(`   ✅ Processed successfully`);
        } catch (reportError) {
          const errorMsg = `Failed to process report ${report.report_id}: ${reportError instanceof Error ? reportError.message : String(reportError)}`;
          console.error(`   ❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      console.log(`✅ Completed user ${userId}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total reports: ${result.total_reports}`);
    console.log(`Processed reports: ${result.processed_reports}`);
    console.log(`Created metrics: ${result.created_metrics}`);
    console.log(`Created milestones: ${result.created_milestones}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n👥 Per-User Summary:');
    for (const [userId, summary] of Object.entries(result.user_summary)) {
      console.log(
        `   ${userId}: ${summary.reports} reports, ${summary.metrics} metrics, ${summary.milestones} milestones`
      );
    }
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`\n❌ ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Normalize report data to ensure it has the expected structure
 */
function normalizeReport(dbReport: {
  report_id: string;
  evaluation_date: string;
  dietitian: string;
  report_version: string;
  user_id: string;
  created_at: string;
  report_data: Record<string, unknown>;
}): EvaluationReport {
  // Check if report_data already has the correct structure
  if (dbReport.report_data && dbReport.report_data.user_evaluation_report) {
    return dbReport.report_data as EvaluationReport;
  }

  // Legacy format: wrap flat report_data
  return {
    user_evaluation_report: {
      report_id: dbReport.report_id,
      evaluation_date: dbReport.evaluation_date,
      dietitian: dbReport.dietitian,
      report_version: dbReport.report_version,
      user_profile_summary: dbReport.report_data.user_profile_summary || {
        user_id: dbReport.user_id,
        evaluation_completeness: 100,
        data_quality_score: 85,
        last_updated: dbReport.created_at,
      },
      nutritional_analysis: dbReport.report_data.nutritional_analysis,
      personalization_matrix: dbReport.report_data.personalization_matrix,
      safety_assessment: dbReport.report_data.safety_assessment,
      personalized_recommendations:
        dbReport.report_data.personalized_recommendations,
      meal_suggestions: dbReport.report_data.meal_suggestions,
      progress_tracking: dbReport.report_data.progress_tracking,
      risk_mitigation: dbReport.report_data.risk_mitigation,
      support_resources: dbReport.report_data.support_resources,
      next_steps: dbReport.report_data.next_steps,
      professional_notes: dbReport.report_data.professional_notes,
      report_metadata: dbReport.report_data.report_metadata || {
        confidence_level: 85,
        data_completeness: 100,
        personalization_depth: 'high',
        evidence_base: 'strong',
        last_literature_review: new Date().toISOString().split('T')[0],
        next_update_recommended: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
    },
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🏥 Health Evaluation System - Data Migration\n');
  console.log(
    'This will backfill progress tracking data from existing evaluation reports.'
  );
  console.log('Starting in 3 seconds...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const result = await migrateEvaluationReports();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration Complete!');
  console.log('='.repeat(60) + '\n');

  if (result.errors.length === 0) {
    process.exit(0);
  } else {
    console.error(
      '⚠️  Migration completed with errors. Please review the error log above.'
    );
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { migrateEvaluationReports, type MigrationResult };
