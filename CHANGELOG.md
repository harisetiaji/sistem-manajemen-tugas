# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format yang digunakan didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [6.0.0] - 2025-07-08

### Added
- Dukungan multi-proyek/workspace: Pengguna sekarang dapat membuat dan mengelola beberapa proyek yang berbeda.
- Grup kartu (kolom) dinamis: Kolom papan Kanban sekarang dibuat dan dikelola secara dinamis per proyek, menggantikan kolom status statis.
- Tabel database baru: `projects` dan `card_groups` diperkenalkan untuk mendukung fungsionalitas multi-proyek.
- Endpoint API untuk manajemen proyek dan grup kartu (membuat, mendapatkan).
- UI untuk pemilihan dan pembuatan proyek.
- Kemampuan untuk menambahkan assignee dan memilih warna kartu saat membuat kartu baru.
- Fungsionalitas untuk menambahkan grup kartu (daftar) baru secara dinamis.

### Changed
- Refactoring arsitektur utama seluruh aplikasi (database, API, frontend) untuk mendukung multi-proyek dan kolom dinamis.
- Tabel `tugas` dimodifikasi: kolom `status` dihapus, `group_id` ditambahkan sebagai foreign key ke `card_groups`.
- Tabel `tugas_history` dimodifikasi: `old_status` dan `new_status` diganti namanya menjadi `old_group` dan `new_group`.
- API (`api.php`) ditulis ulang sepenuhnya untuk menangani logika proyek dan grup baru.
- Frontend (`script.js`) ditulis ulang sepenuhnya untuk rendering papan dinamis dan manajemen proyek.
- Mengintegrasikan kembali tampilan warna kartu, tampilan label assignee, dan modal riwayat tugas.
- Mengimplementasikan kembali pengeditan in-place untuk teks tugas, warna kartu, dan label assignee.
- Estetika yang ditingkatkan untuk input assignee dan pemilih warna di form "Add a card".
- Memperbarui alur kerja GitHub Actions untuk menggunakan versi tindakan terbaru (`actions/checkout@v4`, `actions/configure-pages@v3`, `actions/upload-pages-artifact@v2`, `actions/deploy-pages@v2`) untuk mengatasi peringatan depresiasi.

## [5.0.0] - 2025-07-08

### Added
- Fitur pengeditan in-place untuk teks tugas, warna kartu, dan label penanggung jawab langsung di papan Kanban.
- Tombol pemilihan warna solid untuk pembuatan kartu baru.

### Changed
- Desain tombol aksi kartu (hapus dan ubah warna) diperbarui menjadi ikon yang lebih ringkas dan diposisikan ulang untuk estetika yang lebih baik.
- Alur penambahan tugas baru dioptimalkan untuk pengalaman pengguna yang lebih intuitif.
- Peningkatan visual pada latar belakang aplikasi dan tata letak kontainer.

## [4.0.0] - 2025-07-08

### Added
- Implementasi papan Kanban (Trello-like) dengan kolom 'Inisiasi', 'Progress', 'Done', dan 'Archived'.
- Kolom `status` baru ditambahkan ke tabel `tugas` di database.
- Fungsionalitas drag-and-drop untuk memindahkan tugas antar kolom Kanban.

### Changed
- Struktur `index.html` diperbarui untuk mendukung tata letak papan Kanban.
- `style.css` diperbarui dengan gaya untuk papan Kanban, kolom, dan kartu.
- `api.php` diperbarui untuk menangani kolom `status` baru dan pembaruan status tugas.
- `script.js` diperbarui untuk merender tugas sebagai kartu Kanban yang dapat di-drag-and-drop.
- Perbaikan pengalihan setelah login/logout dari `index.php` ke `index.html` di `login.php`, `callback.php`, dan `logout.php`.

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
