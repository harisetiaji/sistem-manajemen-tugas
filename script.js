document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const projectDropdown = document.getElementById('project-dropdown');
    const newProjectBtn = document.getElementById('new-project-btn');
    const kanbanBoard = document.getElementById('kanban-board');
    const newProjectModal = document.getElementById('new-project-modal');
    const newProjectForm = document.getElementById('new-project-form');
    const closeProjectModalBtn = document.getElementById('close-project-modal');
    const newProjectNameInput = document.getElementById('new-project-name');

    // === STATE ===
    let projects = [];
    let currentProjectId = null;
    let draggedCard = null;

    const api = 'api.php';

    // === API HELPERS ===
    async function apiCall(action, method = 'GET', body = null, params = '') {
        const url = `${api}?action=${action}${params}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API call failed for action [${action}]:`, error);
            alert(`Error: ${error.message}`);
            return null;
        }
    }

    // === INITIALIZATION ===
    async function checkLoginStatus() {
        try {
            const response = await fetch('check_session.php');
            const session = await response.json();
            if (session.loggedIn) {
                displayApp(session.nama);
                await loadProjects();
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
            <p>Please log in to continue</p>
            <button onclick="location.href='login.php?provider=google'">Login with Google</button>
            <button onclick="location.href='login.php?provider=github'">Login with GitHub</button>
        `;
    }

    function displayApp(userName) {
        appContainer.classList.remove('hidden');
        authContainer.innerHTML = `
            <div id="user-info">
                <span>Welcome, <strong>${userName}</strong>!</span>
                <a href="logout.php">Logout</a>
            </div>
        `;
    }

    // === PROJECT MANAGEMENT ===
    async function loadProjects() {
        const result = await apiCall('get_projects');
        if (result && result.status === 'success') {
            projects = result.data;
            renderProjectDropdown();
            if (projects.length > 0) {
                currentProjectId = projects[0].id;
                projectDropdown.value = currentProjectId;
                await loadBoard(currentProjectId);
            } else {
                // Handle case with no projects yet
                kanbanBoard.innerHTML = '<p>No projects found. Create one to get started!</p>';
            }
        }
    }

    function renderProjectDropdown() {
        projectDropdown.innerHTML = '';
        projects.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.project_name;
            projectDropdown.appendChild(option);
        });
    }

    async function createNewProject(e) {
        e.preventDefault();
        const projectName = newProjectNameInput.value.trim();
        if (!projectName) return;

        const result = await apiCall('create_project', 'POST', { project_name: projectName });
        if (result && result.status === 'success') {
            newProjectNameInput.value = '';
            toggleProjectModal(false);
            await loadProjects(); // Reload all projects
            // Switch to the new project
            currentProjectId = result.data.id;
            projectDropdown.value = currentProjectId;
            await loadBoard(currentProjectId);
        }
    }

    function toggleProjectModal(show) {
        newProjectModal.style.display = show ? 'flex' : 'none';
    }

    // === BOARD & CARD RENDERING ===
    async function loadBoard(projectId) {
        currentProjectId = projectId;
        const result = await apiCall('get_board_data', 'GET', null, `&project_id=${projectId}`);
        if (result && result.status === 'success') {
            renderBoard(result.data.groups, result.data.tasks);
        }
    }

    function renderBoard(groups, tasksByGroup) {
        kanbanBoard.innerHTML = ''; // Clear the board

        groups.forEach(group => {
            const column = createKanbanColumn(group);
            const cardsContainer = column.querySelector('.kanban-cards');
            
            const tasks = tasksByGroup[group.id] || [];
            tasks.forEach(taskData => {
                const card = createKanbanCard(taskData);
                cardsContainer.appendChild(card);
            });

            kanbanBoard.appendChild(column);
        });

        // Add "Add New Group" button
        const addGroupBtn = document.createElement('button');
        addGroupBtn.textContent = '+ Add another list';
        addGroupBtn.classList.add('add-group-btn');
        kanbanBoard.appendChild(addGroupBtn);

        // Event listener for adding new group
        addGroupBtn.addEventListener('click', () => {
            const formContainer = document.createElement('div');
            formContainer.className = 'add-group-form-container';
            formContainer.innerHTML = `
                <input type="text" placeholder="Enter list title..." class="add-group-input">
                <div class="form-actions">
                    <button type="submit" class="add-group-submit-btn">Add list</button>
                    <button type="button" class="cancel-btn">&times;</button>
                </div>
            `;
            kanbanBoard.appendChild(formContainer);
            addGroupBtn.style.display = 'none';

            const groupInput = formContainer.querySelector('.add-group-input');
            groupInput.focus();

            formContainer.querySelector('.add-group-submit-btn').addEventListener('click', async () => {
                const groupName = groupInput.value.trim();
                if (groupName && currentProjectId) {
                    await apiCall('create_card_group', 'POST', { project_id: currentProjectId, group_name: groupName });
                    await loadBoard(currentProjectId); // Reload board to show new group
                }
            });

            formContainer.querySelector('.cancel-btn').addEventListener('click', () => {
                formContainer.remove();
                addGroupBtn.style.display = 'block';
            });
        });
    }

    function createKanbanColumn(group) {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.groupId = group.id;
        column.innerHTML = `
            <h2>${group.group_name}</h2>
            <div class="kanban-cards"></div>
            <div class="add-card-form-container"></div>
            <button class="add-card-btn">+ Add a card</button>
        `;

        // Event listener for showing the add card form
        const addCardBtn = column.querySelector('.add-card-btn');
        const formContainer = column.querySelector('.add-card-form-container');
        addCardBtn.addEventListener('click', () => {
            showAddCardForm(formContainer, group.id);
            addCardBtn.style.display = 'none';
        });

        // Drag and drop listeners
        column.addEventListener('dragover', e => e.preventDefault());
        column.addEventListener('drop', handleCardDrop);

        return column;
    }

    function createKanbanCard(taskData) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.taskId = taskData.id;
        card.dataset.groupId = taskData.group_id;

        // Apply card color
        card.style.borderLeft = `5px solid ${taskData.card_color || '#ffffff'}`;

        const cardText = document.createElement('span');
        cardText.textContent = taskData.teks;

        card.appendChild(cardText);

        // Add assignee label or a button to add one
        const assigneeContainer = document.createElement('div');
        assigneeContainer.className = 'assignee-container';
        card.appendChild(assigneeContainer);

        const renderAssignee = (assigneeName) => {
            assigneeContainer.innerHTML = ''; // Clear previous content
            if (assigneeName) {
                const assigneeLabel = document.createElement('div');
                assigneeLabel.className = 'assignee-label';
                assigneeLabel.textContent = assigneeName;
                assigneeLabel.title = 'Click to edit assignee';
                assigneeLabel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    makeEditable(assigneeLabel, taskData.id, 'assignee_label', assigneeName, (newLabel) => renderAssignee(newLabel));
                });
                assigneeContainer.appendChild(assigneeLabel);
            } else {
                const addAssigneeBtn = document.createElement('button');
                addAssigneeBtn.className = 'add-assignee-btn';
                addAssigneeBtn.textContent = '+ Add Assignee';
                addAssigneeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newAssigneeLabel = document.createElement('div');
                    newAssigneeLabel.className = 'assignee-label';
                    addAssigneeBtn.replaceWith(newAssigneeLabel);
                    makeEditable(newAssigneeLabel, taskData.id, 'assignee_label', '', (newLabel) => renderAssignee(newLabel));
                });
                assigneeContainer.appendChild(addAssigneeBtn);
            }
        };

        renderAssignee(taskData.assignee_label);

        // Drag listeners for the card
        card.addEventListener('dragstart', e => {
            draggedCard = e.target;
            e.dataTransfer.setData('text/plain', taskData.id);
            setTimeout(() => card.classList.add('dragging'), 0);
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));

        // Click listener for history
        card.addEventListener('click', (e) => {
            // Ensure the click is not on an interactive element
            if (e.target.matches('button') || e.target.matches('input') || e.target.closest('.card-actions')) {
                return;
            }
            showTaskHistory(taskData.id, taskData.teks);
        });

        // Action buttons
        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '&#9998;'; // Pencil icon
        editBtn.title = 'Edit task text';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            makeEditable(card.querySelector('span'), taskData.id, 'teks', taskData.teks);
        });

        const colorBtn = document.createElement('button');
        colorBtn.innerHTML = '&#127912;'; // Palette icon
        colorBtn.title = 'Change color';
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            makeColorEditable(card, taskData.id, taskData.card_color);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this task?')) {
                await apiCall('delete_task', 'GET', null, `&task_id=${taskData.id}`);
                await loadBoard(currentProjectId);
            }
        });

        cardActions.appendChild(editBtn);
        cardActions.appendChild(colorBtn);
        cardActions.appendChild(deleteBtn);
        card.appendChild(cardActions);

        return card;
    }

    // === CARD ACTIONS (Add, Move) ===
    function showAddCardForm(container, groupId) {
        let selectedColor = '#ffffff'; // Default color for the new card
        const form = document.createElement('form');
        form.className = 'add-card-form';

        const colors = ['#ffffff', '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];
        let colorPickerHtml = '<div class="add-card-color-picker">';
        colors.forEach(color => {
            colorPickerHtml += `<button type="button" class="color-btn ${color === selectedColor ? 'active' : ''}" data-color="${color}" style="background-color: ${color};"></button>`;
        });
        colorPickerHtml += '</div>';

        form.innerHTML = `
            <textarea placeholder="Enter a title for this card..." required></textarea>
            <input type="text" class="add-card-assignee-input" placeholder="Assignee (optional)">
            ${colorPickerHtml}
            <div class="form-actions">
                <button type="submit">Add card</button>
                <button type="button" class="cancel-btn">&times;</button>
            </div>
        `;
        container.appendChild(form);

        const textarea = form.querySelector('textarea');
        const assigneeInput = form.querySelector('.add-card-assignee-input');
        textarea.focus();

        const colorPicker = form.querySelector('.add-card-color-picker');
        colorPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-btn')) {
                const currentActive = colorPicker.querySelector('.active');
                if (currentActive) currentActive.classList.remove('active');
                e.target.classList.add('active');
                selectedColor = e.target.dataset.color;
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const teks = textarea.value.trim();
            const assigneeLabel = assigneeInput.value.trim();
            if (teks) {
                await apiCall('create_task', 'POST', { teks, group_id: groupId, card_color: selectedColor, assignee_label: assigneeLabel || null });
                await loadBoard(currentProjectId);
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', () => {
            container.innerHTML = '';
            container.closest('.kanban-column').querySelector('.add-card-btn').style.display = 'block';
        });
    }

    async function handleCardDrop(e) {
        e.preventDefault();
        if (!draggedCard) return;

        const toColumn = e.target.closest('.kanban-column');
        if (!toColumn) return;

        const taskId = draggedCard.dataset.taskId;
        const oldGroupId = draggedCard.dataset.groupId;
        const newGroupId = toColumn.dataset.groupId;

        if (oldGroupId !== newGroupId) {
            // Move card in UI immediately for responsiveness
            toColumn.querySelector('.kanban-cards').appendChild(draggedCard);
            draggedCard.dataset.groupId = newGroupId;

            // Call API to update backend
            await apiCall('move_task', 'POST', { task_id: taskId, old_group_id: oldGroupId, new_group_id: newGroupId });
            // No full reload needed, but could re-validate if necessary
        }
    }

    // === EVENT LISTENERS ===
    projectDropdown.addEventListener('change', () => {
        const newId = projectDropdown.value;
        if (newId !== currentProjectId) {
            loadBoard(newId);
        }
    });

    newProjectBtn.addEventListener('click', () => toggleProjectModal(true));
    closeProjectModalBtn.addEventListener('click', () => toggleProjectModal(false));
    newProjectForm.addEventListener('submit', createNewProject);
    window.addEventListener('click', (e) => {
        if (e.target === newProjectModal) {
            toggleProjectModal(false);
        }
        if (e.target === document.getElementById('task-history-modal')) {
            toggleHistoryModal(false);
        }
    });

    document.getElementById('close-history-modal').addEventListener('click', () => toggleHistoryModal(false));

    // === HISTORY MODAL ===
    const historyModal = document.getElementById('task-history-modal');
    const historyContent = document.getElementById('history-content');

    function toggleHistoryModal(show) {
        historyModal.style.display = show ? 'flex' : 'none';
    }

    async function showTaskHistory(taskId, taskText) {
        const result = await apiCall('get_task_history', 'GET', null, `&task_id=${taskId}`);
        if (result && result.status === 'success') {
            let html = `<h4>History for: ${taskText}</h4><ul>`;
            if (result.data.length === 0) {
                html += '<li>No history found.</li>';
            } else {
                result.data.forEach(entry => {
                    const date = new Date(entry.timestamp).toLocaleString();
                    html += `<li>${date}: <strong>${entry.nama}</strong> moved from <strong>${entry.old_group}</strong> to <strong>${entry.new_group}</strong></li>`;
                });
            }
            html += '</ul>';
            historyContent.innerHTML = html;
            toggleHistoryModal(true);
        }
    }

    // === STARTUP ===
    checkLoginStatus();

    // === EDITABLE FUNCTIONS ===
    function makeEditable(element, taskId, field, currentValue, onSaveCallback) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.className = 'edit-input';

        element.replaceWith(input);
        input.focus();

        const saveChanges = async () => {
            const newValue = input.value.trim();
            if (newValue && newValue !== currentValue) {
                await apiCall('update_task', 'POST', { id: taskId, [field]: newValue });
                if (onSaveCallback) {
                    onSaveCallback(newValue);
                } else {
                    element.textContent = newValue;
                    input.replaceWith(element);
                }
            } else {
                if (onSaveCallback) {
                    onSaveCallback(currentValue);
                } else {
                    element.textContent = currentValue;
                    input.replaceWith(element);
                }
            }
        };

        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = currentValue;
                input.blur();
            }
        });
    }

    function makeColorEditable(cardElement, taskId, currentColor) {
        if (document.querySelector('.color-edit-palette')) return; // Prevent multiple palettes

        const palette = document.createElement('div');
        palette.className = 'color-edit-palette';
        const colors = ['#ffffff', '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];

        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.style.backgroundColor = color;
            btn.dataset.color = color;
            if (color === currentColor) btn.classList.add('active');
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newColor = e.target.dataset.color;
                await apiCall('update_task', 'POST', { id: taskId, card_color: newColor });
                cardElement.style.borderLeft = `5px solid ${newColor}`;
                palette.remove();
            });
            palette.appendChild(btn);
        });

        cardElement.appendChild(palette);

        const removePalette = (e) => {
            if (!palette.contains(e.target)) {
                palette.remove();
                document.removeEventListener('click', removePalette, true);
            }
        };
        setTimeout(() => document.addEventListener('click', removePalette, true), 100);
    }
});
