document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const formTugas = document.getElementById('form-tugas');
    const inputTugas = document.getElementById('input-tugas');
    const daftarTugas = document.getElementById('daftar-tugas');

    const api = 'api.php';

    /**
     * Memeriksa status login ke server.
     */
    async function checkLoginStatus() {
        try {
            const response = await fetch('check_session.php'); // Kita perlu membuat file ini
            const session = await response.json();

            if (session.loggedIn) {
                displayApp(session.nama);
                muatTugas();
            } else {
                displayLoginButtons();
            }
        } catch (error) {
            displayLoginButtons();
        }
    }

    function displayLoginButtons() {
        appContainer.classList.add('hidden');
        authContainer.innerHTML = `
            <p>Silakan login untuk melanjutkan</p>
            <button onclick="location.href='login.php?provider=google'" class="login-btn google-btn">Login dengan Google</button>
            <button onclick="location.href='login.php?provider=github'" class="login-btn github-btn">Login dengan GitHub</button>
        `;
    }

    function displayApp(nama) {
        appContainer.classList.remove('hidden');
        authContainer.innerHTML = `
            <div id="user-info">
                <span>Selamat datang, <strong>${nama}</strong>!</span>
                <a href="logout.php">Logout</a>
            </div>
        `;
    }

    // ... (Fungsi muatTugas, tambahTugas, hapusTugas, toggleSelesai tetap sama seperti sebelumnya)
    async function muatTugas() {
        try {
            const response = await fetch(api);
            const result = await response.json();
            if (result.status === 'success') {
                renderTugas(result.data);
            } else {
                // Jika API mengembalikan error (misal: sesi habis), tampilkan login
                displayLoginButtons();
            }
        } catch (error) {
            console.error('Tidak dapat terhubung ke server.');
        }
    }

    function renderTugas(tugas) {
        daftarTugas.innerHTML = '';
        tugas.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.teks;
            li.dataset.id = item.id;

            if (item.selesai == 1) {
                li.classList.add('selesai');
            }

            const hapusBtn = document.createElement('button');
            hapusBtn.textContent = 'Hapus';
            hapusBtn.classList.add('hapus-btn');
            hapusBtn.onclick = (e) => {
                e.stopPropagation();
                hapusTugas(item.id);
            };

            li.appendChild(hapusBtn);
            li.onclick = () => toggleSelesai(item.id, item.selesai != 1);
            daftarTugas.appendChild(li);
        });
    }

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
                    muatTugas();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Gagal menyimpan tugas.');
            }
        }
    }

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

    // Panggil fungsi untuk memeriksa status login saat halaman dimuat
    checkLoginStatus();
});
