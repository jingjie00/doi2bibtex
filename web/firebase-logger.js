import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDqt2pCzZFR3tlsj7xKs2BOFy77OlNcsUk",
    authDomain: "doi2bibtex.firebaseapp.com",
    projectId: "doi2bibtex",
    storageBucket: "doi2bibtex.firebasestorage.app",
    messagingSenderId: "286628035082",
    appId: "1:286628035082:web:29bd8072618369055f7df3",
    measurementId: "G-9H6CTS07KC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export async function logVisit() {
    try {
        const docRef = await addDoc(collection(db, "load_root"), {
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            path: window.location.pathname
        });
        console.log("Visit logged with ID: ", docRef.id);
    } catch (e) {
        console.error("Error logging visit: ", e);
    }
}
