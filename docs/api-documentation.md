# Shift Planner - API Documentation

## Base URL

```
Development: http://localhost:8080/api
Production:  https://api.shift-planner.com/api
```

## Authentication

Tüm endpoint'ler Supabase Auth ile korunur (gelecekte eklenecek).

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "İşlem başarılı"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": { ... }
  }
}
```

---

## Endpoints

### 1. Nurses

#### GET /api/nurses

Tüm hemşireleri listele.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ayşe Yılmaz",
      "role": "responsible",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Fatma Demir",
      "role": "staff",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/nurses

Yeni hemşire ekle.

**Request:**
```json
{
  "name": "Mehmet Kaya",
  "role": "staff"
}
```

**Validation:**
- `name`: required, string, min 2 chars
- `role`: required, enum ['responsible', 'staff']
- Sadece 1 sorumlu hemşire olabilir

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mehmet Kaya",
    "role": "staff",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400`: Validation error
- `409`: Sorumlu hemşire zaten var (role = 'responsible')

---

#### PUT /api/nurses/:id

Hemşire bilgilerini güncelle.

**Request:**
```json
{
  "name": "Mehmet Kaya (Güncellendi)"
}
```

**Note**: `role` değiştirilemez (güvenlik nedeniyle).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mehmet Kaya (Güncellendi)",
    "role": "staff",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  }
}
```

---

#### DELETE /api/nurses/:id

Hemşireyi sil.

**Response:**
```json
{
  "success": true,
  "message": "Hemşire silindi"
}
```

**Errors:**
- `404`: Hemşire bulunamadı
- `409`: Sorumlu hemşire silinemez

---

### 2. Leaves

#### GET /api/leaves

İzinleri listele.

**Query Parameters:**
- `nurse_id` (optional): Belirli bir hemşirenin izinleri
- `month` (optional): Belirli bir ay (YYYY-MM format)

**Example:**
```
GET /api/leaves?nurse_id=uuid&month=2025-01
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nurse_id": "uuid",
      "nurse_name": "Fatma Demir",
      "type": "annual",
      "start_date": "2025-01-05",
      "end_date": "2025-01-10",
      "notes": "Yıllık izin",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/leaves

Yeni izin ekle.

**Request:**
```json
{
  "nurse_id": "uuid",
  "type": "annual",
  "start_date": "2025-01-15",
  "end_date": "2025-01-20",
  "notes": "Yıllık izin"
}
```

**Validation:**
- `nurse_id`: required, valid UUID
- `type`: required, enum ['annual', 'excuse', 'sick', 'preference']
- `start_date`: required, date (YYYY-MM-DD)
- `end_date`: required, date >= start_date
- `notes`: optional, string

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nurse_id": "uuid",
    "type": "annual",
    "start_date": "2025-01-15",
    "end_date": "2025-01-20",
    "notes": "Yıllık izin",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

#### PUT /api/leaves/:id

İzin güncelle.

**Request:**
```json
{
  "end_date": "2025-01-22",
  "notes": "Uzatıldı"
}
```

---

#### DELETE /api/leaves/:id

İzin sil.

**Response:**
```json
{
  "success": true,
  "message": "İzin silindi"
}
```

---

### 3. Schedules

#### GET /api/schedules

Tüm planları listele.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "month": "2025-01-01",
      "status": "published",
      "fairness_score": 87.5,
      "created_at": "2024-12-28T00:00:00Z",
      "updated_at": "2024-12-29T00:00:00Z"
    }
  ]
}
```

---

#### GET /api/schedules/:month

Belirli ay planını getir (shifts ve assignments dahil).

**Parameters:**
- `month`: YYYY-MM format (örn: 2025-01)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "month": "2025-01-01",
    "status": "published",
    "fairness_score": 87.5,
    "days": [
      {
        "date": "2025-01-06",
        "is_weekend": false,
        "is_holiday": false,
        "shifts": [
          {
            "id": "uuid",
            "type": "day_8h",
            "start_time": "08:00",
            "end_time": "16:00",
            "required_staff": 2,
            "requires_responsible": true,
            "assignments": [
              {
                "id": "uuid",
                "nurse_id": "uuid",
                "nurse_name": "Ayşe Yılmaz",
                "nurse_role": "responsible",
                "assignment_role": "responsible",
                "assigned_by": "algorithm"
              },
              {
                "id": "uuid",
                "nurse_id": "uuid",
                "nurse_name": "Fatma Demir",
                "nurse_role": "staff",
                "assignment_role": "staff",
                "assigned_by": "algorithm"
              }
            ]
          }
        ]
      }
    ],
    "stats": {
      "total_days": 31,
      "complete_shifts": 62,
      "incomplete_shifts": 0
    }
  }
}
```

---

#### POST /api/schedules/generate

Otomatik plan oluştur.

**Request:**
```json
{
  "month": "2025-02"
}
```

**Process:**
1. Hemşire ve izin bilgilerini çek
2. Algoritma ile plan oluştur
3. Database'e kaydet (status: 'draft')
4. Fairness score hesapla
5. Schedule'ı döndür

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "month": "2025-02-01",
    "status": "draft",
    "fairness_score": 89.2,
    "warnings": [
      "05.02.2025: Sorumlu hemşire izinde",
      "15.02.2025 gece: Sadece 1 staf bulunabildi"
    ],
    "generation_time_ms": 487
  }
}
```

**Errors:**
- `400`: Ay parametresi eksik veya geçersiz
- `409`: Bu ay için plan zaten var
- `500`: Plan oluşturma hatası

---

#### PUT /api/schedules/:id

Planı güncelle (manuel düzenlemeler).

**Request:**
```json
{
  "status": "published"
}
```

---

#### POST /api/schedules/:id/publish

Planı yayınla (status: draft → published).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "month": "2025-02-01",
    "status": "published",
    "fairness_score": 89.2
  }
}
```

---

#### DELETE /api/schedules/:id

Planı sil.

**Response:**
```json
{
  "success": true,
  "message": "Plan silindi"
}
```

**Errors:**
- `409`: Yayınlanmış plan silinemez (önce archived yapılmalı)

---

### 4. Shifts

#### GET /api/shifts

Vardiyaları listele.

**Query Parameters:**
- `schedule_id` (required): Schedule ID
- `date` (optional): Belirli bir gün (YYYY-MM-DD)

**Example:**
```
GET /api/shifts?schedule_id=uuid&date=2025-01-06
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "schedule_id": "uuid",
      "date": "2025-01-06",
      "type": "day_8h",
      "start_time": "08:00",
      "end_time": "16:00",
      "required_staff": 2,
      "requires_responsible": true,
      "is_complete": true,
      "current_staff": 2,
      "current_responsible": 1,
      "assignments": [ ... ]
    }
  ]
}
```

---

#### POST /api/shifts

Yeni vardiya oluştur (genelde otomatik oluşturulur).

**Request:**
```json
{
  "schedule_id": "uuid",
  "date": "2025-01-06",
  "type": "day_8h",
  "start_time": "08:00",
  "end_time": "16:00"
}
```

---

### 5. Shift Assignments

#### POST /api/shifts/:shift_id/assign

Hemşireyi vardiyaya ata.

**Request:**
```json
{
  "nurse_id": "uuid"
}
```

**Validation:**
- Hemşire var mı?
- Hemşire bu günde izinde mi?
- Sorumlu hemşire gece vardiyasına atanıyor mu? → HATA
- Vardiya dolu mu? (max 2 staf + 1 sorumlu)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "shift_id": "uuid",
    "nurse_id": "uuid",
    "assignment_role": "staff",
    "assigned_by": "manual",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400`: Validation hatası
- `409`: Sorumlu hemşire gece vardiyasında çalışamaz
- `409`: Vardiya dolu

---

#### DELETE /api/assignments/:id

Atamayı kaldır.

**Response:**
```json
{
  "success": true,
  "message": "Atama kaldırıldı"
}
```

---

### 6. Statistics

#### GET /api/stats/monthly/:schedule_id

Aylık istatistikler.

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid",
    "month": "2025-01",
    "fairness_score": {
      "overall": 87.5,
      "hours_score": 92.0,
      "nights_score": 85.0,
      "weekends_score": 88.0,
      "hours_std_dev": 4.2,
      "nights_std_dev": 0.7,
      "weekends_std_dev": 0.5
    },
    "nurses": [
      {
        "nurse_id": "uuid",
        "nurse_name": "Fatma Demir",
        "nurse_role": "staff",
        "total_hours": 152,
        "night_shift_count": 6,
        "weekend_shift_count": 2,
        "total_shift_count": 19,
        "day_shift_count": 13
      },
      {
        "nurse_id": "uuid",
        "nurse_name": "Ayşe Yılmaz",
        "nurse_role": "responsible",
        "total_hours": 152,
        "night_shift_count": 0,
        "weekend_shift_count": 0,
        "total_shift_count": 19,
        "day_shift_count": 19
      }
    ],
    "averages": {
      "staff_avg_hours": 154.7,
      "staff_avg_nights": 6.2,
      "staff_avg_weekends": 2.3
    }
  }
}
```

---

### 7. Export

#### GET /api/schedules/:id/export/excel

Excel formatında export.

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File: `shift-plan-2025-01.xlsx`

**Excel Sheets:**
1. **Aylık Plan**: Takvim görünümü (günler x vardiyalar)
2. **İstatistikler**: Hemşire bazlı özet
3. **İzinler**: Tüm izinler

---

#### GET /api/schedules/:id/export/csv

CSV formatında export.

**Response:**
- Content-Type: `text/csv; charset=utf-8`
- File: `shift-plan-2025-01.csv`

**CSV Format:**
```csv
Tarih,Vardiya,Hemşire,Rol,Atama Tipi
2025-01-06,Gündüz (08:00-16:00),Ayşe Yılmaz,Sorumlu,Otomatik
2025-01-06,Gündüz (08:00-16:00),Fatma Demir,Staf,Otomatik
2025-01-06,Gece (16:00-08:00),Mehmet Kaya,Staf,Otomatik
```

---

### 8. Validation

#### GET /api/schedules/:id/validate

Schedule'ı doğrula.

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "errors": [
      "05.01.2025 gündüz: Sorumlu hemşire eksik",
      "12.01.2025 gece: Staf eksik (1/2)"
    ],
    "warnings": [
      "15.01.2025 gündüz: Fazla staf (3/2)"
    ],
    "completeness": {
      "total_shifts": 62,
      "complete_shifts": 58,
      "percentage": 93.5
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Girdi doğrulama hatası |
| `NOT_FOUND` | 404 | Kaynak bulunamadı |
| `DUPLICATE` | 409 | Duplicate entry (örn: sorumlu hemşire zaten var) |
| `INVALID_ASSIGNMENT` | 409 | Geçersiz atama (örn: sorumlu hemşire gece vardiyasında) |
| `INTERNAL_ERROR` | 500 | Sunucu hatası |

---

## Rate Limiting

```
100 requests / 15 minutes per IP
```

---

## CORS

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Versioning

```
Current: v1
Future: /api/v2/...
```

---

## WebSocket (Future Feature)

Real-time updates için WebSocket desteği (v2.0).

```
ws://localhost:8080/ws
```

**Events:**
- `schedule:updated` - Plan güncellendi
- `assignment:changed` - Atama değişti
- `nurse:online` - Hemşire online (multi-user future)
