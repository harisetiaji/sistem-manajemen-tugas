document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const formTugas = document.getElementById('form-tugas');
    const inputTugas = document.getElementById('input-tugas');
    const inputAssignee = document.getElementById('input-assignee');
    const colorPickerButtons = document.getElementById('color-picker-buttons');

    let selectedColor = '#ffffff'; // Default color

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
            card.dataset.status = item.status;
            card.dataset.color = item.card_color; // Store color
            card.dataset.assignee = item.assignee_label; // Store assignee

            // Apply card color
            card.style.borderLeft = `5px solid ${item.card_color || '#ffffff'}`;

            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');

            const cardText = document.createElement('span');
            cardText.classList.add('card-text');
            cardText.textContent = item.teks;
            cardText.title = "Click to edit task"; // Add tooltip
            cardText.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card drag from starting
                makeEditable(cardText, item.id, 'teks', item.teks);
            });

            if (item.selesai == 1) {
                card.classList.add('selesai');
                cardText.classList.add('selesai');
            }

            cardContent.appendChild(cardText);

            const cardFooter = document.createElement('div');
            cardFooter.classList.add('card-footer');

            if (item.assignee_label) {
                const assigneeLabel = document.createElement('span');
                assigneeLabel.classList.add('assignee-label');
                assigneeLabel.textContent = item.assignee_label;
                assigneeLabel.title = "Click to edit assignee"; // Add tooltip
                assigneeLabel.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card drag from starting
                    makeEditable(assigneeLabel, item.id, 'assignee_label', item.assignee_label);
                });
                cardFooter.appendChild(assigneeLabel);
            }

            // Card actions container (for delete and color edit buttons)
            const cardActions = document.createElement('div');
            cardActions.classList.add('card-actions');

            // Color edit button (now an icon)
            const colorEditBtn = document.createElement('button');
            colorEditBtn.classList.add('color-edit-btn');
            colorEditBtn.innerHTML = '&#x25A0;'; // Unicode square for color swatch
            colorEditBtn.title = "Change card color";
            colorEditBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                makeColorEditable(card, item.id, item.card_color);
            });
            cardActions.appendChild(colorEditBtn);

            // Delete button (now an 'X' icon)
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-card-btn');
            deleteBtn.innerHTML = '&times;'; // Unicode 'X' character
            deleteBtn.title = "Delete task";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                hapusTugas(item.id);
            };
            cardActions.appendChild(deleteBtn);

            card.appendChild(cardActions); // Add actions to the card directly
            card.appendChild(cardContent);
            card.appendChild(cardFooter);

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

    async function makeEditable(element, taskId, field, currentValue) {
        // Prevent multiple edits or drag during edit
        if (element.querySelector('input.edit-input')) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.classList.add('edit-input');

        element.replaceWith(input);
        input.focus();

        const saveChanges = async () => {
            const newValue = input.value.trim();
            if (newValue !== currentValue) {
                const updateData = { id: taskId };
                updateData[field] = newValue;
                await updateTaskDetails(updateData);
                element.textContent = newValue;
            } else {
                element.textContent = currentValue;
            }
            input.replaceWith(element);
        };

        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger blur to save changes
            }
        });
    }

    async function makeColorEditable(cardElement, taskId, currentColor) {
        // Prevent multiple color edits
        if (cardElement.querySelector('.color-edit-palette')) return;

        const palette = document.createElement('div');
        palette.classList.add('color-edit-palette');

        const colors = [
            '#ffffff', '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc',
            '#ffccff', '#ccffff', '#ff99cc', '#99ff99', '#99ccff'
        ];

        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.classList.add('color-btn');
            btn.style.backgroundColor = color;
            btn.dataset.color = color;
            btn.title = color; // Tooltip for color
            if (color === currentColor) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newColor = e.target.dataset.color;
                await updateTaskDetails({ id: taskId, card_color: newColor });
                cardElement.style.borderLeft = `5px solid ${newColor}`;
                cardElement.dataset.color = newColor;
                // Update the color edit button's background as well
                cardElement.querySelector('.color-edit-btn').style.backgroundColor = newColor;
                palette.remove(); // Remove palette after selection
            });
            palette.appendChild(btn);
        });

        // Position the palette near the color edit button
        const colorEditBtn = cardElement.querySelector('.color-edit-btn');
        colorEditBtn.parentNode.insertBefore(palette, colorEditBtn.nextSibling);

        // Remove palette if clicked outside
        const removePalette = (e) => {
            if (!palette.contains(e.target) && e.target !== colorEditBtn) {
                palette.remove();
                document.removeEventListener('click', removePalette);
            }
        };
        document.addEventListener('click', removePalette);
    }

    async function tambahTugas(e) {
        e.preventDefault();
        const teksTugas = inputTugas.value.trim();
        const cardColor = selectedColor; // Use selectedColor
        const assigneeLabel = inputAssignee.value.trim();

        if (teksTugas !== '') {
            try {
                const response = await fetch(api, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teks: teksTugas, card_color: cardColor, assignee_label: assigneeLabel || null })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    inputTugas.value = '';
                    inputAssignee.value = ''; // Reset assignee
                    // Reset color selection to default
                    document.querySelector('.color-btn.active').classList.remove('active');
                    document.querySelector('.color-btn[data-color="#ffffff"]').classList.add('active');
                    selectedColor = '#ffffff';
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

    async function updateTaskDetails(data) {
        try {
            const response = await fetch(`${api}?action=update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                console.log(`Task ${data.id} updated.`);
            } else {
                alert('Error updating task details: ' + result.message);
            }
        } catch (error) {
            alert('Gagal memperbarui detail tugas.');
            console.error('Error updating task details:', error);
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
            if (draggable && afterElement == null) {
                kanbanCardsContainer.appendChild(draggable);
            } else if (draggable) {
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
                        // We don't need to call updateTaskStatus again for 'selesai' here
                        // as the main status update handles it implicitly if needed.
                    } else if (oldStatus === 'done') {
                        draggedCard.classList.remove('selesai');
                        draggedCard.querySelector('.card-text').classList.remove('selesai');
                        // Same as above, no extra call needed.
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

    // Event listener for color buttons
    colorPickerButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-btn')) {
            // Remove active class from previously selected button
            const currentActive = colorPickerButtons.querySelector('.color-btn.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            // Add active class to clicked button
            e.target.classList.add('active');
            selectedColor = e.target.dataset.color;
        }
    });

    formTugas.addEventListener('submit', tambahTugas);

    // Panggil fungsi untuk memeriksa status login saat halaman dimuat
    checkLoginStatus();
});
