const API_URL = 'http://localhost:3000';

// --- Authentication Functions ---

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (data.success) {
            if (data.isAdmin) {
                alert("Admin login not implemented in this view");
            } else {
                sessionStorage.setItem('student', JSON.stringify(data.student));
                window.location.href = 'dashboard.html';
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login.");
    }
}

async function register() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const course = document.getElementById('reg-course').value;
    const password = document.getElementById('reg-pass').value;

    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, course, password })
    });

    const data = await res.json();
    if (data.success) {
        alert('Registration Successful! Please Login.');
        showLogin();
    } else {
        alert('Registration Failed: ' + (data.message || 'Unknown error'));
    }
}

// --- Dashboard Functions ---

async function loadDashboard() {
    const student = JSON.parse(sessionStorage.getItem('student'));
    if (!student) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/student/${student.id}`);
        const data = await res.json();

        if(data.error) {
            alert(data.message);
            return;
        }

        // Populate Text Data
        document.getElementById('student-name').innerText = data.name;
        document.getElementById('student-course').innerText = data.course;
        document.getElementById('avg-score').innerText = data.yourAvg + '%';
        document.getElementById('class-avg').innerText = data.classAvg + '%';

        // Render Graph
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
                datasets: [{
                    label: 'Your Marks',
                    data: data.marks,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

function logout() {
    sessionStorage.removeItem('student');
    window.location.href = 'index.html';
}

function showSignup() { document.getElementById('login-box').style.display = 'none'; document.getElementById('signup-box').style.display = 'block'; }
function showLogin() { document.getElementById('login-box').style.display = 'block'; document.getElementById('signup-box').style.display = 'none'; }