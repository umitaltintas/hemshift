-- Sample Data for Shift Planner
-- This seed file creates sample nurses and leaves for testing

-- =============================================================================
-- SAMPLE NURSES
-- =============================================================================

-- Insert 1 responsible nurse
INSERT INTO nurses (name, role) VALUES
  ('Ayşe Yılmaz', 'responsible')
ON CONFLICT DO NOTHING;

-- Insert 6 staff nurses
INSERT INTO nurses (name, role) VALUES
  ('Fatma Demir', 'staff'),
  ('Mehmet Kaya', 'staff'),
  ('Zeynep Arslan', 'staff'),
  ('Ali Çelik', 'staff'),
  ('Elif Öztürk', 'staff'),
  ('Can Yıldız', 'staff')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE LEAVES (for January 2025)
-- =============================================================================

-- Get nurse IDs
DO $$
DECLARE
  v_ayse_id UUID;
  v_fatma_id UUID;
  v_mehmet_id UUID;
BEGIN
  SELECT id INTO v_ayse_id FROM nurses WHERE name = 'Ayşe Yılmaz';
  SELECT id INTO v_fatma_id FROM nurses WHERE name = 'Fatma Demir';
  SELECT id INTO v_mehmet_id FROM nurses WHERE name = 'Mehmet Kaya';

  -- Ayşe's annual leave
  INSERT INTO leaves (nurse_id, type, start_date, end_date, notes) VALUES
    (v_ayse_id, 'annual', '2025-01-05', '2025-01-10', 'Yıllık izin');

  -- Fatma's preference
  INSERT INTO leaves (nurse_id, type, start_date, end_date, notes) VALUES
    (v_fatma_id, 'preference', '2025-01-15', '2025-01-15', 'Boşluk tercihi');

  -- Mehmet's sick leave
  INSERT INTO leaves (nurse_id, type, start_date, end_date, notes) VALUES
    (v_mehmet_id, 'sick', '2025-01-20', '2025-01-22', 'Raporlu');
END $$;

-- =============================================================================
-- INFO
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sample data created successfully';
  RAISE NOTICE '   - 1 responsible nurse';
  RAISE NOTICE '   - 6 staff nurses';
  RAISE NOTICE '   - 3 sample leaves';
END $$;
