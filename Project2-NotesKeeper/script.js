// Check authentication
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user.username;
    document.getElementById('usernameDisplay').textContent = currentUser;
    
    // Clean old trash and fetch notes
    await dbOps.cleanOldTrash();
    await refreshNotes();
});

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

const noteForm = document.getElementById('noteForm');
const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
const modalTitle = document.getElementById('modalTitle');
const deleteBtn = document.getElementById('deleteBtn');
const fileInput = document.getElementById('fileInput');
const attachmentPreview = document.getElementById('attachmentPreview');

let allNotes = [];
let allTrashNotes = [];
let currentTab = 'active';
let currentAttachments = [];

async function refreshNotes() {
    // Filter by currentUser
    allNotes = await dbOps.getUserNotes(currentUser);
    allNotes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    document.getElementById('noteCount').textContent = allNotes.length;
    
    if (currentTab === 'active') {
        applyCurrentSearch();
    }
}

// File Processing
fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
            alert(`File ${file.name} is too large (max 20MB)`);
            continue;
        }

        const base64 = await toBase64(file);
        currentAttachments.push({
            name: file.name,
            type: file.type,
            data: base64
        });
    }
    renderAttachmentPreview();
});

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function renderAttachmentPreview() {
    attachmentPreview.innerHTML = '';
    currentAttachments.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'position-relative border rounded p-1 bg-light';
        div.style.width = '80px';
        div.style.height = '80px';

        if (file.type.startsWith('image/')) {
            div.innerHTML = `<img src="${file.data}" class="w-100 h-100 object-fit-cover rounded">`;
        } else {
            div.innerHTML = `<div class="w-100 h-100 d-flex align-items-center justify-content-center text-primary"><i class="bi bi-file-earmark-text fs-2"></i></div>`;
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle';
        removeBtn.style.width = '20px';
        removeBtn.style.height = '20px';
        removeBtn.style.marginTop = '-5px';
        removeBtn.style.marginRight = '-5px';
        removeBtn.innerHTML = '<i class="bi bi-x fs-6"></i>';
        removeBtn.onclick = (e) => {
            e.preventDefault();
            currentAttachments.splice(index, 1);
            renderAttachmentPreview();
        };

        div.appendChild(removeBtn);
        attachmentPreview.appendChild(div);
    });
}

noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitleInput').value;
    const content = document.getElementById('noteContentInput').value;
    const now = new Date();
    const timestamp = now.getTime();
    
    const formattedDate = now.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const noteData = { 
        username: currentUser, // Associate with current user
        title, 
        content, 
        date: formattedDate, 
        timestamp,
        attachments: currentAttachments 
    };

    if (id) {
        noteData.id = parseInt(id);
        await dbOps.updateNote(noteData);
    } else {
        await dbOps.addNote(noteData);
    }

    await refreshNotes();
    noteModal.hide();
    noteForm.reset();
    currentAttachments = [];
    attachmentPreview.innerHTML = '';
});

function displayNotes(notesToDisplay) {
    const notesGrid = document.getElementById('notesGrid');
    notesGrid.innerHTML = '';

    if (notesToDisplay.length === 0) {
        notesGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-journal-text fs-1 text-muted opacity-25"></i>
                <h4 class="fw-bold text-muted mt-3">No active notes found</h4>
            </div>
        `;
        return;
    }

    notesToDisplay.forEach(note => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        let attachmentBadge = '';
        if (note.attachments && note.attachments.length > 0) {
            const imgCount = note.attachments.filter(a => a.type.startsWith('image/')).length;
            const fileCount = note.attachments.length - imgCount;
            attachmentBadge = `<div class="mt-2">
                ${imgCount > 0 ? `<span class="badge bg-light text-primary border me-1"><i class="bi bi-image me-1"></i>${imgCount}</span>` : ''}
                ${fileCount > 0 ? `<span class="badge bg-light text-primary border"><i class="bi bi-file-earmark me-1"></i>${fileCount}</span>` : ''}
            </div>`;
        }

        col.innerHTML = `
            <div class="card note-card" onclick="openEditModal(${note.id})">
                <h5 class="note-title">${note.title}</h5>
                <p class="note-content">${note.content}</p>
                ${attachmentBadge}
                <div class="note-footer mt-auto">
                    <span class="note-date text-uppercase tracking-tighter" style="font-size: 0.7rem;">${note.date}</span>
                    <i class="bi bi-pencil-square text-primary"></i>
                </div>
            </div>
        `;
        notesGrid.appendChild(col);
    });
}

async function openEditModal(id) {
    const notes = await dbOps.getUserNotes(currentUser);
    const note = notes.find(n => n.id === id);
    if (!note) return;

    modalTitle.textContent = 'Edit Entry';
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitleInput').value = note.title;
    document.getElementById('noteContentInput').value = note.content;
    currentAttachments = note.attachments || [];
    renderAttachmentPreview();
    
    deleteBtn.classList.remove('d-none');
    noteModal.show();
}

document.getElementById('noteModal').addEventListener('show.bs.modal', (e) => {
    if (e.relatedTarget) {
        modalTitle.textContent = 'New Entry';
        noteForm.reset();
        document.getElementById('noteId').value = '';
        currentAttachments = [];
        attachmentPreview.innerHTML = '';
        deleteBtn.classList.add('d-none');
    }
});

async function moveCurrentToTrash() {
    const id = parseInt(document.getElementById('noteId').value);
    // Find in user's notes
    const note = allNotes.find(n => n.id === id);
    if (note && confirm('Move this note to trash?')) {
        await dbOps.moveToTrash(note);
        await refreshNotes();
        noteModal.hide();
    }
}

async function loadTrash() {
    // Filter trash by currentUser
    allTrashNotes = await dbOps.getUserTrash(currentUser);
    allTrashNotes.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    
    if (currentTab === 'trash') {
        applyCurrentSearch();
    }
}

function displayTrash(trashToDisplay) {
    const trashGrid = document.getElementById('trashGrid');
    trashGrid.innerHTML = '';

    if (trashToDisplay.length === 0) {
        trashGrid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No items found in trash</div>';
        return;
    }

    trashToDisplay.forEach(note => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card p-4 h-100 border-dashed">
                <h5 class="note-title opacity-75">${note.title}</h5>
                <p class="note-content opacity-50 small">${note.content}</p>
                <div class="d-flex gap-2 mt-auto pt-3">
                    <button class="btn btn-sm btn-outline-success flex-fill" onclick="restoreNote(${note.id})">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>Restore
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="permanentDelete(${note.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        trashGrid.appendChild(col);
    });
}

async function restoreNote(id) {
    const note = allTrashNotes.find(n => n.id === id);
    if (note) {
        await dbOps.restoreFromTrash(note);
        await refreshNotes();
        await loadTrash();
    }
}

async function permanentDelete(id) {
    if (confirm('Permanently delete this note? This cannot be undone.')) {
        await dbOps.permanentlyDelete(id);
        await loadTrash();
    }
}

// Search functionality
function applyCurrentSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (currentTab === 'active') {
        const filtered = allNotes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
        displayNotes(filtered);
    } else {
        const filtered = allTrashNotes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
        displayTrash(filtered);
    }
}

document.getElementById('searchInput').addEventListener('input', applyCurrentSearch);

// Tab Listeners
document.getElementById('nav-active-tab').addEventListener('shown.bs.tab', () => {
    currentTab = 'active';
    applyCurrentSearch();
});

document.getElementById('nav-trash-tab').addEventListener('shown.bs.tab', () => {
    currentTab = 'trash';
    loadTrash();
});
