# 🏥 Shift Planner

Hemşireler için adaletli ve otomatik vardiya planlama sistemi.

## 📋 Proje Hakkında

Shift Planner, sorumlu hemşirelerin ekip için aylık vardiya planlarını hızlı, adaletli ve kolay bir şekilde oluşturmasını sağlayan web tabanlı bir uygulamadır. Akıllı algoritması sayesinde:

- ✅ Her hemşireye eşit sayıda gece nöbeti
- ✅ Dengeli haftasonu çalışması
- ✅ Eşit toplam çalışma saatleri
- ✅ Dinlenme periyotlarına uygun planlama
- ✅ İzin ve tercih desteği

## 🎯 Özellikler

### Hemşire Yönetimi
- 1 sorumlu + 4-9 staf hemşire tanımlama
- Rol bazlı kısıtlamalar (sorumlu sadece gündüz çalışır)

### Otomatik Plan Oluşturma
- Constraint-based scheduling algoritması
- Adalet skoru hesaplama (0-100)
- İzin ve tercih desteği

### Manuel Düzenleme
- Drag & drop ile hemşire ataması
- Real-time validation
- Uyarı ve hata mesajları

### İstatistikler
- Hemşire bazlı çalışma özeti
- Gece nöbeti/haftasonu dağılımı
- Adalet grafikleri

### Export
- Excel formatında rapor
- CSV formatında veri

## 🏗️ Teknoloji Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **TailwindCSS** (Styling)
- **Zustand** (State management)
- **React Query** (Server state)
- **dnd-kit** (Drag & drop)

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **PostgreSQL** (via Supabase)

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase

## 📁 Proje Yapısı

```
shift-planner/
├── frontend/          # React uygulaması
├── backend/           # Express API
├── docs/              # Dokümantasyon
│   ├── project-requirements.md
│   ├── architecture.md
│   ├── algorithm-design.md
│   ├── database-schema.md
│   └── api-documentation.md
└── README.md
```

## 🚀 Kurulum

### Gereksinimler

- Node.js 20+
- PostgreSQL 15+ (veya Docker)
- npm veya yarn

### 1. Repository'yi Clone'layın

```bash
git clone https://github.com/yourusername/shift-planner.git
cd shift-planner
```

### 2. Database Setup (Docker ile)

```bash
docker-compose up -d
```

veya PostgreSQL kurulu ise:

```bash
createdb shift_planner
psql shift_planner < backend/src/db/migrations/001_initial_schema.sql
```

### 3. Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin (DATABASE_URL, vb.)
npm run dev
```

Backend şimdi http://localhost:8080 adresinde çalışıyor.

### 4. Frontend Kurulumu

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin (VITE_API_URL, vb.)
npm run dev
```

Frontend şimdi http://localhost:5173 adresinde çalışıyor.

## 📖 Dokümantasyon

Detaylı dokümantasyon için:

- [Proje Gereksinimleri](docs/project-requirements.md)
- [Sistem Mimarisi](docs/architecture.md)
- [Algoritma Tasarımı](docs/algorithm-design.md)
- [Database Schema](docs/database-schema.md)
- [API Dokümantasyonu](docs/api-documentation.md)

## 🧪 Test

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Algoritma

Shift planlama algoritması 4 aşamada çalışır:

1. **Initialization**: Takvim oluşturma, izin uygulama
2. **Assignment**: Her güne hemşire atama (öncelik skoruna göre)
3. **Optimization**: Gece nöbeti/haftasonu/saat dengeleme
4. **Validation**: Hard constraint kontrolü, fairness score hesaplama

Detaylar için: [algorithm-design.md](docs/algorithm-design.md)

## 🎨 Screenshots

*(Gelecekte eklenecek)*

## 🗺️ Roadmap

### v1.0 (Current)
- [x] Hemşire yönetimi
- [x] İzin yönetimi
- [x] Otomatik plan oluşturma
- [x] Manuel düzenleme (drag & drop)
- [x] İstatistikler
- [x] Excel/CSV export

### v1.1 (Next)
- [ ] Authentication (Supabase Auth)
- [ ] Offline support
- [ ] Mobile-responsive UI improvements
- [ ] Türkçe/English language toggle

### v2.0 (Future)
- [ ] Multi-department support
- [ ] Self-service portal (hemşireler kendi izin taleplerini girebilir)
- [ ] Mobile app (iOS/Android)
- [ ] WhatsApp notifications
- [ ] Shift swap feature
- [ ] AI-powered predictions

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 License

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Geliştirici

[Your Name](https://github.com/yourusername)

## 🙏 Teşekkürler

- Antropic Claude (Algoritma tasarımı desteği)
- Open source community

## 📧 İletişim

Sorularınız için: [your.email@example.com](mailto:your.email@example.com)

---

**Not**: Bu proje aktif geliştirme aşamasındadır. Öneri ve geri bildirimlerinizi bekliyoruz!
