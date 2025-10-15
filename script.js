// ===== Configuración (DEMO sin backend) =====
const ADMIN_EMAIL = 'xavy8a02@gmail.com';
const ADMIN_DEFAULT_PASSWORD = 'admin1243';
const LS_USERS = 'proyectaUsers';
const LS_CURRENT = 'proyectaCurrentUser';
const LS_THEME = 'proyectaTheme';
const SESSION_MAX_HOURS = 24; // expira sesión tras 24h (demo)

let currentUser = null;
let users = JSON.parse(localStorage.getItem(LS_USERS)) || [];

// ===== Utilidades =====
function saveUsers(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }
function sanitizeText(s){ return String(s||'').replace(/[<>]/g,''); }
function getUserByEmail(email){ return users.find(u => u.email === email); }
function nowISO(){ return new Date().toISOString(); }

function setCurrentUser(u){
  currentUser = u;
  if(u){
    const session = { email: u.email, at: Date.now() };
    localStorage.setItem(LS_CURRENT, JSON.stringify(session));
    localStorage.setItem(`lastLogin_${u.id}`, nowISO());
  } else {
    localStorage.removeItem(LS_CURRENT);
  }
}

// ===== Inicialización admin único =====
function createAdminUserIfNotExists(){
  let admin = getUserByEmail(ADMIN_EMAIL);
  if(!admin){
    admin = {
      id: `admin_${Date.now()}`,
      name: 'Administrador',
      email: ADMIN_EMAIL,
      password: ADMIN_DEFAULT_PASSWORD, // DEMO: texto plano
      isAdmin: true,
      createdAt: nowISO()
    };
    users.push(admin);
    saveUsers();
  } else {
    admin.isAdmin = true;
    // elimina duplicados por email
    const seen = new Set();
    users = users.filter(u => (seen.has(u.email) ? false : seen.add(u.email)));
    saveUsers();
  }
}

// ===== Sesión =====
function checkUserSession(){
  const saved = localStorage.getItem(LS_CURRENT);
  if(saved){
    try{
      const parsed = JSON.parse(saved);
      const live = getUserByEmail(parsed.email);
      const ageHours = (Date.now() - (parsed.at||0)) / (1000*60*60);
      if(live && ageHours <= SESSION_MAX_HOURS){
        setCurrentUser(live);
      } else {
        setCurrentUser(null);
      }
    }catch{ setCurrentUser(null); }
  }
  updateUI();
}

// ===== UI =====
function isAdmin(){ return currentUser && currentUser.email === ADMIN_EMAIL && currentUser.isAdmin === true; }

function updateUI(){
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminBtn  = document.getElementById('adminBtn');

  if(currentUser){
    if(loginBtn) loginBtn.style.display = 'none';
    if(logoutBtn){
      logoutBtn.style.display = 'inline-block';
      logoutBtn.textContent = `Cerrar Sesión (${sanitizeText(currentUser.name)})`;
    }
    if(adminBtn){
      if(isAdmin()){
        adminBtn.style.display = 'inline-block';
        adminBtn.textContent = '👥 Panel Admin';
      } else adminBtn.style.display = 'none';
    }
  } else {
    if(loginBtn) loginBtn.style.display = 'inline-block';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(adminBtn) adminBtn.style.display = 'none';
  }
}

function showWelcomeMessage(){
  const hero = document.querySelector('.hero');
  if(!hero || !currentUser) return;
  const welcomeDiv = document.createElement('div');
  welcomeDiv.className = 'user-welcome show';
  welcomeDiv.textContent = isAdmin()
    ? `¡Bienvenido, ${sanitizeText(currentUser.name)}! 👑 Administrador`
    : `¡Bienvenido, ${sanitizeText(currentUser.name)}! 🎉`;
  hero.appendChild(welcomeDiv);
  setTimeout(() => { if(welcomeDiv.parentNode) welcomeDiv.parentNode.removeChild(welcomeDiv); }, 3000);
}

// ===== Modal Login =====
function toggleLoginModal(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  modal.style.display = 'block';
  showLoginForm();
  modal.classList.add('auto-opened');
}
function closeLoginModal(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('auto-opened');
  clearForms();
}
function showLoginForm(){
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  const ff = document.getElementById('forgotForm'); if(ff) ff.style.display='none';
  const rf = document.getElementById('resetForm'); if(rf) rf.style.display='none';
  const h2 = document.querySelector('#loginModal .modal-content h2');
  if(h2) h2.textContent = 'Iniciar Sesión';
}
function showRegisterForm(){
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  const ff = document.getElementById('forgotForm'); if(ff) ff.style.display='none';
  const rf = document.getElementById('resetForm'); if(rf) rf.style.display='none';
  const h2 = document.querySelector('#loginModal .modal-content h2');
  if(h2) h2.textContent = 'Registrarse';
}
function showForgotForm(){
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
  const rf = document.getElementById('resetForm'); if(rf) rf.style.display='none';
  document.getElementById('forgotForm').style.display = 'block';
  const h2 = document.querySelector('#loginModal .modal-content h2');
  if(h2) h2.textContent = 'Recuperar contraseña';
}
function showLoginView(){
  document.getElementById('forgotForm').style.display = 'none';
  const rf = document.getElementById('resetForm'); if(rf) rf.style.display='none';
  showLoginForm();
}
function clearForms(){
  const lf = document.getElementById('loginForm');
  const rf = document.getElementById('registerForm');
  const ff = document.getElementById('forgotForm');
  const rs = document.getElementById('resetForm');
  [lf, rf, ff, rs].forEach(f => { if(f && f.reset) f.reset(); });
  // limpia errores
  ['emailError','passwordError','regNameError','regEmailError','regPasswordError','regConfirmPasswordError','fpEmailError','fpResetError']
    .forEach(id => { const el = document.getElementById(id); if(el) el.textContent=''; });
}

// ===== Login =====
function handleLogin(event){
  event.preventDefault();
  const email = (document.getElementById('email')?.value || '').trim().toLowerCase();
  const password = document.getElementById('password')?.value || '';

  // Admin
  if(email === ADMIN_EMAIL){
    const admin = getUserByEmail(ADMIN_EMAIL);
    if(!admin){ alert('Admin no inicializado.'); return; }
    if(password !== admin.password){ document.getElementById('passwordError').textContent = 'Credenciales incorrectas para admin.'; return; }
    setCurrentUser(admin); updateUI(); document.getElementById('loginModal').classList.remove('auto-opened'); closeLoginModal(); showWelcomeMessage(); return;
  }

  // Usuario normal
  const user = getUserByEmail(email);
  if(!user){ document.getElementById('emailError').textContent = 'Usuario no encontrado.'; return; }
  if(user.email === ADMIN_EMAIL){ document.getElementById('emailError').textContent = 'Ese correo está reservado para el administrador.'; return; }
  if(password !== user.password){ document.getElementById('passwordError').textContent = 'Contraseña incorrecta.'; return; }

  setCurrentUser(user);
  updateUI();
  document.getElementById('loginModal').classList.remove('auto-opened');
  closeLoginModal();
  showWelcomeMessage();
}

// ===== Registro =====
function handleRegister(event){
  event.preventDefault();
  const name = sanitizeText(document.getElementById('regName')?.value || '');
  const email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('regPassword')?.value || '';
  const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

  if(!name || !email || !password){ alert('Completa todos los campos.'); return; }
  if(email === ADMIN_EMAIL){ document.getElementById('regEmailError').textContent = 'Ese correo está reservado para el administrador.'; return; }
  if(password !== confirmPassword){ document.getElementById('regConfirmPasswordError').textContent = 'Las contraseñas no coinciden.'; return; }
  if(password.length < 6){ document.getElementById('regPasswordError').textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
  if(getUserByEmail(email)){ document.getElementById('regEmailError').textContent = 'Ya existe una cuenta con este correo.'; return; }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password, // DEMO
    isAdmin: false,
    createdAt: nowISO()
  };
  users.push(newUser); saveUsers();
  setCurrentUser(newUser); updateUI();
  document.getElementById('loginModal').classList.remove('auto-opened');
  closeLoginModal(); showWelcomeMessage();
}

// ===== Logout =====
function logout(){ setCurrentUser(null); updateUI(); alert('Sesión cerrada correctamente.'); }

// ===== Recuperación de contraseña =====
function handleForgot(e){
  e.preventDefault();
  const email = (document.getElementById('fpEmail')?.value || '').trim().toLowerCase();
  const u = getUserByEmail(email);
  const err = document.getElementById('fpEmailError');
  if(!u){ if(err) err.textContent = 'No existe una cuenta con ese correo.'; return; }
  window.__resetTarget = email; // DEMO sin token
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('resetForm').style.display = 'block';
}
function handleReset(e){
  e.preventDefault();
  const email = window.__resetTarget;
  const u = getUserByEmail(email || '');
  const p1 = document.getElementById('fpNewPwd').value;
  const p2 = document.getElementById('fpNewPwd2').value;
  const err = document.getElementById('fpResetError');

  if(!u){ if(err) err.textContent = 'Sesión de recuperación no válida.'; return; }
  if(p1.length < 6){ if(err) err.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.'; return; }
  if(p1 !== p2){ if(err) err.textContent = 'Las contraseñas no coinciden.'; return; }
  if(p1 === u.password){ if(err) err.textContent = 'La nueva contraseña no puede ser igual a la anterior.'; return; }

  u.password = p1; saveUsers();
  if(currentUser && currentUser.email === u.email){ setCurrentUser(u); updateUI(); }
  window.__resetTarget = null;
  document.getElementById('resetForm').style.display = 'none';
  showLoginView();
  alert('Contraseña actualizada. Ahora puedes iniciar sesión.');
}

// ===== Panel de admin =====
function showAdminPanel(){
  if(!isAdmin()){ alert('❌ Acceso denegado. Solo el administrador puede acceder a este panel.'); return; }
  const modal = document.getElementById('adminModal');
  if(modal){ modal.style.display='block'; loadUsersData(); renderAdminTools(); }
}
function closeAdminPanel(){ const modal = document.getElementById('adminModal'); if(modal) modal.style.display='none'; }

function loadUsersData(){
  const totalUsers = users.length;
  const activeUsers = users.filter(user => {
    const lastLogin = localStorage.getItem(`lastLogin_${user.id}`);
    if(!lastLogin) return false;
    const daysSince = (Date.now() - new Date(lastLogin).getTime()) / (1000*60*60*24);
    return daysSince <= 30;
  }).length;

  const totalEl = document.getElementById('totalUsers');
  const activeEl = document.getElementById('activeUsers');
  if(totalEl) totalEl.textContent = totalUsers;
  if(activeEl) activeEl.textContent = activeUsers;

  const usersTable = document.getElementById('usersTable');
  if(!usersTable) return;

  if(users.length === 0){ usersTable.innerHTML = '<div class="no-users">No hay usuarios registrados aún</div>'; return; }

  let tableHTML = `
    <div class="user-row header">
      <div>Usuario</div>
      <div>Email</div>
      <div>Fecha de Registro</div>
      <div>Estado</div>
    </div>
  `;
  const sorted = [...users].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  sorted.forEach(u=>{
    const isActive = currentUser && currentUser.id === u.id;
    const isUserAdmin = u.email === ADMIN_EMAIL && u.isAdmin;
    const registrationDate = new Date(u.createdAt).toLocaleDateString('es-ES');
    tableHTML += `
      <div class="user-row">
        <div class="user-info">
          <div class="user-name">${sanitizeText(u.name)}${isUserAdmin ? ' 👑' : ''}</div>
        </div>
        <div class="user-email">${sanitizeText(u.email)}</div>
        <div class="user-date">${registrationDate}</div>
        <div class="user-status ${isActive ? 'active' : 'inactive'}">
          ${isActive ? 'Activo' : 'Inactivo'}${isUserAdmin ? ' (Admin)' : ''}
        </div>
      </div>
    `;
  });
  usersTable.innerHTML = tableHTML;
}

function exportUsers(){
  if(!isAdmin()){ alert('Solo el admin puede exportar usuarios.'); return; }
  if(users.length === 0){ alert('No hay usuarios para exportar'); return; }

  let csv = 'Nombre,Email,Fecha de Registro,Estado\n';
  users.forEach(u=>{
    const isActive = currentUser && currentUser.id === u.id;
    const registrationDate = new Date(u.createdAt).toLocaleDateString('es-ES');
    const status = isActive ? 'Activo' : 'Inactivo';
    csv += `"${u.name}","${u.email}","${registrationDate}","${status}"\n`;
  });
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `usuarios_proyecta_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert('Datos exportados exitosamente');
}

// Herramientas admin: cambio de contraseña admin
function renderAdminTools(){
  const panel = document.getElementById('adminTools');
  if(!panel) return;
  if(!isAdmin()){ panel.innerHTML=''; return; }
  panel.innerHTML = `
    <div class="card">
      <h3>Cambiar contraseña del admin</h3>
      <form id="adminChangePwdForm">
        <div class="form-group">
          <label for="adminOldPwd">Contraseña actual</label>
          <input type="password" id="adminOldPwd" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="adminNewPwd">Nueva contraseña</label>
          <input type="password" id="adminNewPwd" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="adminNewPwd2">Confirmar nueva contraseña</label>
          <input type="password" id="adminNewPwd2" required minlength="6" />
        </div>
        <button type="submit" class="btn-register">Actualizar contraseña</button>
      </form>
    </div>
  `;
  const form = document.getElementById('adminChangePwdForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!isAdmin()){ alert('No autorizado.'); return; }
    const admin = getUserByEmail(ADMIN_EMAIL); if(!admin){ alert('Admin no encontrado.'); return; }
    const oldPwd = document.getElementById('adminOldPwd').value;
    const newPwd = document.getElementById('adminNewPwd').value;
    const newPwd2 = document.getElementById('adminNewPwd2').value;

    if(oldPwd !== admin.password){ alert('La contraseña actual no es correcta.'); return; }
    if(newPwd.length < 6){ alert('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if(newPwd !== newPwd2){ alert('Las nuevas contraseñas no coinciden.'); return; }
    if(newPwd === admin.password){ alert('La nueva contraseña no puede ser igual a la anterior.'); return; }

    admin.password = newPwd; saveUsers();
    if(currentUser && currentUser.email === ADMIN_EMAIL){ setCurrentUser(admin); updateUI(); }
    alert('Contraseña actualizada correctamente.');
  });
}

// ===== Temas =====
function changeTheme(themeName){
  document.body.removeAttribute('data-theme');
  document.body.setAttribute('data-theme', themeName);
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.querySelector(`[data-theme="${themeName}"]`);
  if(btn) btn.classList.add('active');
  localStorage.setItem(LS_THEME, themeName);
}
function loadSavedTheme(){
  const saved = localStorage.getItem(LS_THEME) || 'default';
  changeTheme(saved);
}

// ===== Click fuera de modales =====
window.onclick = function(event){
  const loginModal = document.getElementById('loginModal');
  const adminModal = document.getElementById('adminModal');
  if(event.target === loginModal){
    if(loginModal.classList.contains('auto-opened') && !currentUser) return;
    closeLoginModal();
  }
  if(event.target === adminModal){ closeAdminPanel(); }
};

// ===== Mensaje original =====
function mostrarMensaje(){
  if(currentUser){ alert(`¡Hola ${sanitizeText(currentUser.name)}! 🎯 Tu test vocacional te está esperando. ¡Vamos a descubrir tu camino profesional!`); }
  else { alert("¡Inicia sesión para acceder a tu test vocacional personalizado! 🎯"); }
}

// ===== Inicio =====
document.addEventListener('DOMContentLoaded', function(){
  createAdminUserIfNotExists();
  checkUserSession();
  if(!currentUser){ setTimeout(()=>{ toggleLoginModal(); }, 500); }
  loadSavedTheme();
});

// Expone funciones para HTML
window.toggleLoginModal = toggleLoginModal;
window.closeLoginModal  = closeLoginModal;
window.showLoginForm    = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.showForgotForm   = showForgotForm;
window.showLoginView    = showLoginView;
window.handleLogin      = handleLogin;
window.handleRegister   = handleRegister;
window.handleForgot     = handleForgot;
window.handleReset      = handleReset;
window.logout           = logout;
window.showAdminPanel   = showAdminPanel;
window.closeAdminPanel  = closeAdminPanel;
window.exportUsers      = exportUsers;
window.changeTheme      = changeTheme;
window.mostrarMensaje   = mostrarMensaje;
