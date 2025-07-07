# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format yang digunakan didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
