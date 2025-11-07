# Health Evaluation System - Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the health evaluation system with conversation persistence and progress tracking.

---

## Prerequisites

- ✅ Supabase project set up
- ✅ PostgreSQL database accessible
- ✅ Node.js environment configured
- ✅ Supabase CLI installed (optional but recommended)

---

## Step 1: Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd "/Users/justinfassio/Local Sites/Recipe Generator"

# Push the new migration to Supabase
supabase db push

# Verify migration succeeded
supabase db pull
```

### Option B: Manual Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open the migration file: `supabase/migrations/20251107000000_health_evaluation_system.sql`
4. Copy the entire contents
5. Paste into SQL Editor and execute
6. Verify all tables created successfully

### Verify Migration Success

Run this query in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'conversation_threads',
  'conversation_messages',
  'evaluation_progress_tracking',
  'user_progress_config',
  'health_milestones',
  'progress_analytics'
)
ORDER BY table_name;
```

**Expected Result:** 6 tables should be listed

---

## Step 2: Backfill Existing Data

### Run Migration Script

```bash
# From project root
npx tsx scripts/migrate-evaluation-reports.ts
```

### What This Does:

1. Fetches all existing evaluation reports
2. Extracts progress metrics from each report
3. Creates milestone records for users
4. Links reports chronologically
5. Generates progress tracking data

### Expected Output:

```
🚀 Starting evaluation reports migration...
📊 Fetching evaluation reports from database...
✅ Found X evaluation reports

👥 Processing reports for Y users

📝 Processing user [user-id] (Z reports)...
   Processing report eval_xxx...
   ✅ Created N milestones
   ✅ Processed successfully
✅ Completed user [user-id]

============================================================
📊 Migration Summary:
============================================================
Total reports: X
Processed reports: X
Created metrics: ~XXX
Created milestones: XX
Errors: 0
```

### If Errors Occur:

- Check console output for specific error messages
- Verify database connection
- Ensure all tables were created successfully
- Run script again (it's safe to re-run)

---

## Step 3: Verify System Functionality

### Test Conversation Persistence

1. **Start a conversation with Dr. Luna Clearwater**
   - Navigate to the app
   - Select Dr. Luna as persona
   - Send a message

2. **Check database**

   ```sql
   SELECT * FROM conversation_threads
   WHERE persona = 'drLunaClearwater'
   ORDER BY created_at DESC
   LIMIT 5;

   SELECT * FROM conversation_messages
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Expected:** You should see thread and messages in database

### Test Progress Tracking

1. **Generate an evaluation report**
   - Complete a conversation with Dr. Luna
   - Generate and save an evaluation report

2. **Check progress metrics**

   ```sql
   SELECT user_id, metric_name, metric_value, metric_category
   FROM evaluation_progress_tracking
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Expected:** Multiple metrics per evaluation report

### Test Longitudinal Context

1. **Start a new conversation** (if you have multiple reports)
   - Open Dr. Luna chat
   - Check browser console for:
     ```
     [AI Chat] Enhanced Dr. Luna prompt with longitudinal context for user [user-id]
     ```

2. **Verify Dr. Luna acknowledges history**
   - Ask Dr. Luna about your progress
   - She should reference past evaluations

---

## Step 4: Monitor and Troubleshoot

### Enable Logging

The system logs key operations to console:

**Conversation Operations:**

- `Conversation thread created: [thread-id]`
- `Failed to save message: [error]`
- `Conversation linked to evaluation report`

**Progress Tracking:**

- `Saved X progress metrics`
- `Evaluation report processed for progress tracking`

**AI Context:**

- `[AI Chat] Enhanced Dr. Luna prompt with longitudinal context`
- `[AI Chat] Failed to load longitudinal context: [error]`

### Common Issues

#### Issue: Conversations not saving

**Symptoms:**

- No error messages
- Messages appear in UI but not in database

**Solutions:**

1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies:
   ```sql
   SELECT * FROM conversation_threads WHERE user_id = auth.uid();
   ```
4. Ensure `conversationThreadId` state is set in useConversation

#### Issue: Progress metrics not created

**Symptoms:**

- Evaluation reports save but no metrics in database

**Solutions:**

1. Check that report has proper structure
2. Verify metric extraction logic
3. Run migration script manually
4. Check for import errors in console

#### Issue: Dr. Luna doesn't reference history

**Symptoms:**

- Dr. Luna acts like first conversation every time

**Solutions:**

1. Check if longitudinal context is loading:
   ```sql
   SELECT COUNT(*) FROM evaluation_progress_tracking WHERE user_id = '[user-id]';
   ```
2. Verify user has multiple evaluation reports
3. Check browser console for context loading errors
4. Ensure userId is passed to API

---

## Step 5: Performance Optimization

### Database Indexes

All necessary indexes are created by the migration:

```sql
-- Verify indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'conversation_threads',
  'conversation_messages',
  'evaluation_progress_tracking'
)
ORDER BY tablename, indexname;
```

**Expected:** Multiple indexes per table

### Query Performance

Test query performance:

```sql
-- Should return instantly even with 1000s of messages
EXPLAIN ANALYZE
SELECT * FROM conversation_messages
WHERE thread_id = '[thread-id]'
ORDER BY created_at;

-- Should return instantly even with many metrics
EXPLAIN ANALYZE
SELECT * FROM evaluation_progress_tracking
WHERE user_id = '[user-id]'
AND metric_name = 'diet_quality_score'
ORDER BY created_at DESC;
```

---

## Step 6: Data Validation

### Validate Conversation Data

```sql
-- Check conversation statistics
SELECT
  COUNT(DISTINCT ct.id) as total_threads,
  COUNT(cm.id) as total_messages,
  AVG(msg_count.count) as avg_messages_per_thread
FROM conversation_threads ct
LEFT JOIN conversation_messages cm ON ct.id = cm.thread_id
LEFT JOIN (
  SELECT thread_id, COUNT(*) as count
  FROM conversation_messages
  GROUP BY thread_id
) msg_count ON ct.id = msg_count.thread_id;
```

### Validate Progress Data

```sql
-- Check progress tracking statistics
SELECT
  metric_category,
  COUNT(*) as total_metrics,
  COUNT(DISTINCT user_id) as users_tracked,
  AVG(metric_value) as avg_value
FROM evaluation_progress_tracking
GROUP BY metric_category;
```

### Validate Milestones

```sql
-- Check milestone statistics
SELECT
  milestone_type,
  status,
  COUNT(*) as count
FROM health_milestones
GROUP BY milestone_type, status
ORDER BY milestone_type, status;
```

---

## Step 7: User Acceptance Testing

### Test Checklist

- [ ] **Conversation Persistence**
  - [ ] Start conversation with Dr. Luna
  - [ ] Send multiple messages
  - [ ] Refresh page
  - [ ] Verify conversation NOT lost (currently messages reset - UI enhancement needed)
  - [ ] Check database for saved messages

- [ ] **Evaluation Report Generation**
  - [ ] Complete conversation with Dr. Luna
  - [ ] Generate evaluation report
  - [ ] Save report
  - [ ] Verify report in evaluation reports page

- [ ] **Progress Tracking**
  - [ ] Generate second evaluation report
  - [ ] Check that progress metrics are created
  - [ ] Verify comparison with previous report

- [ ] **Milestone System**
  - [ ] Check that milestones are auto-generated
  - [ ] Verify milestone status updates

- [ ] **Longitudinal Context**
  - [ ] Start new conversation after multiple reports
  - [ ] Ask Dr. Luna about your progress
  - [ ] Verify she references past evaluations

---

## Step 8: Production Deployment Checklist

### Pre-Deployment

- [ ] Database migration applied successfully
- [ ] Data backfill completed without errors
- [ ] All verification queries return expected results
- [ ] Test user workflow completed successfully
- [ ] No console errors in browser
- [ ] API responses within acceptable time (<2s)

### Deployment

- [ ] Backup database before deploying changes
- [ ] Deploy updated code to production
- [ ] Run smoke tests on production
- [ ] Monitor error logs for first hour
- [ ] Verify conversation persistence working
- [ ] Verify progress tracking working

### Post-Deployment

- [ ] Monitor system performance
- [ ] Check for any error spikes
- [ ] Verify user reports are positive
- [ ] Document any issues encountered
- [ ] Plan for UI component development (Phase 4)

---

## Rollback Plan

If issues occur:

### Database Rollback

```sql
-- Drop new tables (if needed)
DROP TABLE IF EXISTS progress_analytics CASCADE;
DROP TABLE IF EXISTS health_milestones CASCADE;
DROP TABLE IF EXISTS user_progress_config CASCADE;
DROP TABLE IF EXISTS evaluation_progress_tracking CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversation_threads CASCADE;

-- Revert evaluation_reports changes
ALTER TABLE evaluation_reports
DROP COLUMN IF EXISTS progress_summary,
DROP COLUMN IF EXISTS trend_analysis,
DROP COLUMN IF EXISTS previous_report_id,
DROP COLUMN IF EXISTS progress_score,
DROP COLUMN IF EXISTS key_improvements,
DROP COLUMN IF EXISTS areas_of_concern;
```

### Code Rollback

Revert these files to previous versions:

- `src/hooks/useConversation.ts`
- `api/ai/chat.ts`

Remove new files:

- All files in `src/lib/progress-analysis/`
- All files in `src/lib/milestones/`
- All files in `src/lib/ai/`
- `src/lib/conversation-db.ts`
- `src/lib/progress-tracking-api.ts`

---

## Monitoring

### Key Metrics to Track

1. **Conversation Creation Rate**

   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM conversation_threads
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

2. **Message Volume**

   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM conversation_messages
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

3. **Progress Metrics Created**

   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM evaluation_progress_tracking
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

4. **Milestone Achievements**
   ```sql
   SELECT DATE(achieved_at), COUNT(*)
   FROM health_milestones
   WHERE achieved_at IS NOT NULL
   GROUP BY DATE(achieved_at)
   ORDER BY DATE(achieved_at) DESC;
   ```

### Error Monitoring

Set up alerts for:

- Failed conversation saves
- Failed metric extraction
- Failed AI context loading
- Database connection errors
- API timeout errors

---

## Support

### Getting Help

1. **Check Logs:** Browser console and server logs
2. **Review Documentation:** `IMPLEMENTATION_SUMMARY.md`
3. **Verify Database:** Run validation queries
4. **Test Locally:** Reproduce issue in development

### Common Questions

**Q: Why aren't conversations resuming after page refresh?**  
A: The UI for loading existing conversations hasn't been implemented yet. Messages are saved in database but the UI doesn't load them on page load. This is a UI enhancement for Phase 4.

**Q: How long does migration take?**  
A: Database migration: <30 seconds. Data backfill: ~1 second per existing report.

**Q: Can I run migration multiple times?**  
A: Yes! The migration uses CREATE IF NOT EXISTS and the backfill script handles duplicates gracefully.

**Q: What if Dr. Luna doesn't reference history?**  
A: Check that: (1) User has multiple evaluation reports, (2) Progress metrics exist in database, (3) Console shows context loading message.

---

## Next Steps

### Phase 4: UI Development

With core backend complete, next phase is:

1. **Install Dependencies**

   ```bash
   npm install chart.js react-chartjs-2
   ```

2. **Implement Components**
   - Progress dashboard
   - Milestone tracker
   - Trend charts
   - Progress score cards

3. **Create Pages**
   - `/health/progress` - Main dashboard
   - Enhanced chat interface with progress sidebar

4. **Add Navigation**
   - Link from evaluation reports to progress dashboard
   - Add "Health Progress" menu item

**Estimated Time:** 2-3 weeks for full UI implementation

---

## Success! 🎉

Your health evaluation system now has:

- ✅ Persistent conversations
- ✅ Comprehensive progress tracking
- ✅ Intelligent trend analysis
- ✅ Milestone management
- ✅ AI with longitudinal memory

**The backend is production-ready. UI components are next!**

---

_Last Updated: January 7, 2025_  
_Version: 1.0.0_  
_Status: Ready for Deployment_
