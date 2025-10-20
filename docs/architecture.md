# Shift Planner - Sistem Mimarisi

## Genel Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         React 18 + TypeScript                   │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  Components (UI)                         │  │    │
│  │  │  - Calendar, Nurses, Leaves, Stats       │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  State Management (Zustand)              │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  API Client (React Query)                │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS/REST API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Express + TypeScript                    │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  Routes (API Endpoints)                  │  │    │
│  │  │  - /api/nurses, /api/leaves, etc.        │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  Services (Business Logic)               │  │    │
│  │  │  - SchedulerService (CORE ALGORITHM)     │  │    │
│  │  │  - FairnessService                       │  │    │
│  │  │  - ExportService                         │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  Models (Data Access)                    │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ SQL
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL/Supabase)              │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Tables:                                        │    │
│  │  - nurses                                       │    │
│  │  - leaves                                       │    │
│  │  - schedules                                    │    │
│  │  - shifts                                       │    │
│  │  - shift_assignments                            │    │
│  │  - constraints                                  │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Views & Functions:                             │    │
│  │  - nurse_monthly_stats                          │    │
│  │  - shift_completeness                           │    │
│  │  - calculate_fairness_score()                   │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend

```json
{
  "framework": "React 18+",
  "language": "TypeScript 5+",
  "buildTool": "Vite 5+",
  "styling": "TailwindCSS 3+",
  "uiLibrary": "shadcn/ui (optional)",
  "stateManagement": "Zustand",
  "serverState": "TanStack Query (React Query)",
  "forms": "react-hook-form + zod",
  "dragAndDrop": "dnd-kit",
  "charts": "recharts",
  "dateUtils": "date-fns",
  "export": "xlsx"
}
```

**Neden bu stack?**
- **React 18**: Modern, performanslı, büyük ekosistem
- **TypeScript**: Type safety, daha az bug, better DX
- **Vite**: Son derece hızlı HMR, modern tooling
- **TailwindCSS**: Utility-first, hızlı development
- **Zustand**: Minimal boilerplate, kolay kullanım
- **React Query**: Server state management, caching, automatic refetching
- **react-hook-form**: Performanslı form handling
- **dnd-kit**: Modern, accessible drag & drop
- **date-fns**: Tree-shakeable, lightweight date library

### Backend

```json
{
  "runtime": "Node.js 20+",
  "framework": "Express 4+",
  "language": "TypeScript 5+",
  "database": "PostgreSQL 15+",
  "orm": "Raw SQL / pg library (lightweight)",
  "validation": "zod",
  "authentication": "Supabase Auth",
  "export": "exceljs / csv-stringify"
}
```

**Neden bu stack?**
- **Express**: Battle-tested, minimal, flexible
- **PostgreSQL**: ACID compliant, JSON support, powerful queries
- **Raw SQL**: Performans, full control, karmaşık queries için ideal
- **Supabase**: Built-in auth, real-time, offline support, free tier

### Database

- **Production**: PostgreSQL (via Supabase)
- **Local Development**: PostgreSQL (Docker)
- **Offline Fallback**: SQLite (optional)

### DevOps & Deployment

```
Frontend:
├── Hosting: Vercel / Netlify
├── CDN: Automatic (built-in)
└── Environment: Production, Preview branches

Backend:
├── Hosting: Railway / Render / Fly.io
├── CI/CD: GitHub Actions
└── Monitoring: Sentry (error tracking)

Database:
├── Hosting: Supabase (managed PostgreSQL)
├── Backups: Automatic daily backups
└── Migrations: Custom migration system
```

## Proje Klasör Yapısı

```
shift-planner/
├── frontend/                    # React frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Calendar/
│   │   │   │   ├── CalendarGrid.tsx
│   │   │   │   ├── ShiftCell.tsx
│   │   │   │   ├── DraggableNurse.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Nurses/
│   │   │   │   ├── NurseList.tsx
│   │   │   │   ├── NurseForm.tsx
│   │   │   │   ├── NurseCard.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Leaves/
│   │   │   │   ├── LeaveList.tsx
│   │   │   │   ├── LeaveForm.tsx
│   │   │   │   ├── LeaveCalendar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Statistics/
│   │   │   │   ├── StatsTable.tsx
│   │   │   │   ├── FairnessChart.tsx
│   │   │   │   ├── MonthlyOverview.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui/              # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       └── ...
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ScheduleEditor.tsx
│   │   │   └── Login.tsx
│   │   ├── services/            # API services
│   │   │   ├── api.ts           # Axios/fetch wrapper
│   │   │   ├── nurseService.ts
│   │   │   ├── leaveService.ts
│   │   │   ├── scheduleService.ts
│   │   │   └── exportService.ts
│   │   ├── stores/              # Zustand stores
│   │   │   ├── nurseStore.ts
│   │   │   ├── scheduleStore.ts
│   │   │   ├── leaveStore.ts
│   │   │   └── authStore.ts
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useNurses.ts
│   │   │   ├── useSchedule.ts
│   │   │   └── useLeaves.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── dateUtils.ts
│   │   │   ├── fairnessCalculator.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── routes/              # API routes
│   │   │   ├── nurses.ts
│   │   │   ├── leaves.ts
│   │   │   ├── schedules.ts
│   │   │   ├── shifts.ts
│   │   │   ├── stats.ts
│   │   │   └── index.ts
│   │   ├── services/            # Business logic
│   │   │   ├── scheduler.service.ts   # CORE ALGORITHM
│   │   │   ├── fairness.service.ts
│   │   │   ├── validation.service.ts
│   │   │   └── export.service.ts
│   │   ├── models/              # Database models
│   │   │   ├── Nurse.ts
│   │   │   ├── Leave.ts
│   │   │   ├── Schedule.ts
│   │   │   ├── Shift.ts
│   │   │   └── index.ts
│   │   ├── db/                  # Database setup
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   ├── 002_add_indexes.sql
│   │   │   │   └── 003_add_views.sql
│   │   │   └── seeds/
│   │   │       └── sample_data.sql
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── dateUtils.ts
│   │   │   └── logger.ts
│   │   └── server.ts            # Express app entry point
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Shared code
│   └── types/
│       └── index.ts             # Shared TypeScript types
│
├── docs/                        # Documentation
│   ├── project-requirements.md
│   ├── architecture.md
│   ├── algorithm-design.md
│   ├── database-schema.md
│   └── api-documentation.md
│
├── .gitignore
├── README.md
├── docker-compose.yml           # Local PostgreSQL
└── package.json                 # Root workspace config
```

## Data Flow

### 1. Plan Oluşturma Akışı

```
[User] "Yeni Plan Oluştur" butonuna tıklar
  │
  ▼
[Frontend] POST /api/schedules/generate
  │ Body: { month: "2025-01", nurses: [...], leaves: [...] }
  │
  ▼
[Backend Routes] schedules.ts
  │
  ▼
[SchedulerService] generateSchedule()
  │
  ├─► [1] Takvim oluştur (ayın tüm günleri)
  │
  ├─► [2] İzinleri uygula
  │
  ├─► [3] Her gün için shift ata
  │   ├─ Hafta içi → 8h (2 staf + 1 sorumlu) + 16h (2 staf)
  │   └─ Haftasonu → 24h (2 staf)
  │
  ├─► [4] Adalet optimizasyonu
  │   ├─ Gece nöbetlerini dengele
  │   ├─ Haftasonu vardiyalarını dengele
  │   └─ Toplam saatleri dengele
  │
  ├─► [5] Dinlenme periyotlarını kontrol et
  │
  └─► [6] Fairness score hesapla
  │
  ▼
[Database] INSERT schedule, shifts, assignments
  │
  ▼
[Backend] Response: { schedule, fairness_score, warnings }
  │
  ▼
[Frontend] Schedule'ı render et + Uyarıları göster
  │
  ▼
[User] Manuel düzenlemeler yapar (drag & drop)
  │
  ▼
[Frontend] PUT /api/schedules/:id
  │
  ▼
[Backend] Update assignments
  │
  ▼
[Frontend] Schedule güncellendi
```

### 2. Manuel Düzenleme Akışı

```
[User] Bir hemşireyi sürükler (drag)
  │
  ▼
[Frontend] DnD component tetiklenir
  │
  ▼
[User] Başka bir vardiyaya bırakır (drop)
  │
  ▼
[Frontend] Validation check (local)
  │ - Sorumlu hemşire gece vardiyasına atanabilir mi? → HAYIR
  │ - Bu vardiya dolu mu? (max 2 staf) → Kontrol et
  │ - Bu hemşire zaten başka vardiyada mı? → Kontrol et
  │
  ├─► [VALID] → Optimistic update (UI hemen güncelle)
  │   │
  │   ▼
  │   POST /api/shifts/:shift_id/assign
  │   Body: { nurse_id, assigned_by: 'manual' }
  │   │
  │   ▼
  │   [Backend] Validation + Database update
  │   │
  │   ├─► [SUCCESS] → Confirm update
  │   │
  │   └─► [ERROR] → Rollback UI + Hata göster
  │
  └─► [INVALID] → Kullanıcıya uyarı göster (drag cancel)
```

## API Design Principles

### RESTful Endpoints

```
Resource-based URLs:
✅ GET    /api/nurses
✅ POST   /api/nurses
✅ GET    /api/nurses/:id
✅ PUT    /api/nurses/:id
✅ DELETE /api/nurses/:id

Action-based URLs (sadece gerekirse):
✅ POST   /api/schedules/generate      (complex operation)
✅ POST   /api/schedules/:id/publish   (state change)
✅ GET    /api/schedules/:id/export    (complex read)
```

### Response Format

```typescript
// Success Response
{
  success: true,
  data: {...} | [...],
  message: "İşlem başarılı"
}

// Error Response
{
  success: false,
  error: {
    code: "INVALID_ASSIGNMENT",
    message: "Sorumlu hemşire gece vardiyasında çalışamaz",
    details: {...}
  }
}

// Validation Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Girdi hatası",
    fields: {
      nurse_id: "Geçersiz hemşire ID",
      shift_id: "Vardiya bulunamadı"
    }
  }
}
```

## Security Considerations

### Authentication
- Supabase Auth (JWT)
- HttpOnly cookies
- CSRF protection

### Authorization
- Tek kullanıcı (sorumlu hemşire) - basit auth
- Future: Role-based access control (RBAC)

### Data Protection
- SQL injection prevention (parameterized queries)
- Input validation (zod)
- XSS protection (React automatic escaping)
- Rate limiting (express-rate-limit)

## Performance Optimization

### Frontend
- Code splitting (React.lazy)
- Memoization (useMemo, useCallback)
- Virtual scrolling (long lists)
- Image optimization (lazy loading)

### Backend
- Database indexing
- Query optimization
- Response caching (short-lived)
- Connection pooling

### Database
- Materialized views for statistics
- Proper indexes on foreign keys
- Partial indexes (WHERE clauses)

## Monitoring & Logging

```
Frontend:
├── Error tracking: Sentry
├── Analytics: Plausible (privacy-friendly)
└── Performance: Web Vitals

Backend:
├── Logging: Winston / Pino
├── Error tracking: Sentry
├── Performance: APM (optional)
└── Health checks: /health endpoint

Database:
├── Query performance: pg_stat_statements
└── Connection monitoring: Supabase dashboard
```

## Deployment Strategy

### Frontend (Vercel)
```bash
# Automatic deployment
git push origin main → Vercel auto-deploy

# Environment variables
VITE_API_URL=https://api.shift-planner.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Backend (Railway)
```bash
# Automatic deployment
git push origin main → Railway auto-deploy

# Environment variables
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
NODE_ENV=production
PORT=8080
```

### Database (Supabase)
- Managed PostgreSQL
- Automatic backups
- Point-in-time recovery
- Connection pooling (PgBouncer)

## Disaster Recovery

### Backup Strategy
- Database: Daily automatic backups (Supabase)
- Code: Git (GitHub)
- Environment variables: 1Password / Vault

### Recovery Plan
1. Database corruption → Restore from backup
2. Service outage → Redeploy from Git
3. Data loss → Point-in-time recovery

## Future Scalability

### Horizontal Scaling (if needed)
- Multiple backend instances (stateless)
- Load balancer (Railway/Nginx)
- Database read replicas

### Vertical Scaling
- Upgrade Supabase plan
- Optimize queries
- Add caching layer (Redis)
