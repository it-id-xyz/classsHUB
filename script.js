import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. Konfigurasi Firebase (ISI DENGAN MILIKMU)
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "MESSAGING_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

let isAdmin = false;

// 2. DOM Elements
// (DOM Tab & Login sama dengan versi sebelumnya, dipotong agar hemat baris fokus ke Core Logic)
const linksContainer = document.getElementById('linksContainer');
const filesContainer = document.getElementById('filesContainer');

// Elements Add Modal
const fabAdd = document.getElementById('fabAdd');
const addModal = document.getElementById('addModal');
const closeAddBtn = document.getElementById('closeAddBtn');
const addForm = document.getElementById('addForm');
const btnTypeLink = document.getElementById('btnTypeLink');
const btnTypeFile = document.getElementById('btnTypeFile');
const inputTitle = document.getElementById('inputTitle');
const inputUrl = document.getElementById('inputUrl');
const inputFile = document.getElementById('inputFile');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const submitAddBtn = document.getElementById('submitAddBtn');

let currentInputType = 'link'; // 'link' atau 'file'

// 3. UI Interactions Add Modal
fabAdd.addEventListener('click', () => addModal.classList.remove('hidden'));
closeAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));

btnTypeLink.addEventListener('click', () => {
    currentInputType = 'link';
    btnTypeLink.className = "flex-1 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold border border-blue-600";
    btnTypeFile.className = "flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold border border-transparent";
    inputUrl.classList.remove('hidden');
    inputUrl.required = true;
    inputFile.classList.add('hidden');
    inputFile.required = false;
});

btnTypeFile.addEventListener('click', () => {
    currentInputType = 'file';
    btnTypeFile.className = "flex-1 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold border border-blue-600";
    btnTypeLink.className = "flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold border border-transparent";
    inputFile.classList.remove('hidden');
    inputFile.required = true;
    inputUrl.classList.add('hidden');
    inputUrl.required = false;
});

// 4. Core Logic: Tambah Data (Submit Form)
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitAddBtn.disabled = true;
    submitAddBtn.innerText = "Menyimpan...";

    try {
        if (currentInputType === 'link') {
            await addDoc(collection(db, "links"), {
                title: inputTitle.value,
                url: inputUrl.value,
                createdAt: serverTimestamp()
            });
            resetFormAndClose();
        } 
        else if (currentInputType === 'file') {
            const file = inputFile.files[0];
            if (!file) return alert("Pilih file terlebih dahulu!");

            uploadProgress.classList.remove('hidden');
            const storageRef = ref(storage, `materi/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressBar.style.width = progress + '%';
                }, 
                (error) => {
                    console.error(error);
                    alert("Upload gagal!");
                    submitAddBtn.disabled = false;
                }, 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await addDoc(collection(db, "files"), {
                        title: inputTitle.value,
                        fileName: file.name,
                        url: downloadURL,
                        storagePath: uploadTask.snapshot.ref.fullPath,
                        createdAt: serverTimestamp()
                    });
                    resetFormAndClose();
                }
            );
        }
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Terjadi kesalahan sistem.");
        submitAddBtn.disabled = false;
    }
});

function resetFormAndClose() {
    addForm.reset();
    uploadProgress.classList.add('hidden');
    progressBar.style.width = '0%';
    addModal.classList.add('hidden');
    submitAddBtn.disabled = false;
    submitAddBtn.innerText = "Simpan";
}

// 5. Core Logic: Read Data (Real-time Listeners)
function listenData() {
    // Listener Links
    onSnapshot(collection(db, "links"), (snapshot) => {
        linksContainer.innerHTML = '';
        if(snapshot.empty) {
            linksContainer.innerHTML = `<p class="text-sm text-gray-500 text-center italic mt-4">Belum ada link yang ditambahkan.</p>`;
            return;
        }
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700";
            el.innerHTML = `
                <a href="${data.url}" target="_blank" class="font-medium text-blue-600 dark:text-blue-400 hover:underline"><i class="fa-solid fa-link mr-2"></i>${data.title}</a>
                ${isAdmin ? `<button class="text-red-500 hover:text-red-700 delete-link-btn" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button>` : ''}
            `;
            linksContainer.appendChild(el);
        });
        attachDeleteListeners();
    });

    // Listener Files
    onSnapshot(collection(db, "files"), (snapshot) => {
        filesContainer.innerHTML = '';
        if(snapshot.empty) {
            filesContainer.innerHTML = `<p class="text-sm text-gray-500 text-center italic mt-4">Belum ada materi yang diunggah.</p>`;
            return;
        }
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700";
            el.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-medium text-gray-800 dark:text-gray-200"><i class="fa-solid fa-file-pdf text-red-500 mr-2"></i>${data.title}</span>
                    <a href="${data.url}" target="_blank" class="text-xs text-blue-500 hover:underline mt-1">Download File</a>
                </div>
                ${isAdmin ? `<button class="text-red-500 hover:text-red-700 delete-file-btn" data-id="${docSnap.id}" data-path="${data.storagePath}"><i class="fa-solid fa-trash"></i></button>` : ''}
            `;
            filesContainer.appendChild(el);
        });
        attachDeleteListeners();
    });
}

// 6. Core Logic: Delete Data
function attachDeleteListeners() {
    document.querySelectorAll('.delete-link-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Hapus link ini?")) {
                await deleteDoc(doc(db, "links", btn.dataset.id));
            }
        });
    });

    document.querySelectorAll('.delete-file-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Hapus file materi ini? (Tindakan ini tidak bisa dibatalkan)")) {
                try {
                    // Hapus dari Storage dulu
                    const fileRef = ref(storage, btn.dataset.path);
                    await deleteObject(fileRef);
                    // Hapus dari Firestore
                    await deleteDoc(doc(db, "files", btn.dataset.id));
                } catch (error) {
                    console.error("Gagal menghapus file:", error);
                }
            }
        });
    });
}

// Panggil listenData di dalam onAuthStateChanged
onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    // ... logic hide/show tombol login/fab ...
    listenData(); // Refresh UI setiap kali ganti akun
});
