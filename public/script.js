let currentUser = null;
const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
    const chatMessages = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = event.data;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

function showLogin() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('loginForm').classList.add('active');
}

function showSignup() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('signupForm').classList.add('active');
}

function showMain() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('currentUser').textContent = currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role;
    if (currentUser.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
        loadHolidayRequests();
    }
}

function showChat() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('chatContainer').classList.add('active');
}

function showHolidayForm() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('holidayContainer').classList.add('active');
}

function showMessages() {
    document.querySelectorAll('.form-container, .chat-container, .holiday-container, .messages-container')
        .forEach(el => el.classList.remove('active'));
    document.getElementById('messagesContainer').classList.add('active');
    loadRecipients();
    loadPrivateMessages();
}

async function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });

    const result = await response.json();
    if (response.ok) {
        alert('Signup successful! Please login.');
        showLogin();
    } else {
        alert(result.error);
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (response.ok) {
        currentUser = result.user;
        showMain();
    } else {
        alert(result.error);
    }
}

function logout() {
    currentUser = null;
    socket.close();
    showLogin();
}

function sendChatMessage() {
    const message = document.getElementById('chatInput').value;
    if (message && socket.readyState === WebSocket.OPEN) {
        const formattedMessage = `${currentUser.username} (${currentUser.role}): ${message}`;
        socket.send(formattedMessage);
        document.getElementById('chatInput').value = '';
    }
}

async function submitHolidayRequest() {
    const date = document.getElementById('holidayDate').value;
    const reason = document.getElementById('holidayReason').value;

    if (!date || !reason) {
        alert('Please fill in all fields');
        return;
    }

    const response = await fetch('http://localhost:3000/holiday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, date, reason })
    });

    if (response.ok) {
        alert('Holiday request submitted');
        showMain();
    } else {
        alert('Error submitting request');
    }
}

async function loadHolidayRequests() {
    const response = await fetch('http://localhost:3000/holiday');
    const requests = await response.json();
    const requestsDiv = document.getElementById('holidayRequests');
    requestsDiv.innerHTML = '';

    requests.forEach(request => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `
            ${request.username} - ${request.date}: ${request.reason} [${request.status}]
            ${request.status === 'Pending' ? `
                <button onclick="approveHoliday(${request.id})">Approve</button>
                <button onclick="rejectHoliday(${request.id})">Reject</button>
            ` : ''}
        `;
        requestsDiv.appendChild(div);
    });
}

async function approveHoliday(id) {
    const response = await fetch(`http://localhost:3000/holiday/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
    });

    if (response.ok) {
        loadHolidayRequests();
    }
}

async function rejectHoliday(id) {
    const response = await fetch(`http://localhost:3000/holiday/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
    });

    if (response.ok) {
        loadHolidayRequests();
    }
}

async function loadRecipients() {
    const response = await fetch('http://localhost:3000/users');
    const users = await response.json();
    const recipientSelect = document.getElementById('messageRecipient');
    recipientSelect.innerHTML = '<option value="">Select Recipient</option>';
    users.forEach(user => {
        if (user.id !== currentUser.id) {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.role})`;
            recipientSelect.appendChild(option);
        }
    });
}

async function sendPrivateMessage() {
    const recipient_id = document.getElementById('messageRecipient').value;
    const message = document.getElementById('privateMessage').value;

    if (!recipient_id || !message) {
        alert('Please select a recipient and enter a message');
        return;
    }

    const response = await fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: currentUser.id, recipient_id, message })
    });

    if (response.ok) {
        document.getElementById('privateMessage').value = '';
        loadPrivateMessages();
    } else {
        alert('Error sending message');
    }
}

async function loadPrivateMessages() {
    const response = await fetch(`http://localhost:3000/messages/${currentUser.id}`);
    const messages = await response.json();
    const messagesDiv = document.getElementById('privateMessages');
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        div.textContent = `${msg.sender_username} to ${msg.recipient_username} (${msg.timestamp}): ${msg.message}`;
        messagesDiv.appendChild(div);
    });
}