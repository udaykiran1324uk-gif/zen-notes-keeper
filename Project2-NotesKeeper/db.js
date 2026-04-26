const DB_NAME = 'NotesKeeperDB';
const DB_VERSION = 5; // Incremented for mobile field
const STORE_NAME = 'notes';
const TRASH_STORE = 'trash';
const USERS_STORE = 'users';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('username', 'username', { unique: false });
            }
            if (!db.objectStoreNames.contains(TRASH_STORE)) {
                const store = db.createObjectStore(TRASH_STORE, { keyPath: 'id' });
                store.createIndex('username', 'username', { unique: false });
            }
            if (!db.objectStoreNames.contains(USERS_STORE)) {
                db.createObjectStore(USERS_STORE, { keyPath: 'username' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

const dbOps = {
    // User Management
    async registerUser(username, password, mobile) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(USERS_STORE, 'readwrite');
            const store = transaction.objectStore(USERS_STORE);
            const request = store.add({ username, password, mobile });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject("Username already exists");
        });
    },

    async loginUser(username, password) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(USERS_STORE, 'readonly');
            const store = transaction.objectStore(USERS_STORE);
            const request = store.get(username);
            request.onsuccess = () => {
                const user = request.result;
                if (user && user.password === password) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    async getUserByUsername(username) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(USERS_STORE, 'readonly');
            const store = transaction.objectStore(USERS_STORE);
            const request = store.get(username);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updatePassword(username, newPassword) {
        const db = await openDB();
        const user = await this.getUserByUsername(username);
        if (!user) throw new Error("User not found");
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(USERS_STORE, 'readwrite');
            const store = transaction.objectStore(USERS_STORE);
            user.password = newPassword;
            const request = store.put(user);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    // User-Specific Notes Management
    async getUserNotes(username) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('username');
            const request = index.getAll(username);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getUserTrash(username) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(TRASH_STORE, 'readonly');
            const store = transaction.objectStore(TRASH_STORE);
            const index = store.index('username');
            const request = index.getAll(username);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async addNote(note) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updateNote(note) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async moveToTrash(note) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME, TRASH_STORE], 'readwrite');
            transaction.objectStore(STORE_NAME).delete(note.id);
            transaction.objectStore(TRASH_STORE).add({
                ...note,
                deletedAt: Date.now()
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async restoreFromTrash(note) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME, TRASH_STORE], 'readwrite');
            transaction.objectStore(TRASH_STORE).delete(note.id);
            const { deletedAt, ...originalNote } = note;
            transaction.objectStore(STORE_NAME).add(originalNote);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async permanentlyDelete(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(TRASH_STORE, 'readwrite');
            const store = transaction.objectStore(TRASH_STORE);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async cleanOldTrash() {
        const db = await openDB();
        const transaction = db.transaction(TRASH_STORE, 'readwrite');
        const store = transaction.objectStore(TRASH_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const trash = request.result;
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            trash.forEach(note => {
                if (now - note.deletedAt > thirtyDaysInMs) {
                    store.delete(note.id);
                }
            });
        };
    }
};
