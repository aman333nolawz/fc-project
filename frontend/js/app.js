const BACKEND_URL = 'https://fc-project-api.nolawz.dev';
const API_URL = BACKEND_URL + "/api";

// Auth State
let currentUser = null;
let token = localStorage.getItem('token');

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

// Theme Management
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    // Check for saved theme or system preference
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon(false);
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme === 'dark');
};

const updateThemeIcon = (isDark) => {
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (window.lucide) {
            lucide.createIcons({
                root: themeBtn,
                nameAttr: 'data-lucide'
            });
        }
    }
};

const showAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.padding = '15px 25px';
    alertDiv.style.borderRadius = '8px';
    alertDiv.style.color = 'white';
    alertDiv.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--error-color)';
    alertDiv.style.zIndex = '3000';
    alertDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    alertDiv.style.animation = 'slideDown 0.3s ease-out';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
};

// API Calls
const api = {
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_URL}/users/token`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Login failed');

            const data = await response.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            await this.getCurrentUser();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },

    async register(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async getCurrentUser() {
        if (!token) return null;
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                currentUser = await response.json();
                updateAuthUI();
                return currentUser;
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Get user error:', error);
            this.logout();
        }
        return null;
    },

    logout() {
        token = null;
        currentUser = null;
        localStorage.removeItem('token');
        updateAuthUI();
        window.location.reload();
    },

    async getCars() {
        try {
            const response = await fetch(`${API_URL}/cars`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching cars:', error);
            return [];
        }
    },

    async getCar(id) {
        try {
            const response = await fetch(`${API_URL}/cars/${id}`);
            if (!response.ok) throw new Error('Car not found');
            return await response.json();
        } catch (error) {
            console.error('Error fetching car:', error);
            return null;
        }
    },

    async getMyBookings() {
        if (!token) return [];
        try {
            const response = await fetch(`${API_URL}/bookings/my`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    },

    async createBooking(carId, startDate, endDate) {
        if (!token) return false;
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    car_id: carId,
                    start_date: startDate,
                    end_date: endDate
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Booking failed');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    },
    async addCar(formData) {
        if (!token) throw new Error('Not authenticated');
        try {
            const response = await fetch(`${API_URL}/cars`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is set automatically by browser for FormData
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to add car');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
};

// UI Updates
const updateAuthUI = () => {
    const guestLinks = document.getElementById('guestLinks');
    const userMenu = document.getElementById('userMenu');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (currentUser) {
        if (guestLinks) guestLinks.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
    } else {
        if (guestLinks) guestLinks.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
};

// Render Functions
const renderCars = (cars) => {
    const carsContainer = document.getElementById('carsContainer');
    if (!carsContainer) return;

    carsContainer.innerHTML = cars.map(car => `
        <div class="card car-card">
            <img src="${BACKEND_URL}${car.image_path || 'frontend/images/placeholder.jpg'}" alt="${car.brand} ${car.model}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0;">${car.brand} ${car.model}</h3>
                    <span style="background: var(--secondary-color); padding: 4px 8px; border-radius: 4px; font-size: 0.875rem;">${car.year}</span>
                </div>
                <p style="color: var(--primary-color); font-weight: 700; font-size: 1.25rem; margin-bottom: 15px;">
                    ${formatCurrency(car.price_per_day)} <span style="font-size: 0.875rem; color: var(--text-color); font-weight: 400;">/ day</span>
                </p>
                <div style="display: flex; gap: 10px;">
                    <a href="car-details.html?id=${car.id}" class="btn btn-outline" style="flex: 1; text-align: center;">View Details</a>
                    <button onclick="openBookingModal(${car.id}, '${car.brand} ${car.model}', ${car.price_per_day})" class="btn" style="flex: 1;">Book Now</button>
                </div>
            </div>
        </div>
    `).join('');

    // Trigger animations after rendering
    if (window.animateCarCards) {
        window.animateCarCards();
    }
};

// Event Listeners and Init
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    // Add theme button listener if it exists (it might be added dynamically or exist in static HTML)
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }

    await api.getCurrentUser();

    // Check if we are on the home page
    const carsContainer = document.getElementById('carsContainer');
    if (carsContainer) {
        const cars = await api.getCars();
        renderCars(cars);
    }

    // Modal Events
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.querySelector('.close');

    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        }
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            if (await api.login(username, password)) {
                showAlert('Login successful!');
                window.location.href = 'index.html';
            } else {
                showAlert('Login failed. Please check credentials.', 'error');
            }
        });
    }

    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }

            try {
                await api.register(username, email, password);
                showAlert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } catch (error) {
                showAlert(error.message, 'error');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }
});

// Global functions for HTML access
window.openBookingModal = (carId, carName, price) => {
    if (!currentUser) {
        showAlert('Please login to book a car', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const bookingForm = document.getElementById('bookingForm');

    modalTitle.textContent = `Book ${carName}`;
    modal.style.display = 'block';

    bookingForm.onsubmit = async (e) => {
        e.preventDefault();
        const start = bookingForm.startDate.value;
        const end = bookingForm.endDate.value;

        try {
            await api.createBooking(carId, start, end);
            showAlert('Booking created successfully!');
            modal.style.display = 'none';
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };
};
