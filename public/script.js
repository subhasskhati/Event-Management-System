// Simple JS for student project

function updateNavbar() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const navLinks = document.getElementById('nav-links');

    if (token && user) {
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="chatbot.html">AI Assistant</a></li>
            <li><a href="#" onclick="logout()">Logout (${user.name})</a></li>
        `;

        const adminControls = document.getElementById('admin-controls');
        if (adminControls) {
            adminControls.style.display = user.role === 'admin' ? 'flex' : 'none';
        }

        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.toggle('hidden', user.role !== 'admin');
        }
    } else {
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="chatbot.html">AI Assistant</a></li>
            <li><a href="register.html">Register</a></li>
            <li><a href="login.html">Login</a></li>
        `;
    }
}

function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === path);
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function loadAdminDashboard() {
    const adminUsersEl = document.getElementById('admin-users');
    const adminContactsEl = document.getElementById('admin-contacts');
    const token = localStorage.getItem('token');

    if (!token || !adminUsersEl || !adminContactsEl) return;

    try {
        const res = await fetch('/api/adminDashboard', {
            headers: {
                'x-auth-token': token
            }
        });

        if (!res.ok) {
            console.error('Failed to load admin dashboard', await res.text());
            return;
        }

        const { users, contacts } = await res.json();

        adminUsersEl.innerHTML = users.length > 0 ? `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p class="form-note">No user accounts available.</p>';

        adminContactsEl.innerHTML = contacts.length > 0 ? contacts.map(contact => `
            <div class="message-card">
                <div class="message-card-header">
                    <strong>${contact.name}</strong>
                    <span>${contact.email}</span>
                </div>
                <p>${contact.message}</p>
                <small>${new Date(contact.createdAt).toLocaleString()}</small>
            </div>
        `).join('') : '<p class="form-note">No contact messages available.</p>';
    } catch (err) {
        console.error('Admin dashboard error:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    setActiveNav();
    loadEvents();
    loadBookings();

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'admin') {
        loadAdminDashboard();
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json();
                document.getElementById('contact-status').innerText = data.msg;
                contactForm.reset();
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    document.getElementById('login-error').innerText = data.msg;
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    document.getElementById('reg-error').innerText = data.msg;
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Event form
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('event-id').value;
            const title = document.getElementById('event-title').value;
            const description = document.getElementById('event-desc').value;
            const date = document.getElementById('event-date').value;
            const location = document.getElementById('event-loc').value;
            const organizer = document.getElementById('event-org').value;

            const token = localStorage.getItem('token');
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/editEvent/${id}` : '/api/addEvent';

            try {
                const res = await fetch(url, {
                    method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ title, description, date, location, organizer })
                });
                if (res.ok) {
                    closeAddEventForm();
                    loadEvents();
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
});


async function loadEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        const user = JSON.parse(localStorage.getItem('user'));

        if (!events.length) {
            eventsList.innerHTML = '<div class="event-card"><p class="form-note">No events available right now. Check back later.</p></div>';
            return;
        }

        eventsList.innerHTML = events.map(event => {
            const imageUrl = event.image || 'https://via.placeholder.com/500x300?text=Event+Image';
            const editButtons = user && user.role === 'admin' ? `
                <button class="btn" onclick='editEvent(${JSON.stringify(event._id)}, ${JSON.stringify(event.title)}, ${JSON.stringify(event.description)}, ${JSON.stringify(event.date)}, ${JSON.stringify(event.location)}, ${JSON.stringify(event.organizer)})'>Edit</button>
                <button class="btn btn-danger" onclick='deleteEvent(${JSON.stringify(event._id)})'>Delete</button>
            ` : '';

            return `
                <div class="event-card">
                    <img loading="lazy" src="${imageUrl}" alt="${event.title}">
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${event.date}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p>${event.description}</p>
                    <button class="btn" onclick="bookEvent('${event._id}')">Book Now</button>
                    ${editButtons}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}

async function bookEvent(eventId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to book an event');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('/api/bookEvent', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ eventId })
        });
        const data = await res.json();
        alert(data.msg);
    } catch (err) {
        console.error(err);
    }
}

async function deleteEvent(id) {
    if (!confirm('Are you sure?')) return;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`/api/deleteEvent/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (res.ok) loadEvents();
    } catch (err) {
        console.error(err);
    }
}

function editEvent(id, title, desc, date, loc, org) {
    document.getElementById('event-id').value = id;
    document.getElementById('event-title').value = title;
    document.getElementById('event-desc').value = desc;
    document.getElementById('event-date').value = date;
    document.getElementById('event-loc').value = loc;
    document.getElementById('event-org').value = org;
    document.getElementById('modal-title').innerText = 'Edit Event';
    document.getElementById('add-event-modal').style.display = 'block';
}

function showAddEventForm() {
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('modal-title').innerText = 'Add New Event';
    document.getElementById('add-event-modal').style.display = 'block';
}

function closeAddEventForm() {
    document.getElementById('add-event-modal').style.display = 'none';
}

async function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/myBookings', {
            headers: { 'x-auth-token': token }
        });
        const bookings = await res.json();

        if (!bookings.length) {
            bookingsList.innerHTML = '<div class="event-card"><p class="form-note">You have no bookings yet.</p></div>';
            return;
        }

        bookingsList.innerHTML = bookings.map(booking => {
            const imageUrl = booking.eventId?.image || 'https://via.placeholder.com/500x300?text=Booked+Event';
            return `
                <div class="event-card">
                    <img loading="lazy" src="${imageUrl}" alt="${booking.eventId?.title || 'Booking'}">
                    <h3>${booking.eventId?.title || 'Booked Event'}</h3>
                    <p><strong>Date:</strong> ${booking.eventId?.date || 'Unknown'}</p>
                    <p><strong>Location:</strong> ${booking.eventId?.location || 'Unknown'}</p>
                    <p>Booked on: ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}
