# Sistem Manajemen Tugas

Sebuah aplikasi web sederhana untuk mengelola tugas harian. Aplikasi ini dibuat untuk mendemonstrasikan praktik terbaik dalam pengembangan dan dokumentasi proyek perangkat lunak.

## Fitur Utama

- **Menambah Tugas:** Pengguna dapat menambahkan tugas baru melalui form input.
- **Melihat Tugas:** Semua tugas yang ditambahkan akan ditampilkan dalam sebuah daftar.
- **Menandai Selesai:** Pengguna dapat mengklik sebuah tugas untuk menandainya sebagai selesai (dicoret).
- **Menghapus Tugas:** Setiap tugas memiliki tombol untuk menghapusnya dari daftar.

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

1.  **Setup Lingkungan Server:** Pastikan Anda memiliki lingkungan server lokal seperti MAMP, XAMPP, atau sejenisnya yang mendukung PHP dan MySQL.

2.  **Database Setup:**
    - Buat database baru dengan nama `db_manajemen_tugas`.
    - Impor struktur tabel menggunakan skrip SQL berikut:
      ```sql
      CREATE TABLE tugas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          teks VARCHAR(255) NOT NULL,
          selesai BOOLEAN NOT NULL DEFAULT FALSE,
          tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ```

3.  **Konfigurasi Koneksi:**
    - Buka file `config.php`.
    - Sesuaikan detail koneksi (`DB_USER`, `DB_PASS`) jika berbeda dari pengaturan default MAMP (`root`, `root`).

4.  **Jalankan Aplikasi:**
    - Tempatkan folder proyek di dalam direktori `htdocs` server Anda.
    - Buka aplikasi melalui browser dengan alamat seperti `http://localhost/sistem-manajemen-tugas/`.

## Struktur Proyek

```
.sistem-manajemen-tugas/
├── index.html      # File utama HTML (Frontend)
├── style.css       # File styling CSS
├── script.js       # File logika JavaScript (Frontend)
├── config.php      # Konfigurasi koneksi database (Backend)
├── api.php         # API endpoint untuk CRUD (Backend)
├── README.md       # Dokumentasi utama proyek
├── CHANGELOG.md    # Catatan perubahan versi
└── .github/
    └── workflows/
        └── main.yml    # File workflow CI/CD
```

## Kontribusi

Saat ini, proyek ini hanya untuk tujuan demonstrasi dan tidak menerima kontribusi eksternal.
