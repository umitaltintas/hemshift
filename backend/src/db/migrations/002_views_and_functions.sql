-- Views and Functions for Shift Planner
-- This migration adds materialized views and utility functions

-- =============================================================================
-- SHIFT COMPLETENESS VIEW
-- =============================================================================
CREATE OR REPLACE VIEW shift_completeness AS
SELECT
  s.id as shift_id,
  s.schedule_id,
  s.date,
  s.type,
  s.required_staff,
  s.requires_responsible,

  -- Current assignments
  COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END)::INTEGER as current_staff,
  COUNT(CASE WHEN sa.assignment_role = 'responsible' THEN 1 END)::INTEGER as current_responsible,

  -- Completion status
  CASE
    WHEN s.requires_responsible = TRUE AND
         COUNT(CASE WHEN sa.assignment_role = 'responsible' THEN 1 END) = 0
    THEN FALSE
    WHEN COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END) < s.required_staff
    THEN FALSE
    ELSE TRUE
  END as is_complete,

  -- Status message
  CASE
    WHEN s.requires_responsible = TRUE AND
         COUNT(CASE WHEN sa.assignment_role = 'responsible' THEN 1 END) = 0
    THEN 'Sorumlu hemşire eksik'
    WHEN COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END) < s.required_staff
    THEN CONCAT('Staf eksik: ',
                COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END),
                '/', s.required_staff)
    WHEN COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END) > s.required_staff
    THEN CONCAT('Fazla staf: ',
                COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END),
                '/', s.required_staff)
    ELSE 'Tamam'
  END as status_message

FROM shifts s
LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
GROUP BY s.id, s.schedule_id, s.date, s.type, s.required_staff, s.requires_responsible;

COMMENT ON VIEW shift_completeness IS 'Her vardiya için doluluk durumu';

-- =============================================================================
-- NURSE MONTHLY STATS (Materialized View)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS nurse_monthly_stats AS
SELECT
  sa.nurse_id,
  n.name as nurse_name,
  n.role as nurse_role,
  sh.schedule_id,
  sch.month,

  -- Total hours
  SUM(
    CASE
      WHEN sh.type = 'day_8h' THEN 8
      WHEN sh.type = 'night_16h' THEN 16
      WHEN sh.type = 'weekend_24h' THEN 24
      ELSE 0
    END
  )::INTEGER as total_hours,

  -- Night shift count
  SUM(CASE WHEN sh.type IN ('night_16h', 'weekend_24h') THEN 1 ELSE 0 END)::INTEGER as night_shift_count,

  -- Weekend shift count
  SUM(CASE WHEN EXTRACT(DOW FROM sh.date) IN (0, 6) OR sh.type = 'weekend_24h' THEN 1 ELSE 0 END)::INTEGER as weekend_shift_count,

  -- Total shift count
  COUNT(*)::INTEGER as total_shift_count,

  -- Day shift count
  SUM(CASE WHEN sh.type = 'day_8h' THEN 1 ELSE 0 END)::INTEGER as day_shift_count

FROM shift_assignments sa
JOIN nurses n ON sa.nurse_id = n.id
JOIN shifts sh ON sa.shift_id = sh.id
JOIN schedules sch ON sh.schedule_id = sch.id
GROUP BY sa.nurse_id, n.name, n.role, sh.schedule_id, sch.month;

CREATE INDEX idx_stats_nurse_schedule ON nurse_monthly_stats(nurse_id, schedule_id);
CREATE INDEX idx_stats_schedule ON nurse_monthly_stats(schedule_id);

COMMENT ON MATERIALIZED VIEW nurse_monthly_stats IS 'Hemşire bazlı aylık istatistikler';

-- =============================================================================
-- FAIRNESS SCORE CALCULATION FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_fairness_score(p_schedule_id UUID)
RETURNS TABLE(
  fairness_score DECIMAL,
  hours_std_dev DECIMAL,
  nights_std_dev DECIMAL,
  weekends_std_dev DECIMAL,
  hours_score DECIMAL,
  nights_score DECIMAL,
  weekends_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH staff_stats AS (
    SELECT
      total_hours,
      night_shift_count,
      weekend_shift_count
    FROM nurse_monthly_stats
    WHERE schedule_id = p_schedule_id
      AND nurse_role = 'staff'  -- Only staff nurses
  ),
  deviations AS (
    SELECT
      COALESCE(STDDEV(total_hours), 0) as hours_dev,
      COALESCE(STDDEV(night_shift_count::DECIMAL), 0) as nights_dev,
      COALESCE(STDDEV(weekend_shift_count::DECIMAL), 0) as weekends_dev
    FROM staff_stats
  )
  SELECT
    -- Overall score (weighted average)
    ROUND(
      GREATEST(0, 100 - (d.hours_dev * 2)) * 0.4 +
      GREATEST(0, 100 - (d.nights_dev * 10)) * 0.35 +
      GREATEST(0, 100 - (d.weekends_dev * 20)) * 0.25
    , 2) as fairness_score,

    -- Standard deviations
    ROUND(d.hours_dev, 2) as hours_std_dev,
    ROUND(d.nights_dev, 2) as nights_std_dev,
    ROUND(d.weekends_dev, 2) as weekends_std_dev,

    -- Individual scores
    ROUND(GREATEST(0, 100 - (d.hours_dev * 2)), 2) as hours_score,
    ROUND(GREATEST(0, 100 - (d.nights_dev * 10)), 2) as nights_score,
    ROUND(GREATEST(0, 100 - (d.weekends_dev * 20)), 2) as weekends_score
  FROM deviations d;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_fairness_score IS 'Adalet skorunu hesapla (0-100)';

-- =============================================================================
-- REFRESH STATS FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW nurse_monthly_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_stats IS 'Materialized view refresh';
