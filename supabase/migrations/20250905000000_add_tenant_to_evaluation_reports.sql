-- =====================================================
-- Add Multi-Tenant Support to Evaluation Reports
-- =====================================================
-- This migration adds tenant_id to evaluation_reports table
-- Runs after 20250904212232_create_evaluation_reports_table.sql
-- =====================================================

-- Add tenant_id column
ALTER TABLE evaluation_reports ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Create index for performance
CREATE INDEX idx_evaluation_reports_tenant ON evaluation_reports(tenant_id);

-- Backfill existing data with default tenant
UPDATE evaluation_reports 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE evaluation_reports ALTER COLUMN tenant_id SET NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "evaluation_reports_select_own" ON evaluation_reports;
DROP POLICY IF EXISTS "evaluation_reports_insert_own" ON evaluation_reports;
DROP POLICY IF EXISTS "evaluation_reports_update_own" ON evaluation_reports;
DROP POLICY IF EXISTS "evaluation_reports_delete_own" ON evaluation_reports;

-- Create new tenant-aware RLS policies

-- Super admin can see/manage all evaluation reports
CREATE POLICY "evaluation_reports_super_admin_all" ON evaluation_reports
  FOR ALL
  USING (public.is_super_admin());

-- Users can view their own evaluation reports in their tenant
CREATE POLICY "evaluation_reports_select_own" ON evaluation_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can insert their own evaluation reports in their tenant
CREATE POLICY "evaluation_reports_insert_own" ON evaluation_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update their own evaluation reports
CREATE POLICY "evaluation_reports_update_own" ON evaluation_reports
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can delete their own evaluation reports
CREATE POLICY "evaluation_reports_delete_own" ON evaluation_reports
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

