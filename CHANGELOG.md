# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format yang digunakan didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.0.0] - 2025-07-08

### Added
- Fitur autentikasi pengguna menggunakan Google dan GitHub (OAuth2).
- Tabel `users` baru di database untuk menyimpan informasi pengguna.
- Halaman login dan proses callback (`login.php`, `callback.php`, `logout.php`).
- Endpoint untuk memeriksa status sesi login (`check_session.php`).
- Integrasi Composer untuk manajemen dependensi PHP (`league/oauth2-client`).

### Changed
- Arsitektur menjadi aplikasi multi-pengguna dengan data tugas terikat pada setiap pengguna.
- API (`api.php`) sekarang diamankan dan hanya bisa diakses oleh pengguna yang sudah login.
- Tabel `tugas` dimodifikasi dengan penambahan `user_id` sebagai foreign key.
- Tampilan utama (`index.html`) sekarang dinamis, menampilkan tombol login atau aplikasi tugas berdasarkan status sesi.

## [2.0.0] - 2025-07-08

### Changed
- Mengubah arsitektur dari aplikasi statis menjadi Client-Server.
- Mengganti penyimpanan `localStorage` dengan database MySQL untuk persistensi data.

### Added
- Backend API (`api.php`) menggunakan PHP untuk menangani operasi CRUD.
- File konfigurasi database (`config.php`).

### Removed
- Logika yang berhubungan dengan `localStorage` dari `script.js`.

## [1.0.0] - 2025-07-08

### Added
- Fitur menambah, melihat, menandai selesai, dan menghapus tugas.
- Penyimpanan data tugas menggunakan Local Storage browser.
- Dokumentasi awal proyek (`README.md`, `CHANGELOG.md`).
- Konfigurasi dasar untuk CI/CD menggunakan GitHub Actions.
