import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNkOS9iIm_TTTKSZHfhIcSw94fZUELyRQ",
  authDomain: "don-bosco-theatre-7f7ac.firebaseapp.com",
  projectId: "don-bosco-theatre-7f7ac",
  storageBucket: "don-bosco-theatre-7f7ac.firebasestorage.app",
  messagingSenderId: "980744605039",
  appId: "1:980744605039:web:04f17958f87386f0012c9a",
  measurementId: "G-1LJFSKEQBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log("🔥 Firestore Database connected successfully!");

// ========== FIREBASE AUTH ==========
let currentUser = null;
let isGuest = false;

// Check auth state on load
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        isGuest = false;
        showBookingApp();
        displayAuthStatus();
    } else if (isGuest) {
        showBookingApp();
    } else {
        showAuthModal();
    }
});

function showAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function showBookingApp() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('auth-status').classList.remove('hidden');
}

function displayAuthStatus() {
    const userInfo = document.getElementById('user-info');

    if (currentUser) {
        userInfo.textContent = `👤 ${currentUser.email}`;
    } else if (isGuest) {
        userInfo.textContent = '👤 Guest User';
    }
}

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        clearAuthError();
        console.log('✅ Login successful');
    } catch (error) {
        showAuthError(error.message);
        console.error('❌ Login failed:', error);
    }
});

// Sign Up
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        clearAuthError();
        console.log('✅ Sign up successful');
    } catch (error) {
        showAuthError(error.message);
        console.error('❌ Sign up failed:', error);
    }
});

// Guest Mode
document.getElementById('guest-btn').addEventListener('click', () => {
    isGuest = true;
    showBookingApp();
    displayAuthStatus();
    console.log('👤 Guest mode enabled');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await firebase.auth().signOut();
    currentUser = null;
    isGuest = false;
    console.log('👋 Logged out');
});

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function clearAuthError() {
    document.getElementById('auth-error').classList.add('hidden');
}

// ========== BOOKING FUNCTION ==========
async function confirmBooking() {
    const ticketType = document.getElementById('ticket-type').value;

    const bookingData = {
        seats: Array.from(selectedSeats),
        ticketType: ticketType,
        total: parseFloat(
            document.getElementById('total').textContent.replace('$', '')
        ),
        timestamp: new Date().toISOString(),
        userEmail: currentUser ? currentUser.email : 'guest@anonymous.com',
        userId: currentUser ? currentUser.uid : 'guest-' + Date.now()
    };

    console.log('📋 BOOKING DATA:', bookingData);

    try {
        if (currentUser || isGuest) {
            const bookingRef = await addDoc(
                collection(db, "bookings"),
                bookingData
            );

            console.log('✅ Booking saved to Firestore:', bookingRef.id);

            // Update occupied seats
            bookingData.seats.forEach(seat => occupiedSeats.add(seat));

            // Show confirmation
            const confirmationMsg = document.getElementById('confirmation-message');
            confirmationMsg.classList.remove('hidden');
            confirmationMsg.innerHTML =
                `✅ Booking confirmed! Reference: ${bookingRef.id}`;

            setTimeout(clearSelection, 2000);
        }
    } catch (error) {
        console.error('❌ Booking failed:', error);
        alert('Booking failed: ' + error.message);
    }
}
