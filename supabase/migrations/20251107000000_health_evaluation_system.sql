-- Health Evaluation System - Complete Schema
-- Implements conversation persistence, progress tracking, milestones, and analytics

-- ============================================================================
-- 1. CONVERSATION PERSISTENCE TABLES
-- ============================================================================

-- Store chat sessions with Dr. Luna Clearwater
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona TEXT NOT NULL DEFAULT 'drLunaClearwater',
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  evaluation_report_id UUID REFERENCES evaluation_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store individual messages in conversations
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversation queries
CREATE INDEX idx_conversation_threads_user_id ON conversation_threads(user_id);
CREATE INDEX idx_conversation_threads_status ON conversation_threads(user_id, status);
CREATE INDEX idx_conversation_threads_updated ON conversation_threads(user_id, updated_at DESC);
CREATE INDEX idx_conversation_messages_thread ON conversation_messages(thread_id, created_at);

-- RLS Policies for conversations
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation threads" 
  ON conversation_threads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation threads" 
  ON conversation_threads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation threads" 
  ON conversation_threads FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation threads" 
  ON conversation_threads FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own threads" 
  ON conversation_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_threads 
      WHERE id = conversation_messages.thread_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own threads" 
  ON conversation_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_threads 
      WHERE id = conversation_messages.thread_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. PROGRESS TRACKING TABLES
-- ============================================================================

-- Track progress metrics over time
CREATE TABLE IF NOT EXISTS evaluation_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES evaluation_reports(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  metric_category TEXT CHECK (metric_category IN ('nutritional', 'skill_development', 'behavioral', 'goal_achievement')),
  progress_direction TEXT CHECK (progress_direction IN ('improving', 'declining', 'stable')),
  significance_level NUMERIC DEFAULT 0.5 CHECK (significance_level >= 0 AND significance_level <= 1),
  change_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific progress tracking configuration
CREATE TABLE IF NOT EXISTS user_progress_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_weights JSONB NOT NULL DEFAULT '{"nutritional": 0.3, "skill_development": 0.25, "behavioral": 0.25, "goal_achievement": 0.2}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for progress tracking
CREATE INDEX idx_progress_tracking_user_metric ON evaluation_progress_tracking(user_id, metric_name);
CREATE INDEX idx_progress_tracking_report ON evaluation_progress_tracking(report_id);
CREATE INDEX idx_progress_tracking_category ON evaluation_progress_tracking(user_id, metric_category);
CREATE INDEX idx_progress_tracking_created ON evaluation_progress_tracking(user_id, created_at DESC);
CREATE INDEX idx_user_progress_config_user ON user_progress_config(user_id);

-- RLS Policies for progress tracking
ALTER TABLE evaluation_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress tracking" 
  ON evaluation_progress_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress tracking" 
  ON evaluation_progress_tracking FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress tracking" 
  ON evaluation_progress_tracking FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress config" 
  ON user_progress_config FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress config" 
  ON user_progress_config FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress config" 
  ON user_progress_config FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HEALTH MILESTONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('nutritional', 'skill', 'behavioral', 'goal', 'achievement')),
  milestone_name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  target_date DATE,
  achieved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'achieved', 'overdue', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for milestones
CREATE INDEX idx_milestones_user ON health_milestones(user_id);
CREATE INDEX idx_milestones_status ON health_milestones(user_id, status);
CREATE INDEX idx_milestones_type ON health_milestones(user_id, milestone_type);
CREATE INDEX idx_milestones_achieved ON health_milestones(user_id, achieved_at DESC) WHERE achieved_at IS NOT NULL;

-- RLS Policies for milestones
ALTER TABLE health_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones" 
  ON health_milestones FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own milestones" 
  ON health_milestones FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones" 
  ON health_milestones FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones" 
  ON health_milestones FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. PROGRESS ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS progress_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('trend', 'pattern', 'comparison', 'prediction', 'insight')),
  analysis_data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  insights TEXT[],
  recommendations TEXT[],
  time_range_start TIMESTAMPTZ,
  time_range_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_progress_analytics_user ON progress_analytics(user_id);
CREATE INDEX idx_progress_analytics_type ON progress_analytics(user_id, analysis_type);
CREATE INDEX idx_progress_analytics_created ON progress_analytics(user_id, created_at DESC);

-- RLS Policies for analytics
ALTER TABLE progress_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" 
  ON progress_analytics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" 
  ON progress_analytics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. ENHANCED EVALUATION REPORTS TABLE
-- ============================================================================

-- Add progress tracking fields to existing evaluation_reports table
ALTER TABLE evaluation_reports 
  ADD COLUMN IF NOT EXISTS progress_summary JSONB,
  ADD COLUMN IF NOT EXISTS trend_analysis JSONB,
  ADD COLUMN IF NOT EXISTS previous_report_id UUID REFERENCES evaluation_reports(id),
  ADD COLUMN IF NOT EXISTS progress_score NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS key_improvements TEXT[],
  ADD COLUMN IF NOT EXISTS areas_of_concern TEXT[];

-- Index for chronological report linking
CREATE INDEX IF NOT EXISTS idx_evaluation_reports_previous ON evaluation_reports(previous_report_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_reports_progress_score ON evaluation_reports(user_id, progress_score DESC);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to update conversation thread timestamp
CREATE OR REPLACE FUNCTION update_conversation_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_threads 
  SET 
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread timestamp on new message
DROP TRIGGER IF EXISTS conversation_message_timestamp ON conversation_messages;
CREATE TRIGGER conversation_message_timestamp
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_thread_timestamp();

-- Function to auto-update milestone status based on current_value
CREATE OR REPLACE FUNCTION update_milestone_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if milestone is achieved
  IF NEW.target_value IS NOT NULL AND NEW.current_value >= NEW.target_value AND NEW.status != 'achieved' THEN
    NEW.status := 'achieved';
    NEW.achieved_at := NOW();
  -- Check if milestone is overdue
  ELSIF NEW.target_date IS NOT NULL AND NEW.target_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  -- Check if milestone should be in progress
  ELSIF NEW.current_value > 0 AND NEW.status = 'pending' THEN
    NEW.status := 'in_progress';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update milestone status
DROP TRIGGER IF EXISTS milestone_status_update ON health_milestones;
CREATE TRIGGER milestone_status_update
  BEFORE UPDATE OF current_value, target_value ON health_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_status();

-- ============================================================================
-- 7. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for recent progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  ept.user_id,
  ept.metric_category,
  COUNT(*) as total_metrics,
  AVG(ept.metric_value) as avg_value,
  MAX(ept.created_at) as last_update,
  COUNT(CASE WHEN ept.progress_direction = 'improving' THEN 1 END) as improving_count,
  COUNT(CASE WHEN ept.progress_direction = 'declining' THEN 1 END) as declining_count,
  COUNT(CASE WHEN ept.progress_direction = 'stable' THEN 1 END) as stable_count
FROM evaluation_progress_tracking ept
GROUP BY ept.user_id, ept.metric_category;

-- View for active milestones with progress
CREATE OR REPLACE VIEW active_milestones_view AS
SELECT 
  hm.*,
  CASE 
    WHEN hm.target_value > 0 THEN (hm.current_value / hm.target_value * 100)
    ELSE 0
  END as progress_percentage,
  CASE 
    WHEN hm.target_date IS NOT NULL THEN (hm.target_date - CURRENT_DATE)
    ELSE NULL
  END as days_remaining
FROM health_milestones hm
WHERE hm.status IN ('pending', 'in_progress')
ORDER BY hm.priority DESC, hm.target_date ASC NULLS LAST;

-- View for conversation threads with message counts
CREATE OR REPLACE VIEW conversation_threads_with_counts AS
SELECT 
  ct.*,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message_time
FROM conversation_threads ct
LEFT JOIN conversation_messages cm ON ct.id = cm.thread_id
GROUP BY ct.id;

COMMENT ON TABLE conversation_threads IS 'Stores chat sessions with Dr. Luna Clearwater for conversation persistence';
COMMENT ON TABLE conversation_messages IS 'Stores individual messages within conversation threads';
COMMENT ON TABLE evaluation_progress_tracking IS 'Tracks health metrics over time for longitudinal analysis';
COMMENT ON TABLE user_progress_config IS 'User-specific progress tracking configuration and category weights';
COMMENT ON TABLE health_milestones IS 'User health goals and achievement tracking';
COMMENT ON TABLE progress_analytics IS 'Calculated trend, pattern, and predictive analytics data';

