// Import fungsi Firebase dari CDN (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. Konfigurasi Firebase (Ambil dari .env / ganti dengan milikmu)
const firebaseConfig = {
  apiKey: "AIzaSyA23k0yeIkXj8_u91YH6qqIF_y117665tM",
  authDomain: "gudang-186be.firebaseapp.com",
  projectId: "gudang-186be",
  storageBucket: "gudang-186be.firebasestorage.app",
  messagingSenderId: "39135400483",
  appId: "1:39135400483:web:ec0a9437524d4c2a645796",
  measurementId: "G-LB3RDLL34Y"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// State Management
let isAdmin = false;

// 2. DOM Elements
const themeToggle = document.getElementById('themeToggle');
const htmlTag = document.documentElement;

// Tab Navigation
const tabLinks = document.getElementById('tabLinks');
const tabFiles = document.getElementById('tabFiles');
const contentLinks = document.getElementById('contentLinks');
const contentFiles = document.getElementById('contentFiles');

// Admin Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const fabAdd = document.getElementById('fabAdd');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');

// 3. UI Interactions (Tabs & Theme)
themeToggle.addEventListener('click', () => {
    htmlTag.classList.toggle('dark');
    const isDark = htmlTag.classList.contains('dark');
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

tabLinks.addEventListener('click', () => {
    contentLinks.classList.remove('hidden');
    contentFiles.classList.add('hidden');
    tabLinks.classList.add('text-primary', 'border-b-2', 'border-primary');
    tabLinks.classList.remove('text-gray-500');
    tabFiles.classList.add('text-gray-500');
    tabFiles.classList.remove('text-primary', 'border-b-2', 'border-primary');
    contentLinks.classList.add('fade-in');
});

tabFiles.addEventListener('click', () => {
    contentFiles.classList.remove('hidden');
    contentLinks.classList.add('hidden');
    tabFiles.classList.add('text-primary', 'border-b-2', 'border-primary');
    tabFiles.classList.remove('text-gray-500');
    tabLinks.classList.add('text-gray-500');
    tabLinks.classList.remove('text-primary', 'border-b-2', 'border-primary');
    contentFiles.classList.add('fade-in');
});

// 4. Authentication Logic
adminLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
closeLoginBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

submitLoginBtn.addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.add('hidden');
        alert("Login Berhasil!");
    } catch (error) {
        alert("Login Gagal: " + error.message);
    }
});

adminLogoutBtn.addEventListener('click', () => signOut(auth));

// Listener Status Auth (Cek siapa yang login)
onAuthStateChanged(auth, (user) => {
    if (user) {
        isAdmin = true;
        adminLoginBtn.classList.add('hidden');
        adminLogoutBtn.classList.remove('hidden');
        fabAdd.classList.remove('hidden');
    } else {
        isAdmin = false;
        adminLoginBtn.classList.remove('hidden');
        adminLogoutBtn.classList.add('hidden');
        fabAdd.classList.add('hidden');
    }
    fetchData(); // Render ulang data berdasarkan status admin
});

// 5. Database Logic (Read Data)
async function fetchData() {
    // Boilerplate mengambil link (Asumsi ada collection 'links' di Firestore)
    const linksContainer = document.getElementById('linksContainer');
    linksContainer.innerHTML = ''; // Kosongkan saat loading

    try {
        // Contoh Hardcode UI (Ganti dengan getDocs dari Firestore nanti)
        // const querySnapshot = await getDocs(collection(db, "links"));
        // querySnapshot.forEach((doc) => { ... });
        
        // Mockup Data UI
        const mockupLinks = [
            { id: 1, title: 'Zoom Meeting Matematika', url: '#', icon: 'fa-video' },
            { id: 2, title: 'Grup WA Kelas 12', url: '#', icon: 'fa-whatsapp' }
        ];

        mockupLinks.forEach(item => {
            const el = document.createElement('div');
            el.className = "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700";
            el.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-primary flex items-center justify-center">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <a href="${item.url}" class="font-medium hover:text-primary transition">${item.title}</a>
                </div>
                ${isAdmin ? `<button class="text-red-500 hover:text-red-700" onclick="deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
            `;
            linksContainer.appendChild(el);
        });

        // Lakukan hal yang sama untuk filesContainer (Storage)
        const filesContainer = document.getElementById('filesContainer');
        filesContainer.innerHTML = '<p class="text-sm text-gray-500 text-center mt-4">Belum ada materi yang diunggah.</p>';

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Global function dummy untuk delete
window.deleteItem = (id) => {
    if(confirm('Hapus item ini?')) {
        console.log("Delete logic untuk ID:", id);
        // Implementasi deleteDoc(doc(db, "links", id))
    }
}
