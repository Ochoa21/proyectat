// === User Management ===
let currentUser = null;
let users = JSON.parse(localStorage.getItem('proyectaUsers')) || [];

// Admin configuration - Change this email to your admin email
const ADMIN_EMAIL = 'danielvalencialoaiza1@gmail.com';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  createAdminUserIfNotExists();
  checkUserSession();
  if (!currentUser) {
    setTimeout(() => {
      showLoginModal();
    }, 500);
  }
});

// === Login Modal Functions ===
function toggleLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = 'block';
  showLoginForm();
  modal.classList.add('auto-opened');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = 'none';
  modal.classList.remove('auto-opened');
  clearForms();
}

function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.querySelector('.modal-content h2').textContent = 'Iniciar Sesión';
}

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.querySelector('.modal-content h2').textContent = 'Registrarse';
}

function clearForms() {
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
}

// === Login Functionality ===
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem('proyectaCurrentUser', JSON.stringify(user));
    updateUI();
    const modal = document.getElementById('loginModal');
    modal.classList.remove('auto-opened');
    closeLoginModal();
    showWelcomeMessage();
  } else {
    alert('Credenciales incorrectas. Inténtalo de nuevo.');
  }
}

// === Register Functionality ===
function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  if (users.find(u => u.email === email)) {
    alert('Ya existe una cuenta con este correo electrónico.');
    return;
  }
  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    password: password,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem('proyectaUsers', JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem('proyectaCurrentUser', JSON.stringify(newUser));
  updateUI();
  const modal = document.getElementById('loginModal');
  modal.classList.remove('auto-opened');
  closeLoginModal();
  showWelcomeMessage();
}

// === Logout Functionality ===
function logout() {
  currentUser = null;
  localStorage.removeItem('proyectaCurrentUser');
  updateUI();
  alert('Sesión cerrada correctamente.');
}

// === Session Management ===
function checkUserSession() {
  const savedUser = localStorage.getItem('proyectaCurrentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUI();
  }
}

function updateUI() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminBtn = document.getElementById('adminBtn');
  
  if (currentUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    logoutBtn.innerHTML = `Cerrar Sesión (${currentUser.name})`;
    
    // Only show admin button if user is admin
    if (isAdmin()) {
      adminBtn.style.display = 'inline-block';
      adminBtn.innerHTML = '👥 Panel Admin';
    } else {
      adminBtn.style.display = 'none';
    }
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    adminBtn.style.display = 'none';
  }
}

function showWelcomeMessage() {
  const hero = document.querySelector('.hero');
  const welcomeDiv = document.createElement('div');
  welcomeDiv.className = 'user-welcome show';
  
  if (isAdmin()) {
    welcomeDiv.innerHTML = `¡Bienvenido, ${currentUser.name}! 👑 Administrador`;
    welcomeDiv.style.background = 'linear-gradient(135deg, #ff6a00, #ffde59)';
  } else {
    welcomeDiv.innerHTML = `¡Bienvenido, ${currentUser.name}! 🎉`;
  }
  
  hero.appendChild(welcomeDiv);
  
  // Remove welcome message after 3 seconds
  setTimeout(() => {
    if (welcomeDiv.parentNode) {
      welcomeDiv.parentNode.removeChild(welcomeDiv);
    }
  }, 3000);
}

// === Close modal when clicking outside ===
window.onclick = function(event) {
  const loginModal = document.getElementById('loginModal');
  const adminModal = document.getElementById('adminModal');
  
  if (event.target === loginModal) {
    // Don't close if it's auto-opened and user is not logged in
    if (loginModal.classList.contains('auto-opened') && !currentUser) {
      return;
    }
    closeLoginModal();
  }
  
  if (event.target === adminModal) {
    closeAdminPanel();
  }
}

// === Admin Panel Functions ===
function showAdminPanel() {
  // Double check admin permissions
  if (!isAdmin()) {
    alert('❌ Acceso denegado. Solo los administradores pueden acceder a este panel.');
    return;
  }
  
  const modal = document.getElementById('adminModal');
  modal.style.display = 'block';
  loadUsersData();
}

function closeAdminPanel() {
  const modal = document.getElementById('adminModal');
  modal.style.display = 'none';
}

function loadUsersData() {
  // Update stats
  const totalUsers = users.length;
  const activeUsers = users.filter(user => {
    const lastLogin = localStorage.getItem(`lastLogin_${user.id}`);
    if (!lastLogin) return false;
    const daysSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLogin <= 30; // Active if logged in within last 30 days
  }).length;

  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('activeUsers').textContent = activeUsers;

  // Load users table
  const usersTable = document.getElementById('usersTable');
  
  if (users.length === 0) {
    usersTable.innerHTML = '<div class="no-users">No hay usuarios registrados aún</div>';
    return;
  }

  // Create table header
  let tableHTML = `
    <div class="user-row header">
      <div>Usuario</div>
      <div>Email</div>
      <div>Fecha de Registro</div>
      <div>Estado</div>
    </div>
  `;

  // Sort users by registration date (newest first)
  const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Add user rows
  sortedUsers.forEach(user => {
    const isActive = currentUser && currentUser.id === user.id;
    const isUserAdmin = user.email === ADMIN_EMAIL;
    const registrationDate = new Date(user.createdAt).toLocaleDateString('es-ES');
    
    tableHTML += `
      <div class="user-row">
        <div class="user-info">
          <div class="user-name">
            ${user.name}
            ${isUserAdmin ? ' 👑' : ''}
          </div>
        </div>
        <div class="user-email">${user.email}</div>
        <div class="user-date">${registrationDate}</div>
        <div class="user-status ${isActive ? 'active' : 'inactive'}">
          ${isActive ? 'Activo' : 'Inactivo'}
          ${isUserAdmin ? ' (Admin)' : ''}
        </div>
      </div>
    `;
  });

  usersTable.innerHTML = tableHTML;
}

function exportUsers() {
  if (users.length === 0) {
    alert('No hay usuarios para exportar');
    return;
  }

  // Create CSV content
  let csvContent = 'Nombre,Email,Fecha de Registro,Estado\n';
  
  users.forEach(user => {
    const isActive = currentUser && currentUser.id === user.id;
    const registrationDate = new Date(user.createdAt).toLocaleDateString('es-ES');
    const status = isActive ? 'Activo' : 'Inactivo';
    
    csvContent += `"${user.name}","${user.email}","${registrationDate}","${status}"\n`;
  });

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `usuarios_proyecta_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('Datos exportados exitosamente');
}


// === Theme Management ===
function changeTheme(themeName) {
  // Remove current theme class
  document.body.removeAttribute('data-theme');
  
  // Add new theme class
  document.body.setAttribute('data-theme', themeName);
  
  // Update active button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelector(`[data-theme="${themeName}"]`).classList.add('active');
  
  // Save theme preference
  localStorage.setItem('proyectaTheme', themeName);
  
  // Show theme change notification
  showThemeNotification(themeName);
}

function showThemeNotification(themeName) {
  const themeNames = {
    'default': '🌟 Clásico',
    'ocean': '🌊 Océano',
    'sunset': '🌅 Atardecer',
    'forest': '🌲 Bosque',
    'space': '🚀 Espacio',
    'neon': '💫 Neon'
  };
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'theme-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span>🎨 Tema cambiado a: ${themeNames[themeName]}</span>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: #fff;
    padding: 12px 20px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 1001;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Load saved theme on page load
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('proyectaTheme') || 'default';
  changeTheme(savedTheme);
}

// Initialize theme system
document.addEventListener('DOMContentLoaded', function() {
  loadSavedTheme();
});

// === Original function ===
function mostrarMensaje() {
  if (currentUser) {
    alert(`¡Hola ${currentUser.name}! 🎯 Tu test vocacional te está esperando. ¡Vamos a descubrir tu camino profesional!`);
  } else {
    alert("¡Inicia sesión para acceder a tu test vocacional personalizado! 🎯");
  }
}
