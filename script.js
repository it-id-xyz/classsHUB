import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Konfigurasi Firebase (Ganti dengan .env lu)
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    messagingSenderId: "MESSAGING_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let isAdmin = false;

// 2. Element DOM
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const tabLinks = document.getElementById('tabLinks');
const tabFiles = document.getElementById('tabFiles');
const contentLinks = document.getElementById('contentLinks');
const contentFiles = document.getElementById('contentFiles');

// Modal Elements
const loginModal = document.getElementById('loginModal');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const fabAdd = document.getElementById('fabAdd');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');

let currentCollection = 'links'; // 'links' atau 'files'

// 3. UI Interactions (Theme & Tabs)
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    themeToggle.innerHTML = body.classList.contains('dark') ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

tabLinks.addEventListener('click', () => {
    tabLinks.classList.add('active');
    tabFiles.classList.remove('active');
    contentLinks.classList.remove('hidden');
    contentFiles.classList.add('hidden');
});

tabFiles.addEventListener('click', () => {
    tabFiles.classList.add('active');
    tabLinks.classList.remove('active');
    contentFiles.classList.remove('hidden');
    contentLinks.classList.add('hidden');
});

// 4. Modal Add Data (Pilih Link / File URL)
const btnTypeLink = document.getElementById('btnTypeLink');
const btnTypeFile = document.getElementById('btnTypeFile');
const inputTitle = document.getElementById('inputTitle');
const inputUrl = document.getElementById('inputUrl');

fabAdd.addEventListener('click', () => addModal.classList.remove('hidden'));
document.getElementById('closeAddBtn').addEventListener('click', () => addModal.classList.add('hidden'));

btnTypeLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentCollection = 'links';
    btnTypeLink.classList.add('active');
    btnTypeFile.classList.remove('active');
    inputTitle.placeholder = "Judul (Contoh: Zoom Matpel X)";
});

btnTypeFile.addEventListener('click', (e) => {
    e.preventDefault();
    currentCollection = 'files';
    btnTypeFile.classList.add('active');
    btnTypeLink.classList.remove('active');
    inputTitle.placeholder = "Judul (Contoh: Modul Fisika Bab 1)";
});

// 5. Auth Logic
adminLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
document.getElementById('closeLoginBtn').addEventListener('click', () => loginModal.classList.add('hidden'));

document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
        loginModal.classList.add('hidden');
    } catch (error) {
        alert("Login gagal: " + error.message);
    }
});

adminLogoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    if (isAdmin) {
        adminLoginBtn.classList.add('hidden');
        adminLogoutBtn.classList.remove('hidden');
        fabAdd.classList.remove('hidden');
    } else {
        adminLoginBtn.classList.remove('hidden');
        adminLogoutBtn.classList.add('hidden');
        fabAdd.classList.add('hidden');
    }
    listenData(); // Reload UI
});

// 6. Firestore CRUD (Create, Read, Delete)
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('submitAddBtn');
    btnSubmit.innerText = "Menyimpan...";
    btnSubmit.disabled = true;

    try {
        await addDoc(collection(db, currentCollection), {
            title: inputTitle.value,
            url: inputUrl.value,
            createdAt: serverTimestamp()
        });
        addForm.reset();
        addModal.classList.add('hidden');
    } catch (error) {
        alert("Gagal menyimpan data.");
        console.error(error);
    } finally {
        btnSubmit.innerText = "Simpan";
        btnSubmit.disabled = false;
    }
});

function listenData() {
    const renderList = (snapshot, containerId, icon) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:14px;">Belum ada data.</p>`;
            return;
        }
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = "item-card";
            el.innerHTML = `
                <a href="${data.url}" target="_blank" class="item-link">
                    <i class="fa-solid ${icon}"></i> ${data.title}
                </a>
                ${isAdmin ? `<button class="btn-delete" data-id="${docSnap.id}" data-col="${containerId === 'linksContainer' ? 'links' : 'files'}"><i class="fa-solid fa-trash"></i></button>` : ''}
            `;
            container.appendChild(el);
        });

        // Event listener hapus
        document.querySelectorAll(`#${containerId} .btn-delete`).forEach(btn => {
            btn.addEventListener('click', async () => {
                if(confirm("Hapus data ini?")) {
                    await deleteDoc(doc(db, btn.dataset.col, btn.dataset.id));
                }
            });
        });
    };

    onSnapshot(collection(db, "links"), (snap) => renderList(snap, "linksContainer", "fa-link"));
    onSnapshot(collection(db, "files"), (snap) => renderList(snap, "filesContainer", "fa-file-pdf"));
}
