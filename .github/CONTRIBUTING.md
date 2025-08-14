# Katkıda Bulunma Rehberi

Denizli Akıllı Durak Sistemi projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, katkı sürecini daha kolay hale getirmek için hazırlanmıştır.

## İçindekiler

- [Davranış Kuralları](#davranış-kuralları)
- [Katkı Türleri](#katkı-türleri)
- [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
- [Katkı Süreci](#katkı-süreci)
- [Kod Standartları](#kod-standartları)
- [Commit Kuralları](#commit-kuralları)
- [Pull Request Süreci](#pull-request-süreci)
- [Yardım ve Destek](#yardım-ve-destek)

## Davranış Kuralları

Bu proje, açık ve misafirperver bir ortam yaratmayı hedefler. Lütfen:

- Saygılı ve profesyonel davranın
- Farklı görüşlere açık olun
- Yapıcı geri bildirimde bulunun
- Herkesin öğrenme sürecinde olduğunu unutmayın
- İnsan onuruna saygı gösterin

## Katkı Türleri

Aşağıdaki yollarla katkıda bulunabilirsiniz:

### Hata Bildirimi
- Uygulamadaki hataları rapor edin
- Repro adımlarını net şekilde belirtin
- Ekran görüntüleri ekleyin

### Özellik Önerisi
- Yeni özellik fikirlerinizi paylaşın
- Kullanım senaryolarını açıklayın
- Mockup veya wireframe ekleyin

### Kod Katkısı
- Hata düzeltmeleri
- Yeni özellik geliştirme
- Performans iyileştirmeleri
- Test yazımı

### Dokümantasyon
- README iyileştirmeleri
- Kod yorumları
- API dokümantasyonu
- Kullanım kılavuzları

### Tasarım ve UX
- UI/UX iyileştirmeleri
- Erişilebilirlik geliştirmeleri
- Görsel tasarım önerileri

## Geliştirme Ortamı Kurulumu

### Gereksinimler
- Node.js 18+ 
- npm, yarn veya pnpm
- Git

### Kurulum Adımları

1. **Repository'yi fork edin**
   ```bash
   # GitHub üzerinden fork edin
   ```

2. **Projeyi klonlayın**
   ```bash
   git clone https://github.com/YOUR_USERNAME/denizli-ulasim-durak.git
   cd denizli-ulasim-durak
   ```

3. **Bağımlılıkları yükleyin**
   ```bash
   pnpm install  # veya npm install / yarn install
   ```

4. **Geliştirme sunucusunu başlatın**
   ```bash
   pnpm dev  # veya npm run dev / yarn dev
   ```

5. **Upstream remote ekleyin**
   ```bash
   git remote add upstream https://github.com/umutcandev/denizli-ulasim-durak.git
   ```

## Katkı Süreci

### 1. Issue Oluşturma/Seçme
- Çalışmak istediğiniz konuyu issue olarak oluşturun
- Mevcut issue'lardan birini seçin
- Issue'yu kendinize assign edin

### 2. Branch Oluşturma
```bash
git checkout -b feature/amazing-feature
# veya
git checkout -b fix/bug-description
# veya
git checkout -b docs/documentation-update
```

### Branch İsimlendirme Kuralları:
- `feature/`: Yeni özellikler için
- `fix/`: Hata düzeltmeleri için
- `docs/`: Dokümantasyon güncellemeleri için
- `refactor/`: Kod yeniden düzenleme için
- `test/`: Test ekleme/güncelleme için

### 3. Geliştirme
- Kod standartlarına uygun geliştirme yapın
- Düzenli olarak commit yapın
- Test yazın (gerekiyorsa)

### 4. Test Etme
```bash
# Linting kontrolü
pnpm lint

# Type checking
pnpm type-check

# Build testi
pnpm build
```

## Kod Standartları

### TypeScript
- Strict mode kullanın
- Tip tanımlarını açık şekilde belirtin
- `any` tipinden kaçının

### React/Next.js
- Functional component'ler kullanın
- Hook'ları doğru şekilde kullanın
- Server/Client component'lerini ayırt edin

### Stil Kuralları
- Tailwind CSS utility class'larını kullanın
- Shadcn/ui component standartlarını takip edin
- Responsive tasarım prensiplerine uyun

### Kod Organizasyonu
```
src/
├── components/        # Reusable components
├── app/              # Next.js app router
├── lib/              # Utility functions
├── hooks/            # Custom hooks
└── types/            # Type definitions
```

## Commit Kuralları

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanın:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Türleri:
- `feat`: Yeni özellik
- `fix`: Hata düzeltmesi
- `docs`: Dokümantasyon değişikliği
- `style`: Kod formatı değişikliği
- `refactor`: Kod yeniden düzenleme
- `test`: Test ekleme/güncelleme
- `chore`: Build süreci, araç konfigürasyonu

### Örnekler:
```bash
feat(api): add weather data endpoint
fix(ui): resolve mobile navigation issue
docs(readme): update installation instructions
style(components): format button component
refactor(utils): simplify API helper functions
```

## Pull Request Süreci

### PR Hazırlığı
1. **Branch'inizi güncel tutun**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Son kontroller**
   - Linting hatası yok
   - Build başarılı
   - Testler geçiyor

3. **PR oluşturun**
   - Açıklayıcı başlık yazın
   - Detaylı açıklama ekleyin
   - Screenshot/GIF ekleyin (UI değişikliği varsa)
   - İlgili issue'yu bağlayın

### PR Template
```markdown
## Değişiklik Açıklaması
Bu PR'da neler değişti?

## Değişiklik Türü
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Test Edildi Mi?
- [ ] Evet, test edildi
- [ ] Testler yazıldı/güncellendi

## Ekran Görüntüleri
(Varsa ekleyin)

## İlgili Issue
Closes #(issue number)
```

### İnceleme Süreci
1. Otomatik kontroller (CI/CD)
2. Kod incelemesi (code review)
3. Test edilmesi
4. Merge edilmesi

## Yardım ve Destek

### Sorularınız mı var?
- GitHub Discussions kullanın
- Issue açın (soru etiketi ile)
- Geliştirici ile iletişime geçin

### Faydalı Kaynaklar
- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [React Dokümantasyonu](https://react.dev/)
- [TypeScript Dokümantasyonu](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Dokümantasyonu](https://tailwindcss.com/docs)
