# Backend Test Plan

## Test Adımları

### 1. Database Setup
- [x] Docker container başlat
- [ ] Database migration çalıştır
- [ ] Sample data yükle
- [ ] Database bağlantısını test et

### 2. Backend Server
- [ ] Dependencies yükle (npm install)
- [ ] Environment variables ayarla
- [ ] Server başlat
- [ ] Health check

### 3. API Tests

#### Nurses API
- [ ] GET /api/nurses - List all
- [ ] GET /api/nurses/responsible - Get responsible
- [ ] GET /api/nurses/staff - Get staff
- [ ] POST /api/nurses - Create new
- [ ] PUT /api/nurses/:id - Update
- [ ] DELETE /api/nurses/:id - Delete

#### Leaves API
- [ ] GET /api/leaves - List all
- [ ] POST /api/leaves - Create
- [ ] PUT /api/leaves/:id - Update
- [ ] DELETE /api/leaves/:id - Delete

#### Schedules API (CORE)
- [ ] POST /api/schedules/generate - **Generate automatic schedule**
- [ ] GET /api/schedules/:month - Get schedule detail
- [ ] GET /api/schedules - List all
- [ ] POST /api/schedules/:id/publish - Publish
- [ ] DELETE /api/schedules/:id - Delete

#### Shifts API
- [ ] GET /api/shifts?schedule_id=... - Get shifts
- [ ] POST /api/shifts/:shift_id/assign - Assign nurse
- [ ] DELETE /api/shifts/assignments/:id - Remove assignment

#### Statistics API
- [ ] GET /api/stats/monthly/:schedule_id - Monthly stats
- [ ] GET /api/stats/nurse/:nurse_id/schedule/:schedule_id - Nurse details

### 4. Algorithm Validation
- [ ] Verify fairness score calculation
- [ ] Check constraint enforcement:
  - [ ] Responsible nurse only 8h shifts
  - [ ] Minimum 2 staff per shift
  - [ ] No double shifts same day
  - [ ] Rest period after night shift
  - [ ] Max consecutive days
- [ ] Verify shift distribution
- [ ] Check warnings generation

## Expected Results

### Sample Schedule (6 staff nurses)
- Total shifts: ~59 (for 28-day month)
- Total assignments: ~177
- Fairness score: 80-95
- Generation time: < 1 second
- Each staff: ~25-30 shifts
- Each staff: ~150-165 hours

## Test Commands

```bash
# Health check
curl http://localhost:8080/health

# List nurses
curl http://localhost:8080/api/nurses

# Generate schedule
curl -X POST http://localhost:8080/api/schedules/generate \
  -H "Content-Type: application/json" \
  -d '{"month": "2025-02"}'

# Get schedule
curl http://localhost:8080/api/schedules/2025-02

# Get statistics
curl http://localhost:8080/api/stats/monthly/{schedule_id}
```
