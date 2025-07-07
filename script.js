document.addEventListener('DOMContentLoaded', () => {
    const formTugas = document.getElementById('form-tugas');
    const inputTugas = document.getElementById('input-tugas');
    const daftarTugas = document.getElementById('daftar-tugas');

    const api = 'api.php';

    /**
     * Merender daftar tugas ke dalam DOM dari data server.
     * @param {Array} tugas - Array objek tugas dari database.
     */
    function renderTugas(tugas) {
        daftarTugas.innerHTML = '';
        tugas.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.teks;
            li.dataset.id = item.id;

            if (item.selesai == 1) { // MySQL boolean bisa jadi 1 atau 0
                li.classList.add('selesai');
            }

            // Tombol hapus
            const hapusBtn = document.createElement('button');
            hapusBtn.textContent = 'Hapus';
            hapusBtn.classList.add('hapus-btn');
            hapusBtn.onclick = (e) => {
                e.stopPropagation(); // Mencegah event klik pada <li>
                hapusTugas(item.id);
            };

            li.appendChild(hapusBtn);
            li.onclick = () => toggleSelesai(item.id, item.selesai != 1);
            daftarTugas.appendChild(li);
        });
    }

    /**
     * Mengambil semua tugas dari server.
     */
    async function muatTugas() {
        try {
            const response = await fetch(api);
            const result = await response.json();
            if (result.status === 'success') {
                renderTugas(result.data);
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Tidak dapat terhubung ke server.');
        }
    }

    /**
     * Menambah tugas baru ke database.
     * @param {Event} e - Event dari form submission.
     */
    async function tambahTugas(e) {
        e.preventDefault();
        const teksTugas = inputTugas.value.trim();
        if (teksTugas !== '') {
            try {
                const response = await fetch(api, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teks: teksTugas })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    inputTugas.value = '';
                    muatTugas(); // Muat ulang semua tugas
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Gagal menyimpan tugas.');
            }
        }
    }

    /**
     * Menghapus tugas dari database.
     * @param {number} id - ID tugas yang akan dihapus.
     */
    async function hapusTugas(id) {
        try {
            const response = await fetch(`${api}?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.status === 'success') {
                muatTugas();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Gagal menghapus tugas.');
        }
    }

    /**
     * Mengubah status selesai/belum selesai sebuah tugas.
     * @param {number} id - ID tugas yang akan diubah.
     * @param {boolean} status - Status baru (true untuk selesai, false untuk belum).
     */
    async function toggleSelesai(id, status) {
        try {
            const response = await fetch(`${api}?action=update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, selesai: status })
            });
            const result = await response.json();
            if (result.status === 'success') {
                muatTugas();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Gagal memperbarui status tugas.');
        }
    }

    formTugas.addEventListener('submit', tambahTugas);

    // Muat tugas saat halaman pertama kali dibuka
    muatTugas();
});