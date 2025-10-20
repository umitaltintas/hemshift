-- Initial Database Schema for Shift Planner
-- This migration creates all core tables

-- =============================================================================
-- NURSES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS nurses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('responsible', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only ONE responsible nurse
CREATE UNIQUE INDEX idx_single_responsible ON nurses(role)
WHERE role = 'responsible';

-- =============================================================================
-- LEAVES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('annual', 'excuse', 'sick', 'preference')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_leaves_nurse_dates ON leaves(nurse_id, start_date, end_date);

-- =============================================================================
-- SCHEDULES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  fairness_score DECIMAL(5,2) CHECK (fairness_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SHIFTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('day_8h', 'night_16h', 'weekend_24h')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_staff INTEGER DEFAULT 2,
  requires_responsible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_schedule_date ON shifts(schedule_id, date);

-- =============================================================================
-- SHIFT ASSIGNMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL CHECK (assignment_role IN ('responsible', 'staff')),
  assigned_by VARCHAR(50) NOT NULL DEFAULT 'algorithm' CHECK (assigned_by IN ('algorithm', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, nurse_id)
);

CREATE INDEX idx_assignments_nurse ON shift_assignments(nurse_id);
CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id);

-- =============================================================================
-- CONSTRAINTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert default constraints
INSERT INTO constraints (name, type, value, is_active) VALUES
  ('Maksimum Ardışık Çalışma Günü', 'max_consecutive_days', 5, TRUE),
  ('Gece Sonrası Minimum Dinlenme (gün)', 'min_rest_after_night', 1, TRUE),
  ('Maksimum Ardışık Gece Nöbeti', 'max_consecutive_nights', 3, TRUE),
  ('Aylık Maksimum Gece Nöbeti', 'max_night_shifts_per_month', 10, TRUE),
  ('Aylık Maksimum Haftasonu Vardiyası', 'max_weekend_shifts_per_month', 4, TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-set requires_responsible based on shift type
CREATE OR REPLACE FUNCTION set_requires_responsible()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'day_8h' THEN
    NEW.requires_responsible = TRUE;
  ELSE
    NEW.requires_responsible = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_shift
BEFORE INSERT ON shifts
FOR EACH ROW
EXECUTE FUNCTION set_requires_responsible();

-- Validate responsible nurse can only work day shifts
CREATE OR REPLACE FUNCTION validate_responsible_shift()
RETURNS TRIGGER AS $$
DECLARE
  v_nurse_role VARCHAR(50);
  v_shift_type VARCHAR(50);
BEGIN
  SELECT role INTO v_nurse_role FROM nurses WHERE id = NEW.nurse_id;
  SELECT type INTO v_shift_type FROM shifts WHERE id = NEW.shift_id;

  IF v_nurse_role = 'responsible' AND v_shift_type != 'day_8h' THEN
    RAISE EXCEPTION 'Sorumlu hemşire sadece 8 saatlik gündüz vardiyasında çalışabilir';
  END IF;

  IF v_nurse_role = 'responsible' THEN
    NEW.assignment_role = 'responsible';
  ELSE
    NEW.assignment_role = 'staff';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_assignment
BEFORE INSERT OR UPDATE ON shift_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_responsible_shift();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nurses_updated_at
BEFORE UPDATE ON nurses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE nurses IS 'Hemşire bilgileri (1 sorumlu + N staf)';
COMMENT ON TABLE leaves IS 'İzin kayıtları';
COMMENT ON TABLE schedules IS 'Aylık vardiya planları';
COMMENT ON TABLE shifts IS 'Günlük vardiyalar';
COMMENT ON TABLE shift_assignments IS 'Hemşire-vardiya atamaları';
COMMENT ON TABLE constraints IS 'Sistem kısıtlamaları';
