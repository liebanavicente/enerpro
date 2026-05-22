/* ENERPRO Portal del Empleado */

const SUPABASE_URL = 'https://rmiaxqbmmnbnxbmlnuny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtaWF4cWJtbW5ibnhibWxudW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTkyMTAsImV4cCI6MjA5NDY5NTIxMH0.oT256vpF6dgop0CAdy9MOAyGyoW3ZK2NAncQVk2tonU';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var currentUser = null;
var currentEmpleado = null;
var currentIsAdmin = false;
var allDocs = [];
var realtimeChannel = null;
var solicitudesChannel = null;
var vacacionesChannel  = null;

// LOGIN
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('loginPassword').addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });

async function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPassword').value;
  var err   = document.getElementById('loginError');
  err.style.display = 'none';
  var btn = document.getElementById('btnLogin');
  btn.textContent = 'Accediendo...'; btn.disabled = true;
  var { data, error } = await sb.auth.signInWithPassword({ email: email, password: pass });
  btn.textContent = 'Acceder al portal'; btn.disabled = false;
  if (error) { err.style.display = 'block'; return; }
  currentUser = data.user;
  var { data: emp } = await sb.from('empleados').select('*').eq('email', email).single();
  currentEmpleado = emp;
  currentIsAdmin = email.includes('admin') || (emp && emp.cargo === 'Coordinador');

  if (emp && emp.debe_cambiar_password) {
    document.getElementById('loginWrap').style.display = 'none';
    document.getElementById('cambioPassModal').style.display = 'flex';
    document.getElementById('cpNueva').focus();
    return;
  }
  iniciarApp();
}

function iniciarApp() {
  var emp    = currentEmpleado;
  var email  = currentUser ? currentUser.email : '';
  var isAdmin = currentIsAdmin;
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('cambioPassModal').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('userName').textContent = emp ? emp.nombre : email;
  document.getElementById('userAvatar').textContent = emp ? emp.nombre.charAt(0).toUpperCase() : '?';
  var mobileUser = document.getElementById('mobileUserName');
  if (mobileUser) mobileUser.textContent = emp ? emp.nombre.split(' ')[0] : email.split('@')[0];
  document.getElementById('welcomeMsg').textContent = 'Bienvenido, ' + (emp ? emp.nombre.split(' ')[0] : 'empleado');
  document.getElementById('welcomeSub').textContent = emp ? emp.cargo + ' · Mayo 2026' : 'Mayo 2026';
  var formEmp = document.getElementById('formEmpleado');
  if (formEmp) formEmp.value = emp ? emp.nombre : email;
  if (isAdmin) {
    document.getElementById('sidebarRole').textContent = 'Administrador';
    document.getElementById('userRoleLabel').textContent = 'Administrador';
    document.querySelectorAll('.admin-only, .admin-only-mobile').forEach(function(el){ el.style.display='flex'; });
    cargarEmpleados();
  }
  cargarDocumentos();
  pedirPermisoNotificaciones();
  suscribirDocumentosNuevos();
  suscribirSolicitudesEmpleado();
  suscribirVacacionesEmpleado();
}

async function confirmarCambioPassword() {
  var nueva    = document.getElementById('cpNueva').value;
  var confirma = document.getElementById('cpConfirma').value;
  var err = document.getElementById('cpError');
  var btn = document.getElementById('cpBtn');
  err.style.display = 'none';
  if (nueva.length < 8) {
    err.style.display = 'block'; err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return;
  }
  if (nueva !== confirma) {
    err.style.display = 'block'; err.textContent = 'Las contraseñas no coinciden.'; return;
  }
  btn.disabled = true; btn.textContent = 'Guardando...';
  var { error: updErr } = await sb.auth.updateUser({ password: nueva });
  if (updErr) {
    err.style.display = 'block'; err.textContent = 'Error: ' + updErr.message;
    btn.disabled = false; btn.textContent = 'Cambiar contraseña y acceder';
    return;
  }
  if (currentEmpleado) {
    await sb.from('empleados').update({ debe_cambiar_password: false }).eq('id', currentEmpleado.id);
    currentEmpleado.debe_cambiar_password = false;
  }
  btn.textContent = '✓ Contraseña actualizada';
  setTimeout(function() {
    btn.disabled = false;
    btn.textContent = 'Cambiar contraseña y acceder';
    document.getElementById('cpNueva').value = '';
    document.getElementById('cpConfirma').value = '';
    iniciarApp();
  }, 900);
}

// NAVEGACIÓN
function navigateToPage(page) {
  if (!page) return;
  document.querySelectorAll('.nav-item').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-page') === page);
  });
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  if (page === 'calendario') cargarCalendario();
  if (page === 'vacaciones') cargarVacaciones();
  if (page === 'solicitudes') cargarMisSolicitudes();
}

document.querySelectorAll('.nav-item').forEach(function(btn){
  btn.addEventListener('click', function(){ navigateToPage(this.getAttribute('data-page')); });
});

function navTo(page) { navigateToPage(page); }

// LOGOUT
async function doLogout() {
  if (realtimeChannel)    { sb.removeChannel(realtimeChannel);    realtimeChannel    = null; }
  if (solicitudesChannel) { sb.removeChannel(solicitudesChannel); solicitudesChannel = null; }
  if (vacacionesChannel)  { sb.removeChannel(vacacionesChannel);  vacacionesChannel  = null; }
  await sb.auth.signOut();
  currentUser = null; currentEmpleado = null; currentIsAdmin = false; allDocs = [];
  document.getElementById('app').style.display = 'none';
  document.getElementById('cambioPassModal').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('cpNueva').value = '';
  document.getElementById('cpConfirma').value = '';
  document.getElementById('cpError').style.display = 'none';
  document.querySelectorAll('.admin-only, .admin-only-mobile').forEach(function(el){ el.style.display='none'; });
  navigateToPage('inicio');
}

document.getElementById('btnLogout').addEventListener('click', doLogout);
var btnLogoutMobile = document.getElementById('btnLogoutMobile');
if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', doLogout);

// DOCUMENTOS
async function cargarDocumentos() {
  var query = sb.from('documentos').select('*').order('fecha', { ascending: false });
  if (currentEmpleado) query = query.eq('empleado_id', currentEmpleado.id);
  var { data, error } = await query;
  if (error || !data) { allDocs = []; return; }
  allDocs = data;
  document.getElementById('statDocs').textContent = data.length;
  document.getElementById('statUnread').textContent = data.filter(function(d){ return !d.leido; }).length;
  renderDocs(data, 'recentDocs', 3);
  renderDocs(data, 'docsList');
  var cuadrante = data.find(function(d){ return d.tipo === 'cuadrante'; });
  var cuadranteDiv = document.getElementById('cuadranteDestacado');
  var cuadranteMes = document.getElementById('cuadranteMes');
  if (cuadrante) {
    if (cuadranteMes) cuadranteMes.textContent = cuadrante.fecha || 'Actual';
    var cSafeName = cuadrante.nombre.replace(/'/g, "\\'");
    var cSafeUrl  = cuadrante.url.replace(/'/g, "\\'");
    var cFirmaHtml = '';
    if (cuadrante.firmado) {
      var cFecha = cuadrante.fecha_firma
        ? new Date(cuadrante.fecha_firma).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })
        : '';
      cFirmaHtml = '<span class="badge badge-green">✓ Firmado' + (cFecha ? ' el ' + cFecha : '') + '</span>';
    } else {
      cFirmaHtml = '<button class="btn-sm" style="border-color:rgba(245,184,0,0.45);color:var(--gold)" ' +
        'onclick="firmarDoc(\'' + cuadrante.id + '\', \'' + cSafeName + '\')">✍ Confirmar lectura</button>';
    }
    if (cuadranteDiv) cuadranteDiv.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">' +
      '<div style="display:flex;align-items:center;gap:1rem">' +
      '<div style="width:48px;height:48px;background:var(--red-light);border:1px solid rgba(220,38,38,0.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📅</div>' +
      '<div><div style="font-size:1rem;font-weight:600;color:var(--white)">' + cuadrante.nombre + '</div>' +
      '<div style="font-size:0.8rem;color:var(--muted);margin-top:2px">' + (cuadrante.fecha||'') + ' · Cuadrante de servicio</div></div></div>' +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">' +
      '<button class="btn-sm primary" onclick="verDoc(\'' + cSafeUrl + '\', \'' + cSafeName + '\')">👁 Ver cuadrante</button>' +
      '<button class="btn-sm" onclick="descargarDoc(\'' + cuadrante.id + '\', \'' + cSafeUrl + '\', \'' + cSafeName + '\')">⬇ Descargar</button>' +
      cFirmaHtml +
      '</div></div>';
  } else {
    if (cuadranteMes) cuadranteMes.style.display = 'none';
    if (cuadranteDiv) cuadranteDiv.innerHTML = '<div style="color:var(--muted);font-size:0.875rem">No hay cuadrante disponible.</div>';
  }
}

function renderDocs(docs, containerId, limit) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var list = limit ? docs.slice(0, limit) : docs;
  if (!list.length) { container.innerHTML = '<div class="empty">No hay documentos disponibles</div>'; return; }
  container.innerHTML = list.map(function(doc) {
    var icon = doc.tipo === 'nomina' ? '📄' : doc.tipo === 'cuadrante' ? '📅' : doc.tipo === 'contrato' ? '📋' : '📁';
    var safeName = doc.nombre.replace(/'/g, "\\'");
    var safeUrl  = doc.url.replace(/'/g, "\\'");
    var badgeNuevo  = doc.leido ? '' : '<span class="badge badge-red" style="margin-left:0.5rem">Nuevo</span>';
    var badgeFirma  = '';
    var btnFirma    = '';
    if (doc.firmado) {
      var fFecha = doc.fecha_firma
        ? new Date(doc.fecha_firma).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })
        : '';
      badgeFirma = '<span class="badge badge-green" style="margin-left:0.5rem">✓ Firmado' + (fFecha ? ' ' + fFecha : '') + '</span>';
    } else {
      btnFirma = '<button class="btn-sm" style="border-color:rgba(245,184,0,0.45);color:var(--gold)" ' +
        'onclick="firmarDoc(\'' + doc.id + '\', \'' + safeName + '\')">✍ Firmar</button>';
    }
    return '<div class="doc-item">' +
      '<div class="doc-info"><div class="doc-icon">' + icon + '</div>' +
      '<div><div class="doc-name">' + doc.nombre + badgeNuevo + badgeFirma + '</div>' +
      '<div class="doc-meta">' + (doc.fecha||'') + ' · ' + doc.tipo + '</div></div></div>' +
      '<div>' +
      '<button class="btn-sm primary" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')">👁 Ver</button>' +
      '<button class="btn-sm" onclick="descargarDoc(\'' + doc.id + '\', \'' + safeUrl + '\', \'' + safeName + '\')">⬇ Descargar</button>' +
      btnFirma +
      '<button class="btn-sm" style="border-color:#dc2626;color:#dc2626" onclick="eliminarDoc(\'' + doc.id + '\', \'' + safeUrl + '\')">✕</button>' +
      '</div></div>';
  }).join('');
}

function filterDocs(tipo) {
  var filtered = tipo === 'todos' ? allDocs : allDocs.filter(function(d){ return d.tipo === tipo; });
  renderDocs(filtered, 'docsList');
}

async function eliminarDoc(docId, url) {
  if (!confirm('¿Eliminar este documento?')) return;
  await sb.storage.from('documentos').remove([url]);
  await sb.from('documentos').delete().eq('id', docId);
  cargarDocumentos();
}

async function descargarDoc(docId, url, nombre) {
  await sb.from('documentos').update({ leido: true }).eq('id', docId);
  var { data, error } = await sb.storage.from('documentos').download(url);
  if (error) { alert('Error al descargar.'); return; }
  var link = document.createElement('a');
  link.href = URL.createObjectURL(data);
  link.download = nombre + '.pdf';
  link.click();
  cargarDocumentos();
}

// VISOR PDF
async function verDoc(url, nombre) {
  var modal = document.getElementById('pdfModal');
  var frame = document.getElementById('pdfFrame');
  var title = document.getElementById('pdfModalTitle');
  var link  = document.getElementById('pdfOpenLink');
  title.textContent = nombre || 'Documento';
  frame.src = '';
  if (link) link.href = '#';
  modal.style.display = 'flex';

  var { data, error } = await sb.storage.from('documentos').createSignedUrl(url, 3600);
  if (error || !data) {
    frame.style.display = 'none';
    modal.querySelector('.pdf-header').insertAdjacentHTML('afterend',
      '<div class="pdf-fallback"><span>No se pudo cargar el documento.</span>' +
      '<button class="btn-sm" onclick="cerrarVisor()">Cerrar</button></div>');
    return;
  }
  frame.style.display = 'block';
  frame.src = data.signedUrl;
  if (link) link.href = data.signedUrl;
}

function cerrarVisor() {
  var modal = document.getElementById('pdfModal');
  var frame = document.getElementById('pdfFrame');
  modal.style.display = 'none';
  frame.src = '';
  var fallback = modal.querySelector('.pdf-fallback');
  if (fallback) fallback.remove();
}

document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cerrarVisor(); });
document.addEventListener('click', function(e){
  if (e.target && e.target.id === 'pdfModal') cerrarVisor();
});

// SOLICITUDES - EMPLEADO
var solicitudForm = document.getElementById('solicitudForm');
if (solicitudForm) {
  solicitudForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var ok  = document.getElementById('solicitudOk');
    var err = document.getElementById('solicitudError');
    if (ok) ok.style.display = 'none';
    if (err) err.style.display = 'none';
    if (!currentEmpleado) {
      if (err) { err.style.display = 'block'; err.textContent = 'No se ha podido identificar al empleado.'; }
      return;
    }
    var tipo   = this.querySelector('[name="tipo"]').value;
    var fechas = this.querySelector('[name="fechas"]').value.trim();
    var motivo = this.querySelector('[name="motivo"]').value.trim();
    var { error } = await sb.from('solicitudes').insert({
      empleado_id: currentEmpleado.id, tipo: tipo, fechas: fechas, motivo: motivo, estado: 'pendiente'
    });
    if (error) {
      if (err) { err.style.display = 'block'; err.textContent = 'Error: ' + error.message; }
      return;
    }
    if (ok) { ok.style.display = 'block'; ok.textContent = '✓ Solicitud enviada correctamente.'; }
    this.reset();
    cargarMisSolicitudes();
  });
}

// MIS SOLICITUDES (empleado)
async function cargarMisSolicitudes() {
  var container = document.getElementById('misSolicitudesList');
  if (!container || !currentEmpleado) return;
  container.innerHTML = '<div class="loading">Cargando...</div>';
  var { data } = await sb.from('solicitudes').select('*')
    .eq('empleado_id', currentEmpleado.id)
    .order('created_at', { ascending: false });
  if (!data || !data.length) {
    container.innerHTML = '<div class="empty" style="border:none;padding:2rem">Aún no has enviado solicitudes</div>';
    return;
  }
  var TIPO_SOL = {
    'Solicitud de vacaciones':'Vacaciones', 'Solicitud de permiso':'Permiso',
    'Cambio de turno':'Cambio turno', 'Baja médica':'Baja médica', 'Consulta general':'Consulta'
  };
  container.innerHTML = data.map(function(s) {
    var bc    = s.estado === 'aprobada' ? 'badge-green' : s.estado === 'rechazada' ? 'badge-red' : 'badge-yellow';
    var fecha = new Date(s.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    var tipoLbl = TIPO_SOL[s.tipo] || s.tipo;
    return '<div class="vac-item">' +
      '<span class="badge badge-blue vac-tipo" style="min-width:6rem;justify-content:center">' + tipoLbl + '</span>' +
      '<span class="vac-fechas">' + (s.fechas || '—') +
        (s.motivo ? '<br><span style="font-size:0.72rem;color:var(--muted)">' + s.motivo + '</span>' : '') + '</span>' +
      '<span class="vac-dias" style="min-width:5.5rem;font-size:0.75rem;color:var(--muted)">' + fecha + '</span>' +
      '<span class="badge ' + bc + '">' + s.estado + '</span>' +
      '</div>';
  }).join('');
}

// SOLICITUDES - ADMIN
async function cargarSolicitudesAdmin() {
  var container = document.getElementById('solicitudesAdminList');
  if (!container) return;
  container.innerHTML = '<div class="loading">Cargando...</div>';
  var { data, error } = await sb.from('solicitudes').select('*, empleados(nombre)').order('created_at', { ascending: false });
  if (error || !data || !data.length) {
    container.innerHTML = '<div class="empty">No hay solicitudes</div>';
    return;
  }
  container.innerHTML = data.map(function(s) {
    var bc = s.estado === 'aprobada' ? 'badge-green' : s.estado === 'rechazada' ? 'badge-red' : 'badge-yellow';
    return '<div class="doc-item">' +
      '<div class="doc-info"><div class="doc-icon">📋</div>' +
      '<div><div class="doc-name">' + (s.empleados ? s.empleados.nombre : 'Empleado') + ' — ' + s.tipo + '</div>' +
      '<div class="doc-meta">' + (s.fechas||'') + (s.motivo ? ' · ' + s.motivo : '') + '</div>' +
      '<div class="doc-meta">' + new Date(s.created_at).toLocaleDateString('es-ES') + '</div>' +
      '</div></div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center">' +
      '<span class="badge ' + bc + '">' + s.estado + '</span>' +
      (s.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="gestionarSolicitud(\'' + s.id + '\',\'aprobada\')">Aprobar</button>' +
        '<button class="btn-sm" style="border-color:#dc2626;color:#dc2626" onclick="gestionarSolicitud(\'' + s.id + '\',\'rechazada\')">Rechazar</button>'
        : '') +
      '</div></div>';
  }).join('');
}

async function gestionarSolicitud(id, estado) {
  await sb.from('solicitudes').update({ estado: estado }).eq('id', id);
  cargarSolicitudesAdmin();
}

// TABS ADMIN
function switchTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.admin-tab-content').forEach(function(t){ t.style.display='none'; });
  if (el) el.classList.add('active');
  var tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.style.display = 'block';
  if (tab === 'subir' || tab === 'masivo' || tab === 'turnos-admin' || tab === 'importar') cargarEmpleados();
  if (tab === 'solicitudes-admin')  cargarSolicitudesAdmin();
  if (tab === 'vacaciones-admin')   cargarVacacionesAdmin();
  if (tab === 'turnos-admin') cargarTurnosAdmin();
}

// ADMIN - EMPLEADOS
async function cargarEmpleados() {
  var { data } = await sb.from('empleados').select('*').order('nombre');
  if (!data) return;
  ['subirEmpleado','turnoEmpleado'].forEach(function(selId) {
    var sel = document.getElementById(selId);
    if (sel) {
      sel.innerHTML = '<option value="">Selecciona empleado...</option>';
      data.forEach(function(e){ sel.innerHTML += '<option value="' + e.id + '">' + e.nombre + ' — ' + e.cargo + '</option>'; });
    }
  });
  var container = document.getElementById('empleadosList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty">No hay empleados</div>'; return; }
  container.innerHTML = '<table><thead><tr><th>Nombre</th><th>Email</th><th>Cargo</th><th>Estado</th></tr></thead><tbody>' +
    data.map(function(e){
      return '<tr><td>' + e.nombre + '</td><td style="color:var(--muted)">' + e.email + '</td><td>' + e.cargo + '</td>' +
        '<td><span class="badge ' + (e.activo ? 'badge-green">Activo' : 'badge-red">Inactivo') + '</span></td></tr>';
    }).join('') + '</tbody></table>';
}

function showAddEmpleado() { document.getElementById('addEmpleadoForm').style.display = 'block'; }
function hideAddEmpleado() { document.getElementById('addEmpleadoForm').style.display = 'none'; }

async function crearEmpleado() {
  var nombre = document.getElementById('empNombre').value.trim();
  var email  = document.getElementById('empEmail').value.trim();
  var dni    = document.getElementById('empDni').value.trim();
  var cargo  = document.getElementById('empCargo').value;
  var pass   = document.getElementById('empPassword').value;
  var ok  = document.getElementById('empleadoOk');
  var err = document.getElementById('empleadoError');
  ok.style.display = 'none'; err.style.display = 'none';
  if (!nombre || !email || !dni || !pass) { err.style.display='block'; err.textContent='Rellena todos los campos.'; return; }
  if (pass.length < 6) { err.style.display='block'; err.textContent='La contraseña debe tener mínimo 6 caracteres.'; return; }

  // Guardar sesión del admin antes de signUp (signUp puede crear nueva sesión si el proyecto tiene email confirm desactivado)
  var { data: sessionData } = await sb.auth.getSession();
  var adminSession = sessionData && sessionData.session;

  // Crear usuario en Supabase Auth
  var { data: authData, error: authError } = await sb.auth.signUp({ email: email, password: pass });

  // Restaurar sesión del admin si signUp la reemplazó
  if (adminSession && authData && authData.session) {
    await sb.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
  }

  var authMsg = '';
  if (authError) {
    var msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      authMsg = ' (el email ya tenía cuenta de acceso)';
    } else {
      err.style.display='block'; err.textContent='Error al crear acceso: '+authError.message; return;
    }
  } else if (authData && !authData.session) {
    authMsg = ' · Se envió email de confirmación al empleado.';
  }

  // Insertar en tabla empleados
  var { error: dbError } = await sb.from('empleados').insert({ nombre:nombre, email:email, dni:dni, cargo:cargo, activo:true, debe_cambiar_password:true });
  if (dbError) { err.style.display='block'; err.textContent='Error en BD: '+dbError.message; return; }

  ok.style.display='block'; ok.textContent='✓ Empleado creado correctamente.' + authMsg;
  document.getElementById('empNombre').value='';
  document.getElementById('empEmail').value='';
  document.getElementById('empDni').value='';
  document.getElementById('empPassword').value='';
  cargarEmpleados();
}

// ADMIN - SUBIR DOCUMENTO
async function subirDocumento() {
  var empleadoId = document.getElementById('subirEmpleado').value;
  var tipo       = document.getElementById('subirTipo').value;
  var nombre     = document.getElementById('subirNombre').value.trim();
  var archivo    = document.getElementById('subirArchivo').files[0];
  var ok  = document.getElementById('subirOk');
  var err = document.getElementById('subirError');
  ok.style.display='none'; err.style.display='none';
  if (!empleadoId || !nombre || !archivo) { err.style.display='block'; err.textContent='Rellena todos los campos.'; return; }
  var fileName = empleadoId + '/' + Date.now() + '_' + archivo.name;
  var { error: storageError } = await sb.storage.from('documentos').upload(fileName, archivo);
  if (storageError) { err.style.display='block'; err.textContent='Error al subir: '+storageError.message; return; }
  var { error: dbError } = await sb.from('documentos').insert({
    empleado_id:empleadoId, nombre:nombre, tipo:tipo, url:fileName,
    fecha:new Date().toISOString().split('T')[0], leido:false
  });
  if (dbError) { err.style.display='block'; err.textContent='Error en BD: '+dbError.message; return; }
  ok.style.display='block'; ok.textContent='✓ Documento subido correctamente.';
  document.getElementById('subirNombre').value='';
  document.getElementById('subirArchivo').value='';
}

// ADMIN - SUBIDA MASIVA
async function subirMasivo() {
  var tipo    = document.getElementById('masivoTipo').value;
  var nombre  = document.getElementById('masivoNombre').value.trim();
  var archivoEl = document.getElementById('masivoArchivo');
  var archivo = archivoEl ? archivoEl.files[0] : null;
  var ok  = document.getElementById('masivoOk');
  var err = document.getElementById('masivoError');
  var progress = document.getElementById('masivoProgress');
  var progressText = document.getElementById('masivoProgressText');
  var progressBar  = document.getElementById('masivoProgressBar');
  ok.style.display='none'; err.style.display='none';
  if (!nombre || !archivo) { err.style.display='block'; err.textContent='Rellena todos los campos.'; return; }
  var { data: empleados } = await sb.from('empleados').select('*');
  if (!empleados || !empleados.length) { err.style.display='block'; err.textContent='No hay empleados.'; return; }
  var dniMap = {};
  empleados.forEach(function(e){ dniMap[e.dni.toUpperCase()] = e; });
  progress.style.display='block';
  try {
    var zip = await JSZip.loadAsync(archivo);
    var files = Object.keys(zip.files).filter(function(f){
      return !zip.files[f].dir && f.toLowerCase().endsWith('.pdf') && !f.startsWith('__MACOSX') && !f.startsWith('.');
    });
    if (!files.length) { err.style.display='block'; err.textContent='El ZIP no contiene PDFs.'; progress.style.display='none'; return; }
    var ok_count=0, fail_count=0;
    for (var i=0; i<files.length; i++) {
      var filename = files[i];
      var dni = filename.replace(/\.pdf$/i,'').split('/').pop().toUpperCase();
      var empleado = dniMap[dni];
      progressText.textContent = 'Procesando '+(i+1)+' de '+files.length+': '+filename;
      progressBar.style.width = Math.round(((i+1)/files.length)*100)+'%';
      if (!empleado) { fail_count++; continue; }
      var blob = await zip.files[filename].async('blob');
      var pdfFile = new File([blob], filename, { type:'application/pdf' });
      var storagePath = empleado.id+'/'+Date.now()+'_'+filename;
      var { error: se } = await sb.storage.from('documentos').upload(storagePath, pdfFile);
      if (se) { fail_count++; continue; }
      await sb.from('documentos').insert({
        empleado_id:empleado.id, nombre:nombre, tipo:tipo, url:storagePath,
        fecha:new Date().toISOString().split('T')[0], leido:false
      });
      ok_count++;
    }
    progress.style.display='none';
    ok.style.display='block';
    ok.textContent='✓ '+ok_count+' documentos subidos.'+(fail_count?' '+fail_count+' no encontrados.':'');
    document.getElementById('masivoNombre').value='';
    if (archivoEl) archivoEl.value='';
  } catch(e) {
    progress.style.display='none';
    err.style.display='block'; err.textContent='Error al procesar el ZIP: '+e.message;
  }
}

// SESIÓN
sb.auth.onAuthStateChange(function(event, session) {
  if (event === 'SIGNED_OUT') {
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginWrap').style.display = 'flex';
  }
});

// ─── VACACIONES ──────────────────────────────────────────

var VAC_TIPO_LABEL = { vacaciones:'Vacaciones', permiso:'Permiso', asuntos_propios:'Asuntos propios', baja_medica:'Baja médica' };
var VAC_TIPO_CLASS = { vacaciones:'badge-blue', permiso:'badge-yellow', asuntos_propios:'badge-yellow', baja_medica:'badge-red' };

function diasEntre(desde, hasta) {
  var d1 = new Date(desde + 'T12:00:00'), d2 = new Date(hasta + 'T12:00:00');
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

(function() {
  function actualizarDias() {
    var d = document.getElementById('vacDesde'), h = document.getElementById('vacHasta');
    if (!d || !h) return;
    if (d.value && h.value && h.value >= d.value) {
      document.getElementById('vacDias').textContent = diasEntre(d.value, h.value) + ' días';
      document.getElementById('vacDiasCont').style.display = 'block';
    } else {
      document.getElementById('vacDiasCont').style.display = 'none';
    }
  }
  document.addEventListener('change', function(e) {
    if (e.target.id === 'vacDesde' || e.target.id === 'vacHasta') actualizarDias();
  });
})();

async function solicitarVacaciones() {
  var tipo   = document.getElementById('vacTipo').value;
  var desde  = document.getElementById('vacDesde').value;
  var hasta  = document.getElementById('vacHasta').value;
  var notas  = document.getElementById('vacNotas').value.trim();
  var ok  = document.getElementById('vacOk');
  var err = document.getElementById('vacError');
  ok.style.display = 'none'; err.style.display = 'none';
  if (!desde || !hasta) { err.style.display='block'; err.textContent='Selecciona las fechas.'; return; }
  if (hasta < desde)    { err.style.display='block'; err.textContent='La fecha fin debe ser posterior al inicio.'; return; }
  if (!currentEmpleado) { err.style.display='block'; err.textContent='Sesión no identificada.'; return; }
  var payload = { empleado_id: currentEmpleado.id, tipo, fecha_inicio: desde, fecha_fin: hasta, estado: 'pendiente' };
  if (notas) payload.notas = notas;
  var { error } = await sb.from('vacaciones').insert(payload);
  if (error) { err.style.display='block'; err.textContent='Error: '+error.message; return; }
  ok.style.display='block'; ok.textContent='✓ Solicitud enviada. El coordinador la revisará en breve.';
  document.getElementById('vacDesde').value = '';
  document.getElementById('vacHasta').value = '';
  document.getElementById('vacNotas').value = '';
  document.getElementById('vacDiasCont').style.display = 'none';
  cargarVacaciones();
}

async function cargarVacaciones() {
  var lista = document.getElementById('vacLista');
  if (!lista || !currentEmpleado) return;
  lista.innerHTML = '<div class="loading">Cargando...</div>';
  var { data } = await sb.from('vacaciones').select('*')
    .eq('empleado_id', currentEmpleado.id).order('fecha_inicio', { ascending: false });

  // Contador de días
  var anoActual = new Date().getFullYear();
  var total     = currentEmpleado.dias_vacaciones_anuales || 22;
  var usados    = 0;
  if (data) {
    data.forEach(function(v) {
      if (v.estado === 'aprobada' && v.tipo === 'vacaciones') {
        var desdeAno = new Date(v.fecha_inicio + 'T12:00:00').getFullYear();
        if (desdeAno === anoActual) usados += diasEntre(v.fecha_inicio, v.fecha_fin);
      }
    });
  }
  var restantes = Math.max(0, total - usados);
  var resumen = document.getElementById('vacResumen');
  if (resumen) {
    document.getElementById('vacTotal').textContent     = total;
    document.getElementById('vacUsados').textContent    = usados;
    document.getElementById('vacRestantes').textContent = restantes;
    document.getElementById('vacAno').textContent       = anoActual;
    resumen.style.display = 'block';
  }

  if (!data || !data.length) { lista.innerHTML = '<div class="empty" style="border:none;padding:2rem">No tienes solicitudes</div>'; return; }
  lista.innerHTML = data.map(function(v) {
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var est    = v.estado === 'aprobada' ? 'badge-green' : v.estado === 'rechazada' ? 'badge-red' : 'badge-yellow';
    return '<div class="vac-item">' +
      '<span class="badge ' + (VAC_TIPO_CLASS[v.tipo]||'badge-blue') + ' vac-tipo">' + (VAC_TIPO_LABEL[v.tipo]||v.tipo) + '</span>' +
      '<span class="vac-fechas">' + desde + ' → ' + hasta + (v.notas ? '<br><span style="font-size:0.72rem">' + v.notas + '</span>' : '') + '</span>' +
      '<span class="vac-dias">' + dias + ' d.</span>' +
      '<span class="badge ' + est + '">' + v.estado + '</span>' +
      '</div>';
  }).join('');
}

async function cargarVacacionesAdmin() {
  var lista = document.getElementById('vacAdminLista');
  if (!lista) return;
  lista.innerHTML = '<div class="loading">Cargando...</div>';
  var filtro = document.getElementById('vacAdminFiltro').value;
  var q = sb.from('vacaciones').select('*, empleados(nombre)').order('fecha_inicio');
  if (filtro !== 'todas') q = q.eq('estado', filtro);
  var { data } = await q;
  if (!data || !data.length) { lista.innerHTML = '<div class="empty" style="border:none;padding:2rem">Sin solicitudes</div>'; return; }
  lista.innerHTML = data.map(function(v) {
    var nombre = v.empleados ? v.empleados.nombre : '—';
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var est    = v.estado === 'aprobada' ? 'badge-green' : v.estado === 'rechazada' ? 'badge-red' : 'badge-yellow';
    return '<div class="doc-item">' +
      '<div class="doc-info"><div class="doc-icon">🏖️</div>' +
      '<div><div class="doc-name">' + nombre + ' · <span style="color:var(--text2);font-weight:400">' + (VAC_TIPO_LABEL[v.tipo]||v.tipo) + '</span></div>' +
      '<div class="doc-meta">' + desde + ' → ' + hasta + ' (' + dias + ' días)' + (v.notas ? ' · ' + v.notas : '') + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
      '<span class="badge ' + est + '">' + v.estado + '</span>' +
      (v.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="gestionarVacacion(\'' + v.id + '\',\'aprobada\')">Aprobar</button>' +
        '<button class="btn-sm" style="color:var(--red);border-color:rgba(220,38,38,0.3)" onclick="gestionarVacacion(\'' + v.id + '\',\'rechazada\')">Rechazar</button>'
        : '') +
      '</div></div>';
  }).join('');
}

async function gestionarVacacion(id, estado) {
  await sb.from('vacaciones').update({ estado }).eq('id', id);
  cargarVacacionesAdmin();
}

// ─── IMPORTAR EXCEL ──────────────────────────────────────

var importarData = [];

var DEMO_EMPLEADOS = [
  { nombre:'Ana García Pérez',       email:'ana.garcia@enerpro.com',      dni:'11111111A', cargo:'Vigilante de seguridad' },
  { nombre:'Carlos Martínez López',  email:'carlos.martinez@enerpro.com', dni:'22222222B', cargo:'Vigilante de seguridad' },
  { nombre:'María López Fernández',  email:'maria.lopez@enerpro.com',     dni:'33333333C', cargo:'Auxiliar de servicio' },
  { nombre:'José Rodríguez García',  email:'jose.rodriguez@enerpro.com',  dni:'44444444D', cargo:'Vigilante de seguridad' },
  { nombre:'Laura Sánchez Ruiz',     email:'laura.sanchez@enerpro.com',   dni:'55555555E', cargo:'Coordinador' },
  { nombre:'Miguel Torres Moreno',   email:'miguel.torres@enerpro.com',   dni:'66666666F', cargo:'Vigilante de seguridad' },
  { nombre:'Elena Jiménez Castro',   email:'elena.jimenez@enerpro.com',   dni:'77777777G', cargo:'Auxiliar de servicio' },
  { nombre:'Pablo Moreno Díaz',      email:'pablo.moreno@enerpro.com',    dni:'88888888H', cargo:'Vigilante de seguridad' },
  { nombre:'Isabel Ruiz Herrera',    email:'isabel.ruiz@enerpro.com',     dni:'99999999I', cargo:'Administrativo' },
  { nombre:'Antonio Navarro Gil',    email:'antonio.navarro@enerpro.com', dni:'00000000J', cargo:'Vigilante de seguridad' }
];

document.addEventListener('DOMContentLoaded', function() {
  var inputExcel = document.getElementById('importarArchivo');
  if (inputExcel) inputExcel.addEventListener('change', previsualizarExcel);
  generarPlantilla();
});

function generarPlantilla() {
  var link = document.getElementById('importarPlantilla');
  if (!link || typeof XLSX === 'undefined') return;
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet([
    ['nombre', 'email', 'dni', 'cargo'],
    ['Ana García', 'ana@empresa.com', '12345678A', 'Vigilante de seguridad'],
    ['Carlos López', 'carlos@empresa.com', '87654321B', 'Auxiliar de servicio']
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
  var blob = new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/octet-stream' });
  link.href = URL.createObjectURL(blob);
}

function previsualizarExcel() {
  var file = document.getElementById('importarArchivo').files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb   = XLSX.read(e.target.result, { type:'array' });
      var ws   = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { defval:'' });

      importarData = rows.map(function(r) {
        var k = Object.keys(r).reduce(function(acc, key) { acc[key.toLowerCase().trim()] = r[key]; return acc; }, {});
        return {
          nombre: String(k['nombre'] || k['name'] || '').trim(),
          email:  String(k['email']  || k['correo'] || '').trim().toLowerCase(),
          dni:    String(k['dni']    || k['nif'] || '').trim().toUpperCase(),
          cargo:  String(k['cargo']  || k['puesto'] || 'Vigilante de seguridad').trim()
        };
      }).filter(function(r) { return r.nombre && r.email; });

      document.getElementById('importarCount').textContent = importarData.length;
      document.getElementById('importarTabla').innerHTML = importarData.slice(0,10).map(function(r) {
        return '<tr><td>' + r.nombre + '</td><td style="color:var(--text2)">' + r.email +
               '</td><td>' + r.dni + '</td><td>' + r.cargo + '</td></tr>';
      }).join('') + (importarData.length > 10 ? '<tr><td colspan="4" style="color:var(--muted);text-align:center">... y ' + (importarData.length - 10) + ' más</td></tr>' : '');
      document.getElementById('importarPreview').style.display = 'block';
    } catch(err) {
      var errEl = document.getElementById('importarError');
      errEl.style.display = 'block'; errEl.textContent = 'Error al leer el archivo: ' + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

async function confirmarImportacion() {
  if (!importarData.length) return;
  var ok  = document.getElementById('importarOk');
  var err = document.getElementById('importarError');
  var prog = document.getElementById('importarProgress');
  var progText = document.getElementById('importarProgressText');
  var progBar  = document.getElementById('importarProgressBar');
  ok.style.display = 'none'; err.style.display = 'none';
  prog.style.display = 'block';

  var okCount = 0, failCount = 0;
  for (var i = 0; i < importarData.length; i++) {
    progText.textContent = 'Importando ' + (i+1) + ' de ' + importarData.length + '…';
    progBar.style.width = Math.round(((i+1) / importarData.length) * 100) + '%';
    var { error } = await sb.from('empleados').insert({ ...importarData[i], activo: true });
    if (error) { failCount++; } else { okCount++; }
  }
  prog.style.display = 'none';
  ok.style.display = 'block';
  ok.textContent = '✓ ' + okCount + ' empleados importados.' + (failCount ? ' ' + failCount + ' fallaron (email/DNI duplicado).' : '');
  document.getElementById('importarPreview').style.display = 'none';
  document.getElementById('importarArchivo').value = '';
  importarData = [];
  cargarEmpleados();
}

async function cargarDemoEmpleados() {
  var ok  = document.getElementById('demoOk');
  var err = document.getElementById('demoError');
  ok.style.display = 'none'; err.style.display = 'none';
  var { error } = await sb.from('empleados').insert(
    DEMO_EMPLEADOS.map(function(e) { return { ...e, activo: true }; })
  );
  if (error) {
    err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return;
  }
  ok.style.display = 'block'; ok.textContent = '✓ 10 empleados demo insertados correctamente.';
  cargarEmpleados();
}

async function borrarDemoEmpleados() {
  if (!confirm('¿Eliminar todos los empleados demo?')) return;
  var emails = DEMO_EMPLEADOS.map(function(e) { return e.email; });
  var ok  = document.getElementById('demoOk');
  var err = document.getElementById('demoError');
  ok.style.display = 'none'; err.style.display = 'none';
  var { error } = await sb.from('empleados').delete().in('email', emails);
  if (error) { err.style.display='block'; err.textContent='Error: '+error.message; return; }
  ok.style.display = 'block'; ok.textContent = '✓ Empleados demo eliminados.';
  cargarEmpleados();
}

// ─── CALENDARIO ──────────────────────────────────────────

var calYear  = new Date().getFullYear();
var calMonth = new Date().getMonth();

var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var TIPO_LABEL = { manana:'Mañana', tarde:'Tarde', noche:'Noche', guardia:'Guardia', libre:'Libre', turno:'Turno' };

async function cargarCalendario() {
  var primerDia = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-01';
  var ultimoDia = new Date(calYear, calMonth + 1, 0);
  var ultimoDiaStr = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-' + String(ultimoDia.getDate()).padStart(2,'0');

  var q = sb.from('turnos').select('*').gte('fecha', primerDia).lte('fecha', ultimoDiaStr).order('fecha');
  if (currentEmpleado) q = q.eq('empleado_id', currentEmpleado.id);
  var { data } = await q;
  renderCalendario(data || []);
}

function renderCalendario(turnos) {
  document.getElementById('calMesLabel').textContent = MESES[calMonth] + ' ' + calYear;

  var grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Cabecera días
  ['L','M','X','J','V','S','D'].forEach(function(d) {
    var h = document.createElement('div');
    h.className = 'cal-day-hdr';
    h.textContent = d;
    grid.appendChild(h);
  });

  // Mapa fecha → turnos
  var mapa = {};
  turnos.forEach(function(t) {
    if (!mapa[t.fecha]) mapa[t.fecha] = [];
    mapa[t.fecha].push(t);
  });

  var primerDiaSemana = new Date(calYear, calMonth, 1).getDay();
  var offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
  var diasMes = new Date(calYear, calMonth + 1, 0).getDate();
  var diasMesAnt = new Date(calYear, calMonth, 0).getDate();
  var hoy = new Date();
  var totalCeldas = Math.ceil((offset + diasMes) / 7) * 7;

  for (var i = 0; i < totalCeldas; i++) {
    var cell = document.createElement('div');
    cell.className = 'cal-day';
    var num, dateStr, esOtroMes = false;

    if (i < offset) {
      num = diasMesAnt - offset + i + 1;
      esOtroMes = true;
      dateStr = new Date(calYear, calMonth - 1, num).toISOString().split('T')[0];
    } else if (i >= offset + diasMes) {
      num = i - offset - diasMes + 1;
      esOtroMes = true;
      dateStr = new Date(calYear, calMonth + 1, num).toISOString().split('T')[0];
    } else {
      num = i - offset + 1;
      dateStr = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-' + String(num).padStart(2,'0');
    }

    if (esOtroMes) cell.classList.add('other-m');
    if (!esOtroMes && hoy.getFullYear() === calYear && hoy.getMonth() === calMonth && hoy.getDate() === num) {
      cell.classList.add('today');
    }

    var numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = num;
    cell.appendChild(numEl);

    if (mapa[dateStr]) {
      cell.classList.add('has-shift');
      mapa[dateStr].forEach(function(t) {
        var pill = document.createElement('div');
        pill.className = 'cal-pill t-' + t.tipo;
        var txt = TIPO_LABEL[t.tipo] || t.tipo;
        if (t.hora_inicio) txt = t.hora_inicio.slice(0,5) + (t.hora_fin ? '–' + t.hora_fin.slice(0,5) : '');
        pill.textContent = txt;
        cell.appendChild(pill);
      });
    }
    grid.appendChild(cell);
  }

  // Resumen lista de turnos del mes
  var resumen = document.getElementById('calResumen');
  if (!turnos.length) {
    resumen.innerHTML = '<div class="empty">No hay turnos asignados este mes</div>';
    return;
  }
  resumen.innerHTML = '<div class="card" style="padding:0"><div style="padding:0.875rem 1.25rem;border-bottom:1px solid var(--border);font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted)">Detalle del mes</div>' +
    turnos.map(function(t) {
      var fecha = new Date(t.fecha + 'T12:00:00');
      var fechaStr = fecha.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
      var horas = t.hora_inicio ? t.hora_inicio.slice(0,5) + (t.hora_fin ? ' – ' + t.hora_fin.slice(0,5) : '') : '—';
      return '<div class="cal-resumen-item">' +
        '<span class="cal-pill t-' + t.tipo + '" style="min-width:4.5rem;text-align:center">' + (TIPO_LABEL[t.tipo] || t.tipo) + '</span>' +
        '<span class="cal-resumen-fecha">' + fechaStr + '</span>' +
        '<span class="cal-resumen-horas">' + horas + '</span>' +
        '<span class="cal-resumen-lugar">' + (t.ubicacion || '') + '</span>' +
        '</div>';
    }).join('') + '</div>';
}

function prevMes() {
  if (calMonth === 0) { calMonth = 11; calYear--; } else { calMonth--; }
  cargarCalendario();
}
function nextMes() {
  if (calMonth === 11) { calMonth = 0; calYear++; } else { calMonth++; }
  cargarCalendario();
}

// ─── TURNOS ADMIN ─────────────────────────────────────────

async function cargarTurnosAdmin() {
  var container = document.getElementById('turnosAdminList');
  if (!container) return;
  container.innerHTML = '<div class="loading">Cargando...</div>';
  var hoy = new Date().toISOString().split('T')[0];
  var { data } = await sb.from('turnos').select('*, empleados(nombre)')
    .gte('fecha', hoy).order('fecha').order('hora_inicio').limit(30);
  if (!data || !data.length) {
    container.innerHTML = '<div class="empty" style="border:none;padding:2rem">No hay turnos próximos</div>';
    return;
  }
  container.innerHTML = data.map(function(t) {
    var horas = t.hora_inicio ? t.hora_inicio.slice(0,5) + (t.hora_fin ? '–' + t.hora_fin.slice(0,5) : '') : '—';
    var fecha = new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
    return '<div class="doc-item">' +
      '<div class="doc-info">' +
      '<div class="doc-icon" style="font-size:1.1rem">📅</div>' +
      '<div><div class="doc-name">' + (t.empleados ? t.empleados.nombre : '—') + '</div>' +
      '<div class="doc-meta">' + fecha + ' · ' + horas + (t.ubicacion ? ' · ' + t.ubicacion : '') + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
      '<span class="cal-pill t-' + t.tipo + '">' + (TIPO_LABEL[t.tipo] || t.tipo) + '</span>' +
      '<button class="btn-sm" onclick="eliminarTurno(\'' + t.id + '\')" style="color:var(--red);border-color:rgba(220,38,38,0.3)">✕</button>' +
      '</div></div>';
  }).join('');
}

async function crearTurno() {
  var empId  = document.getElementById('turnoEmpleado').value;
  var fecha  = document.getElementById('turnoFecha').value;
  var tipo   = document.getElementById('turnoTipo').value;
  var inicio = document.getElementById('turnoInicio').value;
  var fin    = document.getElementById('turnoFin').value;
  var ubic   = document.getElementById('turnoUbicacion').value.trim();
  var notas  = document.getElementById('turnoNotas').value.trim();
  var ok  = document.getElementById('turnoOk');
  var err = document.getElementById('turnoError');
  ok.style.display = 'none'; err.style.display = 'none';
  if (!empId || !fecha) {
    err.style.display = 'block'; err.textContent = 'Selecciona empleado y fecha.'; return;
  }
  var payload = { empleado_id: empId, fecha: fecha, tipo: tipo };
  if (inicio) payload.hora_inicio = inicio;
  if (fin)    payload.hora_fin    = fin;
  if (ubic)   payload.ubicacion   = ubic;
  if (notas)  payload.notas       = notas;
  var { error } = await sb.from('turnos').insert(payload);
  if (error) { err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return; }
  ok.style.display = 'block';
  document.getElementById('turnoFecha').value = '';
  document.getElementById('turnoInicio').value = '';
  document.getElementById('turnoFin').value = '';
  document.getElementById('turnoUbicacion').value = '';
  document.getElementById('turnoNotas').value = '';
  cargarTurnosAdmin();
}

async function eliminarTurno(id) {
  if (!confirm('¿Eliminar este turno?')) return;
  await sb.from('turnos').delete().eq('id', id);
  cargarTurnosAdmin();
}

// FIRMA DE DOCUMENTOS
async function firmarDoc(docId, nombre) {
  if (!confirm('¿Confirmas que has leído "' + nombre + '"?\n\nEsta acción quedará registrada con la fecha y hora actual.')) return;
  var { error } = await sb.from('documentos').update({
    firmado: true,
    fecha_firma: new Date().toISOString(),
    leido: true
  }).eq('id', docId);
  if (error) { alert('Error al registrar la firma: ' + error.message); return; }
  cargarDocumentos();
  mostrarToast('✍ Lectura confirmada', nombre);
}

// NOTIFICACIONES
async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function mostrarToast(titulo, cuerpo) {
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    '<div class="toast-icon">📄</div>' +
    '<div><div class="toast-title">' + titulo + '</div>' +
    '<div class="toast-body">' + cuerpo + '</div></div>';
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('hide');
    setTimeout(function() { toast.remove(); }, 350);
  }, 5000);
}

function suscribirSolicitudesEmpleado() {
  if (!currentEmpleado) return;
  if (solicitudesChannel) { sb.removeChannel(solicitudesChannel); }
  solicitudesChannel = sb.channel('solicitudes-' + currentEmpleado.id)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'solicitudes',
      filter: 'empleado_id=eq.' + currentEmpleado.id
    }, function(payload) {
      var estado = payload.new.estado;
      if (estado !== 'aprobada' && estado !== 'rechazada') return;
      var tipo  = payload.new.tipo || 'Solicitud';
      var emoji = estado === 'aprobada' ? '✅' : '❌';
      var titulo = estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada';
      var cuerpo = tipo + ' ha sido ' + estado;
      mostrarToast(emoji + ' ' + titulo, cuerpo);
      if (Notification.permission === 'granted') {
        new Notification('ENERPRO — ' + titulo, {
          body: cuerpo,
          icon: 'enerprologo.jpg'
        });
      }
    })
    .subscribe();
}

function suscribirVacacionesEmpleado() {
  if (!currentEmpleado) return;
  if (vacacionesChannel) { sb.removeChannel(vacacionesChannel); }
  vacacionesChannel = sb.channel('vacaciones-' + currentEmpleado.id)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'vacaciones',
      filter: 'empleado_id=eq.' + currentEmpleado.id
    }, function(payload) {
      var estado = payload.new.estado;
      if (estado !== 'aprobada' && estado !== 'rechazada') return;
      var tipo   = VAC_TIPO_LABEL[payload.new.tipo] || 'Vacaciones';
      var emoji  = estado === 'aprobada' ? '✅' : '❌';
      var titulo = tipo + ' ' + estado;
      var desde  = payload.new.fecha_inicio, hasta = payload.new.fecha_fin;
      var cuerpo = desde + ' → ' + hasta + ' (' + diasEntre(desde, hasta) + ' días)';
      mostrarToast(emoji + ' ' + titulo, cuerpo);
      if (Notification.permission === 'granted') {
        new Notification('ENERPRO — ' + titulo, { body: cuerpo, icon: 'enerprologo.jpg' });
      }
      cargarVacaciones();
    })
    .subscribe();
}

function suscribirDocumentosNuevos() {
  if (!currentEmpleado) return;
  if (realtimeChannel) { sb.removeChannel(realtimeChannel); }
  realtimeChannel = sb.channel('docs-' + currentEmpleado.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'documentos',
      filter: 'empleado_id=eq.' + currentEmpleado.id
    }, function(payload) {
      var nombre = payload.new.nombre || 'Nuevo documento';
      var tipo   = payload.new.tipo   || '';
      mostrarToast('Nuevo documento recibido', nombre + (tipo ? ' · ' + tipo : ''));
      if (Notification.permission === 'granted') {
        new Notification('ENERPRO — Nuevo documento', {
          body: nombre + (tipo ? ' (' + tipo + ')' : ''),
          icon: 'enerprologo.jpg'
        });
      }
      cargarDocumentos();
    })
    .subscribe();
}
/* Fri May 22 14:49:42 CEST 2026 */
