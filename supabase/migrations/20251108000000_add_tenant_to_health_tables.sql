-- =====================================================
-- Add Multi-Tenant Support to Health Evaluation System Tables
-- =====================================================
-- This migration adds tenant_id to health evaluation system tables
-- Runs after 20251107000000_health_evaluation_system.sql
-- =====================================================

-- Add tenant_id columns to all health-related tables
ALTER TABLE conversation_threads ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE evaluation_progress_tracking ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX idx_conversation_threads_tenant ON conversation_threads(tenant_id);
CREATE INDEX idx_evaluation_progress_tracking_tenant ON evaluation_progress_tracking(tenant_id);

-- Backfill existing data with default tenant
UPDATE conversation_threads 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

UPDATE evaluation_progress_tracking 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE conversation_threads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE evaluation_progress_tracking ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- RLS Policies for CONVERSATION_THREADS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversation threads" ON conversation_threads;
DROP POLICY IF EXISTS "Users can create own conversation threads" ON conversation_threads;
DROP POLICY IF EXISTS "Users can update own conversation threads" ON conversation_threads;
DROP POLICY IF EXISTS "Users can delete own conversation threads" ON conversation_threads;

-- Super admin can see/manage all conversation threads
CREATE POLICY "conversation_threads_super_admin_all" ON conversation_threads
  FOR ALL
  USING (public.is_super_admin());

-- Users can view their own conversation threads in their tenant
CREATE POLICY "conversation_threads_select_own" ON conversation_threads
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can create conversation threads in their tenant
CREATE POLICY "conversation_threads_insert_own" ON conversation_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update their own conversation threads
CREATE POLICY "conversation_threads_update_own" ON conversation_threads
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can delete their own conversation threads
CREATE POLICY "conversation_threads_delete_own" ON conversation_threads
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- =====================================================
-- RLS Policies for EVALUATION_PROGRESS_TRACKING
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own progress tracking" ON evaluation_progress_tracking;
DROP POLICY IF EXISTS "Users can create own progress tracking" ON evaluation_progress_tracking;
DROP POLICY IF EXISTS "Users can update own progress tracking" ON evaluation_progress_tracking;
DROP POLICY IF EXISTS "Users can delete own progress tracking" ON evaluation_progress_tracking;

-- Super admin can see/manage all progress tracking
CREATE POLICY "evaluation_progress_tracking_super_admin_all" ON evaluation_progress_tracking
  FOR ALL
  USING (public.is_super_admin());

-- Users can view their own progress tracking in their tenant
CREATE POLICY "evaluation_progress_tracking_select_own" ON evaluation_progress_tracking
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can create progress tracking in their tenant
CREATE POLICY "evaluation_progress_tracking_insert_own" ON evaluation_progress_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update their own progress tracking
CREATE POLICY "evaluation_progress_tracking_update_own" ON evaluation_progress_tracking
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can delete their own progress tracking
CREATE POLICY "evaluation_progress_tracking_delete_own" ON evaluation_progress_tracking
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- =====================================================
-- Note: Other health-related tables (user_progress_config, health_milestones, 
-- progress_analytics, user_progress_summary) don't exist in the current schema
-- If they are added in the future, similar tenant support should be added
-- =====================================================

