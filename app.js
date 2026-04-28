// app.js
// Main application file using modular Firebase SDK

import { 
    auth, 
    db,
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    collection,
    addDoc,
    serverTimestamp
} from './firebase-config.js';

// ========== APPLICATION STATE ==========
let currentUser = null;
let isGuest = false;
let selectedSeats = new Set();
let occupiedSeats = new Set();

// Pricing configuration
const pricing = {
    front: { adult: 20, child: 12 },
    back: { adult: 15, child: 9 }
};

// Mock bookings (already occupied seats)
const mockBookings = [
    { seatNumber: 1, ticketType: 'adult' },
    { seatNumber: 5, ticketType: 'child' },
    { seatNumber: 12, ticketType: 'adult' },
    { seatNumber: 18, ticketType: 'child' },
    { seatNumber: 22, ticketType: 'adult' },
];

// Initialize occupied seats from mock data
mockBookings.forEach(b => occupiedSeats.add(b.seatNumber));

// ========== PAGE INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeSeats();
    attachEventListeners();
    updatePricing();
});

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isGuest = false;
        showBookingApp();
        displayAuthStatus();
        console.log('✅ User logged in:', user.email);
    } else if (isGuest) {
        showBookingApp();
    } else {
        showAuthModal();
    }
});

// ========== SEAT MANAGEMENT ==========
function initializeSeats() {
    // Generate front zone seats (1-15)
    const frontContainer = document.getElementById('front-seats');
    for (let i = 1; i <= 15; i++) {
        frontContainer.appendChild(createSeatButton(i, 'front'));
    }

    // Generate back zone seats (16-30)
    const backContainer = document.getElementById('back-seats');
    for (let i = 16; i <= 30; i++) {
        backContainer.appendChild(createSeatButton(i, 'back'));
    }

    console.log('🎭 Seats initialized');
}

function createSeatButton(seatNumber, zone) {
    const button = document.createElement('button');
    button.className = 'seat w-12 h-12 rounded font-bold text-sm';
    button.textContent = seatNumber;
    button.dataset.seatNumber = seatNumber;
    button.dataset.zone = zone;

    if (occupiedSeats.has(seatNumber)) {
        button.classList.add('occupied');
        button.disabled = true;
    } else {
        button.classList.add('available');
    }

    button.addEventListener('click', () => toggleSeatSelection(seatNumber, button, zone));
    return button;
}

function toggleSeatSelection(seatNumber, button, zone) {
    if (occupiedSeats.has(seatNumber)) return;

    if (selectedSeats.has(seatNumber)) {
        selectedSeats.delete(seatNumber);
        button.classList.remove('selected');
        button.classList.add('available');
    } else {
        selectedSeats.add(seatNumber);
        button.classList.add('selected');
        button.classList.remove('available');
    }

    updateSelectedList();
    updatePricing();
    console.log('Seat toggled:', seatNumber);
}

// ========== UI UPDATES ==========
function updateSelectedList() {
    const listContainer = document.getElementById('selected-seats-list');
    const ticketType = document.getElementById('ticket-type').value;

    if (selectedSeats.size === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-sm">No seats selected</p>';
        return;
    }

    const seatsArray = Array.from(selectedSeats).sort((a, b) => a - b);
    const seatsHTML = seatsArray.map(seat => {
        const zone = seat <= 15 ? 'Front' : 'Back';
        return `<div class="text-sm text-gray-800 py-1">Seat ${seat} (${zone}) - ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)}</div>`;
    }).join('');

    listContainer.innerHTML = seatsHTML;
}

function updatePricing() {
    const ticketType = document.getElementById('ticket-type').value;
    let total = 0;

    selectedSeats.forEach(seatNumber => {
        const zone = seatNumber <= 15 ? 'front' : 'back';
        total += pricing[zone][ticketType];
    });

    document.getElementById('subtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('confirm-btn').disabled = selectedSeats.size === 0;
}

// ========== AUTHENTICATION ==========
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

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function clearAuthError() {
    document.getElementById('auth-error').classList.add('hidden');
}

// ========== BOOKING OPERATIONS ==========
async function confirmBooking() {
    if (selectedSeats.size === 0) return;

    const ticketType = document.getElementById('ticket-type').value;
    const total = parseFloat(document.getElementById('total').textContent.replace('$', ''));

    const bookingData = {
        seats: Array.from(selectedSeats),
        ticketType: ticketType,
        total: total,
        userEmail: currentUser ? currentUser.email : 'guest@anonymous.com',
        userId: currentUser ? currentUser.uid : 'guest-' + Date.now(),
        timestamp: serverTimestamp()
    };

    try {
        // Save to Firestore
        const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
        console.log('✅ Booking saved:', bookingRef.id);

        // Update UI
        selectedSeats.forEach(seat => occupiedSeats.add(seat));
        
        const confirmationMsg = document.getElementById('confirmation-message');
        confirmationMsg.classList.remove('hidden');
        confirmationMsg.innerHTML = `✅ Booking confirmed! Ref: ${bookingRef.id}`;

        setTimeout(clearSelection, 2000);
    } catch (error) {
        console.error('❌ Booking failed:', error);
        alert('Booking failed: ' + error.message);
    }
}

function clearSelection() {
    selectedSeats.forEach(seatNumber => {
        const button = document.querySelector(`button[data-seat-number="${seatNumber}"]`);
        if (button && !occupiedSeats.has(seatNumber)) {
            button.classList.remove('selected');
            button.classList.add('available');
        }
    });

    selectedSeats.clear();
    updateSelectedList();
    updatePricing();
    console.log('🗑️ Selection cleared');
}

// ========== EVENT LISTENERS ==========
function attachEventListeners() {
    // Ticket type change
    document.getElementById('ticket-type').addEventListener('change', () => {
        updateSelectedList();
        updatePricing();
    });

    // Booking buttons
    document.getElementById('confirm-btn').addEventListener('click', confirmBooking);
    document.getElementById('clear-btn').addEventListener('click', clearSelection);

    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('guest-btn').addEventListener('click', handleGuest);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// ========== AUTH HANDLERS ==========
async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        clearAuthError();
    } catch (error) {
        showAuthError(error.message);
    }
}

async function handleSignup() {
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
        await createUserWithEmailAndPassword(auth, email, password);
        clearAuthError();
    } catch (error) {
        showAuthError(error.message);
    }
}

function handleGuest() {
    isGuest = true;
    showBookingApp();
    displayAuthStatus();
    console.log('👤 Guest mode enabled');
}

async function handleLogout() {
    try {
        await signOut(auth);
        currentUser = null;
        isGuest = false;
        console.log('👋 Logged out');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}
