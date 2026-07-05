# Nuxt Auth Boilerplate

Merhaba! Bu proje, Nuxt kullanarak yeni bir uygulamaya başlarken tekrar tekrar auth (kimlik doğrulama) sistemi yazmamak için hazırladığım bir başlangıç şablonu. İçerisinde modern bir web uygulamasının ihtiyaç duyabileceği neredeyse tüm temel üyelik işlevleri arka uç ve ön yüzüyle birlikte hazır durumda.

Tasarım tarafında dışarıdan ağır bir UI kütüphanesi yüklemek yerine, saf CSS ile **Google Material Design 2 Koyu Tema** dinamiklerini kurguladım. Animasyonlar için de VueUse Motion kullanarak geçişleri yumuşattım.

## Neler Var?

- **Kayıt ve Giriş:** Zod ile veri doğrulama, Bcrypt ile güvenli şifre saklama.
- **JWT Oturum Yönetimi:** Çalınmalara karşı HTTP-Only cookie tabanlı güvenli oturum yönetimi.
- **E-posta Doğrulama:** EmailThing altyapısı kullanarak kayıt sonrası link ile hesap aktifleştirme.
- **Şifremi Unuttum:** Güvenli şifre sıfırlama talebi ve token tabanlı yeni şifre belirleme akışı.
- **Profil Güncelleme:** Dashboard üzerinden mevcut şifre doğrulandıktan sonra, eski/yeni maillere giden 6 haneli kodlarla güvenli şifre ve e-posta değişimi.
- **Özel Bildirimler:** Çirkin tarayıcı alert'leri yerine ekranda süzülen özel Toast bildirim sistemi.

## Teknoloji Yığını

- **Framework:** Nuxt 4 (Vue 3)
- **Veritabanı:** PostgreSQL (Drizzle ORM)
- **Güvenlik:** JSON Web Token (JWT), Bcrypt, Zod
- **Animasyon:** @vueuse/motion
- **Mail Servisi:** EmailThing API

## Kurulum

Projeyi kendi bilgisayarınızda çalıştırmak için şu adımları izleyebilirsiniz:

1. Bağımlılıkları yükleyin:
```bash
yarn install
```

2. Proje dizininde bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri kendinize göre doldurun:
```env
# Veritabanı bağlantınız (Örn: Supabase, Neon veya lokal Postgres)
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/nuxt_auth"

# Oturum şifrelemesi için rastgele bir metin
JWT_SECRET="buraya-rastgele-uzun-bir-sifre-yazin"

# Doğrulama mailleri için EmailThing bilgileri
EMAILTHING_TOKEN="et__sizin_tokeniniz"
EMAILTHING_FROM="no-reply@sizin-domaininiz.com"

# Uygulamanın çalıştığı adres (Maillerdeki tıklama linkleri için gerekli)
BASE_URL="http://localhost:3000"
```

3. Veritabanı tablolarını oluşturun (Drizzle otomatik halledecek):
```bash
yarn db:push
```

4. Geliştirme sunucusunu başlatın:
```bash
yarn dev
```