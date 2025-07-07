document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const formTugas = document.getElementById('form-tugas');
    const inputTugas = document.getElementById('input-tugas');

    const api = 'api.php';

    // Get Kanban column containers
    const columns = {
        inisiasi: document.getElementById('column-inisiasi').querySelector('.kanban-cards'),
        progress: document.getElementById('column-progress').querySelector('.kanban-cards'),
        done: document.getElementById('column-done').querySelector('.kanban-cards'),
        archived: document.getElementById('column-archived').querySelector('.kanban-cards'),
    };

    let draggedCard = null;

    /**
     * Memeriksa status login ke server.
     */
    async function checkLoginStatus() {
        try {
            const response = await fetch('http://localhost:8888/sistem-manajemen-tugas/check_session.php');
            const session = await response.json();
            console.log('Session status:', session);

            if (session.loggedIn) {
                displayApp(session.nama);
                muatTugas();
            } else {
                displayLoginButtons();
            }
        } catch (error) {
            console.error('Error checking login status:', error);
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

    async function muatTugas() {
        try {
            const response = await fetch(api);
            const result = await response.json();
            if (result.status === 'success') {
                renderTugas(result.data);
            } else {
                console.error('Error loading tasks:', result.message);
                displayLoginButtons();
            }
        } catch (error) {
            console.error('Tidak dapat terhubung ke server.', error);
        }
    }

    function renderTugas(tugas) {
        // Clear all columns first
        Object.values(columns).forEach(col => (col.innerHTML = ''));

        tugas.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('kanban-card');
            card.setAttribute('draggable', 'true');
            card.dataset.id = item.id;
            card.dataset.status = item.status; // Store current status

            const cardText = document.createElement('span');
            cardText.classList.add('card-text');
            cardText.textContent = item.teks;

            if (item.selesai == 1) {
                card.classList.add('selesai');
                cardText.classList.add('selesai');
            }

            const hapusBtn = document.createElement('button');
            hapusBtn.textContent = 'Hapus';
            hapusBtn.classList.add('hapus-btn');
            hapusBtn.onclick = (e) => {
                e.stopPropagation();
                hapusTugas(item.id);
            };

            card.appendChild(cardText);
            card.appendChild(hapusBtn);

            // Add drag event listeners
            card.addEventListener('dragstart', () => {
                draggedCard = card;
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                draggedCard = null;
                card.classList.remove('dragging');
            });

            // Append card to the correct column
            if (columns[item.status]) {
                columns[item.status].appendChild(card);
            } else {
                console.warn(`Unknown status for task ${item.id}: ${item.status}`);
                columns.inisiasi.appendChild(card); // Default to inisiasi
            }
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
                    muatTugas(); // Reload all tasks to update the board
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Gagal menyimpan tugas.');
                console.error('Error adding task:', error);
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
            console.error('Error deleting task:', error);
        }
    }

    async function updateTaskStatus(id, newStatus) {
        try {
            const response = await fetch(`${api}?action=update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus })
            });
            const result = await response.json();
            if (result.status === 'success') {
                console.log(`Task ${id} moved to ${newStatus}`);
                // No need to reload all tasks, just update the UI if needed
            } else {
                alert('Error updating task status: ' + result.message);
            }
        } catch (error) {
            alert('Gagal memperbarui status tugas.');
            console.error('Error updating task status:', error);
        }
    }

    // Drag and Drop Event Listeners for Columns
    document.querySelectorAll('.kanban-column').forEach(column => {
        const kanbanCardsContainer = column.querySelector('.kanban-cards');
        const newStatus = column.dataset.status;

        kanbanCardsContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            const afterElement = getDragAfterElement(kanbanCardsContainer, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                kanbanCardsContainer.appendChild(draggable);
            } else {
                kanbanCardsContainer.insertBefore(draggable, afterElement);
            }
        });

        kanbanCardsContainer.addEventListener('drop', () => {
            if (draggedCard) {
                const taskId = draggedCard.dataset.id;
                const oldStatus = draggedCard.dataset.status;

                if (oldStatus !== newStatus) {
                    updateTaskStatus(taskId, newStatus);
                    draggedCard.dataset.status = newStatus; // Update card's dataset
                    // Optionally, update the 'selesai' status if moving to/from 'done'
                    if (newStatus === 'done') {
                        draggedCard.classList.add('selesai');
                        draggedCard.querySelector('.card-text').classList.add('selesai');
                        updateTaskStatus(taskId, newStatus, true); // Mark as complete
                    } else if (oldStatus === 'done') {
                        draggedCard.classList.remove('selesai');
                        draggedCard.querySelector('.card-text').classList.remove('selesai');
                        updateTaskStatus(taskId, newStatus, false); // Mark as incomplete
                    }
                }
            }
        });
    });

    // Helper function for drag and drop to get element to insert after
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    formTugas.addEventListener('submit', tambahTugas);

    // Panggil fungsi untuk memeriksa status login saat halaman dimuat
    checkLoginStatus();
});