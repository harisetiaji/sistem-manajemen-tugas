# Sistem Manajemen Tugas

Sebuah aplikasi web sederhana untuk mengelola tugas harian. Aplikasi ini dibuat untuk mendemonstrasikan praktik terbaik dalam pengembangan dan dokumentasi proyek perangkat lunak.

## Fitur Utama

- **Autentikasi Pengguna:** Login dan registrasi *seamless* menggunakan akun Google dan GitHub (OAuth2).
- **Manajemen Tugas Pribadi:** Setiap pengguna hanya dapat melihat dan mengelola tugas miliknya sendiri.
- **Operasi CRUD:** Menambah, melihat, menandai selesai, dan menghapus tugas secara dinamis tanpa me-refresh halaman.

## Teknologi yang Digunakan

- **Frontend:**
  - **HTML5:** Untuk struktur konten halaman web.
  - **CSS3:** Untuk styling dan tata letak.
  - **JavaScript (ES6):** Untuk fungsionalitas interaktif dan komunikasi dengan backend (via Fetch API).
- **Backend:**
  - **PHP:** Sebagai bahasa pemrograman di sisi server.
  - **MySQL:** Sebagai sistem manajemen database untuk menyimpan data tugas secara permanen.
- **Arsitektur:** Aplikasi ini sekarang menggunakan arsitektur Client-Server. Frontend (HTML/CSS/JS) berjalan di browser, sementara Backend (PHP) berjalan di server (MAMP) untuk mengelola data di database MySQL.

## Instalasi & Penggunaan

Proyek ini memerlukan lingkungan server PHP, Composer, dan kredensial OAuth dari Google/GitHub.

### 1. Prasyarat
- Lingkungan server lokal (MAMP, XAMPP, dll.) dengan PHP >= 7.4.
- [Composer](https://getcomposer.org/) terinstal secara global.
- Akun Google dan GitHub untuk membuat kredensial API.

### 2. Setup Proyek
1.  **Clone Repositori:**
    ```bash
    git clone https://github.com/harisetiaji/sistem-manajemen-tugas.git
    cd sistem-manajemen-tugas
    ```

2.  **Instal Dependensi PHP:**
    ```bash
    composer install
    ```

### 3. Setup Database
1.  Buat database baru di MySQL dengan nama `db_manajemen_tugas`.
2.  Jalankan skrip SQL berikut untuk membuat tabel `users` dan `tugas`:
    ```sql
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      oauth_provider VARCHAR(50) NOT NULL,
      oauth_uid VARCHAR(255) NOT NULL,
      nama VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY (oauth_provider, oauth_uid)
    );

    CREATE TABLE tugas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      teks VARCHAR(255) NOT NULL,
      selesai BOOLEAN NOT NULL DEFAULT FALSE,
      tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ```

### 4. Konfigurasi Kredensial & Database
1.  **Buat Aplikasi OAuth** di [Google Cloud Console](https://console.cloud.google.com/apis/credentials) dan [GitHub Developer Settings](https://github.com/settings/developers).
2.  Saat membuat, gunakan URL callback berikut: `http://localhost/sistem-manajemen-tugas/callback.php`.
3.  **Buat file `.env`:** Salin file `.env.example` menjadi `.env` di root proyek Anda.
    ```bash
    cp .env.example .env
    ```
4.  **Isi `.env`:** Buka file `.env` dan masukkan `Client ID` dan `Client Secret` yang Anda dapatkan dari Google dan GitHub. Sesuaikan juga kredensial database jika berbeda dari default MAMP (`root`, `root`).

    ```
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
    GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
    DB_HOST=localhost
    DB_NAME=db_manajemen_tugas
    DB_USER=root
    DB_PASS=root
    ```

### 5. Jalankan Aplikasi
- Tempatkan folder proyek di dalam direktori `htdocs` server Anda.
- Buka aplikasi melalui browser: `http://localhost/sistem-manajemen-tugas/`.

## Struktur Proyek

```
.sistem-manajemen-tugas/
├── index.html              # Halaman utama (Frontend)
├── style.css               # Styling CSS
├── script.js               # Logika JavaScript (Frontend)
├── config.php              # Konfigurasi utama (DB, OAuth, Session)
├── api.php                 # API endpoint untuk data tugas (CRUD)
├── login.php               # Mengarahkan ke provider OAuth
├── callback.php            # Menangani respons dari provider OAuth
├── logout.php              # Menghancurkan sesi login
├── check_session.php       # Endpoint untuk memeriksa status login
├── composer.json           # Mendefinisikan dependensi PHP
├── vendor/                 # Direktori dependensi dari Composer
├── README.md               # Dokumentasi utama proyek
├── CHANGELOG.md            # Catatan perubahan versi
└── .github/
    └── workflows/
        └── main.yml        # File workflow CI/CD
```

## Kontribusi

Saat ini, proyek ini hanya untuk tujuan demonstrasi dan tidak menerima kontribusi eksternal.
