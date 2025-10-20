# Shift Planner - Database Schema

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     NURSES      │
├─────────────────┤
│ id (PK)         │
│ name            │
│ role            │◄────────┐
│ created_at      │         │
│ updated_at      │         │
└─────────────────┘         │
         │                  │
         │                  │
         │ 1:N              │ N:1
         │                  │
         ▼                  │
┌─────────────────┐         │
│     LEAVES      │         │
├─────────────────┤         │
│ id (PK)         │         │
│ nurse_id (FK)   │─────────┘
│ type            │
│ start_date      │
│ end_date        │
│ notes           │
│ created_at      │
└─────────────────┘


┌─────────────────┐
│   SCHEDULES     │
├─────────────────┤
│ id (PK)         │
│ month           │
│ status          │
│ fairness_score  │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│     SHIFTS      │
├─────────────────┤
│ id (PK)         │
│ schedule_id(FK) │
│ date            │
│ type            │
│ start_time      │
│ end_time        │
│ required_staff  │
│ requires_resp.  │
│ created_at      │
└─────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────┐
│ SHIFT_ASSIGNMENTS    │
├──────────────────────┤
│ id (PK)              │
│ shift_id (FK)        │─────► SHIFTS
│ nurse_id (FK)        │─────► NURSES
│ assignment_role      │
│ assigned_by          │
│ created_at           │
└──────────────────────┘


┌─────────────────┐
│  CONSTRAINTS    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ type            │
│ value           │
│ is_active       │
└─────────────────┘
```

## Table Definitions

### 1. nurses

**Açıklama**: Sistemdeki tüm hemşireler (1 sorumlu + N staf)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Hemşire adı soyadı |
| role | VARCHAR(50) | NOT NULL, CHECK (role IN ('responsible', 'staff')) | Sorumlu veya staf |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Kayıt oluşturma zamanı |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Son güncelleme zamanı |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_single_responsible ON nurses(role)
WHERE role = 'responsible';
-- Sadece 1 sorumlu hemşire olmasını garanti eder
```

**Sample Data**:
```sql
INSERT INTO nurses (name, role) VALUES
  ('Ayşe Yılmaz', 'responsible'),
  ('Fatma Demir', 'staff'),
  ('Mehmet Kaya', 'staff'),
  ('Zeynep Arslan', 'staff'),
  ('Ali Çelik', 'staff'),
  ('Elif Öztürk', 'staff');
```

---

### 2. leaves

**Açıklama**: Hemşirelerin izin kayıtları

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nurse_id | UUID | FOREIGN KEY → nurses(id) ON DELETE CASCADE | Hemşire referansı |
| type | VARCHAR(50) | NOT NULL, CHECK (type IN ('annual', 'excuse', 'sick', 'preference')) | İzin tipi |
| start_date | DATE | NOT NULL | İzin başlangıç tarihi |
| end_date | DATE | NOT NULL, CHECK (end_date >= start_date) | İzin bitiş tarihi |
| notes | TEXT | NULLABLE | Ek notlar |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Kayıt oluşturma zamanı |

**Indexes**:
```sql
CREATE INDEX idx_leaves_nurse_dates ON leaves(nurse_id, start_date, end_date);
-- İzin sorgulamaları için optimize edilmiş index
```

**Sample Data**:
```sql
INSERT INTO leaves (nurse_id, type, start_date, end_date, notes) VALUES
  ('nurse-uuid-1', 'annual', '2025-01-05', '2025-01-10', 'Yıllık izin'),
  ('nurse-uuid-2', 'preference', '2025-01-15', '2025-01-15', 'Boşluk tercihi'),
  ('nurse-uuid-3', 'sick', '2025-01-20', '2025-01-22', 'Raporlu');
```

---

### 3. schedules

**Açıklama**: Aylık shift planları

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| month | DATE | NOT NULL, UNIQUE | Ayın ilk günü (örn: 2025-01-01) |
| status | VARCHAR(50) | DEFAULT 'draft', CHECK (status IN ('draft', 'published', 'archived')) | Plan durumu |
| fairness_score | DECIMAL(5,2) | CHECK (fairness_score BETWEEN 0 AND 100) | Adalet skoru |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Plan oluşturma zamanı |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Son güncelleme zamanı |

**Constraints**:
- Her ay için sadece 1 plan (UNIQUE constraint on month)

**Sample Data**:
```sql
INSERT INTO schedules (month, status, fairness_score) VALUES
  ('2025-01-01', 'published', 87.5),
  ('2025-02-01', 'draft', NULL);
```

---

### 4. shifts

**Açıklama**: Günlük vardiyalar

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| schedule_id | UUID | FOREIGN KEY → schedules(id) ON DELETE CASCADE | Schedule referansı |
| date | DATE | NOT NULL | Vardiya tarihi |
| type | VARCHAR(50) | NOT NULL, CHECK (type IN ('day_8h', 'night_16h', 'weekend_24h')) | Vardiya tipi |
| start_time | TIME | NOT NULL | Başlangıç saati |
| end_time | TIME | NOT NULL | Bitiş saati |
| required_staff | INTEGER | DEFAULT 2 | Gereken staf sayısı |
| requires_responsible | BOOLEAN | DEFAULT FALSE | Sorumlu hemşire gerekli mi? |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Kayıt oluşturma zamanı |

**Indexes**:
```sql
CREATE INDEX idx_shifts_schedule_date ON shifts(schedule_id, date);
-- Belirli bir schedule'ın günlük vardiyalarını hızlı getirmek için
```

**Triggers**:
```sql
-- Vardiya tipine göre otomatik requires_responsible ayarla
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
```

**Sample Data**:
```sql
-- Hafta içi gündüz
INSERT INTO shifts (schedule_id, date, type, start_time, end_time, required_staff, requires_responsible)
VALUES ('schedule-uuid', '2025-01-06', 'day_8h', '08:00', '16:00', 2, TRUE);

-- Hafta içi gece
INSERT INTO shifts (schedule_id, date, type, start_time, end_time, required_staff, requires_responsible)
VALUES ('schedule-uuid', '2025-01-06', 'night_16h', '16:00', '08:00', 2, FALSE);

-- Haftasonu
INSERT INTO shifts (schedule_id, date, type, start_time, end_time, required_staff, requires_responsible)
VALUES ('schedule-uuid', '2025-01-11', 'weekend_24h', '00:00', '24:00', 2, FALSE);
```

---

### 5. shift_assignments

**Açıklama**: Hemşirelerin vardiyalara atanması

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| shift_id | UUID | FOREIGN KEY → shifts(id) ON DELETE CASCADE | Shift referansı |
| nurse_id | UUID | FOREIGN KEY → nurses(id) ON DELETE CASCADE | Hemşire referansı |
| assignment_role | VARCHAR(50) | CHECK (assignment_role IN ('responsible', 'staff')) | Bu atamanın rolü |
| assigned_by | VARCHAR(50) | DEFAULT 'algorithm', CHECK (assigned_by IN ('algorithm', 'manual')) | Atama kaynağı |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Atama zamanı |

**Constraints**:
```sql
-- Bir hemşire aynı vardiyaya iki kez atanamaz
ALTER TABLE shift_assignments
ADD CONSTRAINT unique_shift_nurse UNIQUE(shift_id, nurse_id);
```

**Indexes**:
```sql
CREATE INDEX idx_assignments_nurse ON shift_assignments(nurse_id);
-- Belirli bir hemşirenin tüm atamalarını hızlı getirmek için

CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id);
-- Belirli bir vardiyanın tüm atamalarını hızlı getirmek için
```

**Triggers**:
```sql
-- Sorumlu hemşire sadece 8 saatlik vardiyaya atanabilir
CREATE OR REPLACE FUNCTION validate_responsible_shift()
RETURNS TRIGGER AS $$
DECLARE
  v_nurse_role VARCHAR(50);
  v_shift_type VARCHAR(50);
BEGIN
  -- Get nurse role
  SELECT role INTO v_nurse_role FROM nurses WHERE id = NEW.nurse_id;

  -- Get shift type
  SELECT type INTO v_shift_type FROM shifts WHERE id = NEW.shift_id;

  -- Sorumlu hemşire sadece 8 saatlik gündüz çalışabilir
  IF v_nurse_role = 'responsible' AND v_shift_type != 'day_8h' THEN
    RAISE EXCEPTION 'Sorumlu hemşire sadece 8 saatlik gündüz vardiyasında çalışabilir';
  END IF;

  -- Assignment role'u otomatik ayarla
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
```

**Sample Data**:
```sql
-- Gündüz vardiyası: 2 staf + 1 sorumlu
INSERT INTO shift_assignments (shift_id, nurse_id, assignment_role, assigned_by) VALUES
  ('shift-day-uuid', 'responsible-nurse-uuid', 'responsible', 'algorithm'),
  ('shift-day-uuid', 'staff-nurse-1-uuid', 'staff', 'algorithm'),
  ('shift-day-uuid', 'staff-nurse-2-uuid', 'staff', 'algorithm');

-- Gece vardiyası: 2 staf
INSERT INTO shift_assignments (shift_id, nurse_id, assignment_role, assigned_by) VALUES
  ('shift-night-uuid', 'staff-nurse-3-uuid', 'staff', 'algorithm'),
  ('shift-night-uuid', 'staff-nurse-4-uuid', 'staff', 'algorithm');
```

---

### 6. constraints

**Açıklama**: Sistem kısıtlamaları ve kuralları

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Kısıtlama adı (Türkçe) |
| type | VARCHAR(100) | NOT NULL | Kısıtlama tipi |
| value | INTEGER | NOT NULL | Kısıtlama değeri |
| is_active | BOOLEAN | DEFAULT TRUE | Aktif mi? |

**Sample Data**:
```sql
INSERT INTO constraints (name, type, value, is_active) VALUES
  ('Maksimum Ardışık Çalışma Günü', 'max_consecutive_days', 5, TRUE),
  ('Gece Sonrası Minimum Dinlenme (gün)', 'min_rest_after_night', 1, TRUE),
  ('Maksimum Ardışık Gece Nöbeti', 'max_consecutive_nights', 3, TRUE),
  ('Aylık Maksimum Gece Nöbeti', 'max_night_shifts_per_month', 10, TRUE),
  ('Aylık Maksimum Haftasonu Vardiyası', 'max_weekend_shifts_per_month', 4, TRUE);
```

---

## Views

### 1. shift_completeness

**Açıklama**: Her vardiya için doluluk durumu

```sql
CREATE VIEW shift_completeness AS
SELECT
  s.id as shift_id,
  s.schedule_id,
  s.date,
  s.type,
  s.required_staff,
  s.requires_responsible,

  -- Mevcut atamalar
  COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END) as current_staff,
  COUNT(CASE WHEN sa.assignment_role = 'responsible' THEN 1 END) as current_responsible,

  -- Tamamlanma durumu
  CASE
    WHEN s.requires_responsible = TRUE AND
         COUNT(CASE WHEN sa.assignment_role = 'responsible' THEN 1 END) = 0
    THEN FALSE
    WHEN COUNT(CASE WHEN sa.assignment_role = 'staff' THEN 1 END) < s.required_staff
    THEN FALSE
    ELSE TRUE
  END as is_complete,

  -- Durum mesajı
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
```

**Usage**:
```sql
-- Bir schedule'ın tüm eksik vardiyalarını bul
SELECT * FROM shift_completeness
WHERE schedule_id = 'some-uuid' AND is_complete = FALSE;

-- Belirli bir günün durumunu kontrol et
SELECT * FROM shift_completeness
WHERE date = '2025-01-06';
```

---

### 2. nurse_monthly_stats (Materialized View)

**Açıklama**: Hemşire bazlı aylık istatistikler

```sql
CREATE MATERIALIZED VIEW nurse_monthly_stats AS
SELECT
  sa.nurse_id,
  n.name as nurse_name,
  n.role as nurse_role,
  s.schedule_id,
  sch.month,

  -- Toplam saat
  SUM(
    CASE
      WHEN sh.type = 'day_8h' THEN 8
      WHEN sh.type = 'night_16h' THEN 16
      WHEN sh.type = 'weekend_24h' THEN 24
      ELSE 0
    END
  ) as total_hours,

  -- Gece nöbeti sayısı
  SUM(CASE WHEN sh.type IN ('night_16h', 'weekend_24h') THEN 1 ELSE 0 END) as night_shift_count,

  -- Haftasonu vardiyası sayısı
  SUM(CASE WHEN EXTRACT(DOW FROM sh.date) IN (0, 6) OR sh.type = 'weekend_24h' THEN 1 ELSE 0 END) as weekend_shift_count,

  -- Toplam vardiya sayısı
  COUNT(*) as total_shift_count,

  -- Gündüz vardiyası sayısı (sadece sorumlu için anlamlı)
  SUM(CASE WHEN sh.type = 'day_8h' THEN 1 ELSE 0 END) as day_shift_count

FROM shift_assignments sa
JOIN nurses n ON sa.nurse_id = n.id
JOIN shifts sh ON sa.shift_id = sh.id
JOIN schedules s ON sh.schedule_id = s.id
JOIN schedules sch ON s.id = sch.id
GROUP BY sa.nurse_id, n.name, n.role, s.schedule_id, sch.month;

-- Index for faster queries
CREATE INDEX idx_stats_nurse_schedule ON nurse_monthly_stats(nurse_id, schedule_id);
CREATE INDEX idx_stats_schedule ON nurse_monthly_stats(schedule_id);
```

**Refresh**:
```sql
-- Schedule güncellendiğinde refresh et
REFRESH MATERIALIZED VIEW nurse_monthly_stats;
```

**Usage**:
```sql
-- Bir schedule için tüm hemşire istatistikleri
SELECT * FROM nurse_monthly_stats
WHERE schedule_id = 'some-uuid'
ORDER BY nurse_role DESC, total_hours DESC;

-- Sadece staf hemşire istatistikleri (adalet hesaplama için)
SELECT * FROM nurse_monthly_stats
WHERE schedule_id = 'some-uuid' AND nurse_role = 'staff';
```

---

## Functions

### 1. calculate_fairness_score

**Açıklama**: Adalet skorunu hesapla (0-100)

```sql
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
      AND nurse_role = 'staff'  -- SADECE STAF HEMŞİRELER
  ),
  deviations AS (
    SELECT
      COALESCE(STDDEV(total_hours), 0) as hours_dev,
      COALESCE(STDDEV(night_shift_count::DECIMAL), 0) as nights_dev,
      COALESCE(STDDEV(weekend_shift_count::DECIMAL), 0) as weekends_dev
    FROM staff_stats
  )
  SELECT
    -- Genel skor (ağırlıklı ortalama)
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
```

**Usage**:
```sql
-- Bir schedule için adalet skorunu hesapla
SELECT * FROM calculate_fairness_score('schedule-uuid');

-- Sonuç:
-- fairness_score: 87.50
-- hours_std_dev: 4.2
-- nights_std_dev: 0.7
-- weekends_std_dev: 0.5
-- hours_score: 95.00
-- nights_score: 93.00
-- weekends_score: 90.00
```

---

## Indexes Summary

```sql
-- Nurses
CREATE UNIQUE INDEX idx_single_responsible ON nurses(role) WHERE role = 'responsible';

-- Leaves
CREATE INDEX idx_leaves_nurse_dates ON leaves(nurse_id, start_date, end_date);

-- Shifts
CREATE INDEX idx_shifts_schedule_date ON shifts(schedule_id, date);

-- Shift Assignments
CREATE INDEX idx_assignments_nurse ON shift_assignments(nurse_id);
CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id);

-- Stats
CREATE INDEX idx_stats_nurse_schedule ON nurse_monthly_stats(nurse_id, schedule_id);
CREATE INDEX idx_stats_schedule ON nurse_monthly_stats(schedule_id);
```

---

## Migration Strategy

### Migration Files Order

```
001_initial_schema.sql       - Tables + Primary keys
002_add_foreign_keys.sql     - Foreign key constraints
003_add_indexes.sql          - Performance indexes
004_add_triggers.sql         - Business logic triggers
005_add_views.sql            - Views and materialized views
006_add_functions.sql        - Utility functions
007_seed_constraints.sql     - Default constraint values
```

---

## Backup Strategy

```sql
-- Full backup
pg_dump shift_planner > backup_$(date +%Y%m%d).sql

-- Schema only
pg_dump --schema-only shift_planner > schema.sql

-- Data only
pg_dump --data-only shift_planner > data.sql

-- Specific table
pg_dump -t nurses shift_planner > nurses_backup.sql
```

---

## Performance Considerations

1. **Indexes**: All foreign keys indexed
2. **Materialized Views**: Statistics pre-computed
3. **Partial Indexes**: `idx_single_responsible` only indexes responsible nurses
4. **Triggers**: Validation logic in database (data integrity)
5. **Connection Pooling**: PgBouncer (via Supabase)

---

## Security

1. **Row Level Security (RLS)**: Supabase built-in
2. **Parameterized Queries**: Prevent SQL injection
3. **Constraints**: Data integrity at database level
4. **Audit Trail**: created_at, updated_at timestamps
