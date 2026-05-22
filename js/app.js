/* ENERPRO Portal del Empleado */

const SUPABASE_URL = 'https://rmiaxqbmmnbnxbmlnuny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtaWF4cWJtbW5ibnhibWxudW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTkyMTAsImV4cCI6MjA5NDY5NTIxMH0.oT256vpF6dgop0CAdy9MOAyGyoW3ZK2NAncQVk2tonU';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var currentUser = null;
var currentEmpleado = null;
var currentIsAdmin = false;
var allDocs = [];
var allEmpleados = [];
var filtroCargoActivo = 'todos';
var filtroBuscadorActivo = '';
var realtimeChannel = null;
var solicitudesChannel = null;
var vacacionesChannel  = null;
var adminSolicitudesChannel = null;
var adminVacacionesChannel  = null;

// ─── UI HELPERS ──────────────────────────────────────────

function skelDocs(n) {
  var row =
    '<div class="skel-doc-row">' +
      '<div class="skel-left">' +
        '<span class="skel skel-icon"></span>' +
        '<div class="skel-text">' +
          '<span class="skel skel-line w70"></span>' +
          '<span class="skel skel-line w50"></span>' +
        '</div>' +
      '</div>' +
      '<div class="skel-btns">' +
        '<span class="skel skel-btn"></span>' +
        '<span class="skel skel-btn"></span>' +
      '</div>' +
    '</div>';
  var html = '';
  for (var i = 0; i < (n || 3); i++) html += row;
  return html;
}

function skelVacs(n) {
  var row =
    '<div class="skel-vac-row">' +
      '<span class="skel skel-badge"></span>' +
      '<div class="skel-mid">' +
        '<span class="skel skel-line w70"></span>' +
        '<span class="skel skel-line w50"></span>' +
      '</div>' +
      '<span class="skel skel-dias"></span>' +
      '<span class="skel skel-badge"></span>' +
    '</div>';
  var html = '';
  for (var i = 0; i < (n || 3); i++) html += row;
  return html;
}

function skelStatCards(n) {
  var card =
    '<div class="skel-stat-card">' +
      '<span class="skel skel-line w50" style="height:8px;margin-bottom:14px"></span>' +
      '<span class="skel skel-line w30" style="height:40px;margin-bottom:10px"></span>' +
      '<span class="skel skel-line w50" style="height:8px"></span>' +
    '</div>';
  var html = '';
  for (var i = 0; i < (n || 4); i++) html += card;
  return html;
}

function animateValue(el, to, ms) {
  if (!el || isNaN(to) || to === 0) { if (el) el.textContent = to; return; }
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min((ts - start) / ms, 1);
    var ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(ease * to);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

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
  var mesFmt = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  var mesLabel = mesFmt.charAt(0).toUpperCase() + mesFmt.slice(1);
  document.getElementById('welcomeSub').textContent = emp ? emp.cargo + ' · ' + mesLabel : mesLabel;
  var formEmp = document.getElementById('formEmpleado');
  if (formEmp) formEmp.value = emp ? emp.nombre : email;
  if (isAdmin) {
    document.getElementById('sidebarRole').textContent = 'Administrador';
    document.getElementById('userRoleLabel').textContent = 'Administrador';
    document.querySelectorAll('.admin-only, .admin-only-mobile').forEach(function(el){ el.style.display='flex'; });
    cargarEmpleados();
    cargarDashboard();
  }
  cargarDocumentos();
  pedirPermisoNotificaciones();
  suscribirDocumentosNuevos();
  suscribirSolicitudesEmpleado();
  suscribirVacacionesEmpleado();
  if (isAdmin) {
    suscribirSolicitudesAdmin();
    suscribirVacacionesAdmin();
  }
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
  if (realtimeChannel)         { sb.removeChannel(realtimeChannel);         realtimeChannel         = null; }
  if (solicitudesChannel)      { sb.removeChannel(solicitudesChannel);      solicitudesChannel      = null; }
  if (vacacionesChannel)       { sb.removeChannel(vacacionesChannel);       vacacionesChannel       = null; }
  if (adminSolicitudesChannel) { sb.removeChannel(adminSolicitudesChannel); adminSolicitudesChannel = null; }
  if (adminVacacionesChannel)  { sb.removeChannel(adminVacacionesChannel);  adminVacacionesChannel  = null; }
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
  var recentEl = document.getElementById('recentDocs');
  var docsEl   = document.getElementById('docsList');
  if (recentEl) recentEl.innerHTML = skelDocs(3);
  if (docsEl)   docsEl.innerHTML   = skelDocs(5);

  var query = sb.from('documentos').select('*').order('fecha', { ascending: false });
  if (currentEmpleado) query = query.eq('empleado_id', currentEmpleado.id);
  var { data, error } = await query;
  if (error || !data) { allDocs = []; return; }
  allDocs = data;

  animateValue(document.getElementById('statDocs'),   data.length, 700);
  animateValue(document.getElementById('statUnread'), data.filter(function(d){ return !d.leido; }).length, 700);
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
  if (!list.length) {
    container.innerHTML = '<div class="empty"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>No hay documentos disponibles</div>';
    return;
  }
  var delay = 0;
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
    var d = delay;
    delay += 50;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info"><div class="doc-icon">' + icon + '</div>' +
      '<div><div class="doc-name">' + doc.nombre + badgeNuevo + badgeFirma + '</div>' +
      '<div class="doc-meta">' + (doc.fecha||'') + ' · ' + doc.tipo + '</div></div></div>' +
      '<div>' +
      '<button class="btn-sm primary" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')">👁 Ver</button>' +
      '<button class="btn-sm" onclick="descargarDoc(\'' + doc.id + '\', \'' + safeUrl + '\', \'' + safeName + '\')">⬇ Descargar</button>' +
      btnFirma +
      (currentIsAdmin ? '<button class="btn-sm" style="border-color:#dc2626;color:#dc2626" onclick="eliminarDoc(\'' + doc.id + '\', \'' + safeUrl + '\')">✕</button>' : '') +
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
  container.innerHTML = skelVacs(4);
  var { data } = await sb.from('solicitudes').select('*')
    .eq('empleado_id', currentEmpleado.id)
    .order('created_at', { ascending: false });
  if (!data || !data.length) {
    container.innerHTML = '<div class="empty" style="border:none"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Aún no has enviado solicitudes</div>';
    return;
  }
  var TIPO_SOL = {
    'Solicitud de vacaciones':'Vacaciones', 'Solicitud de permiso':'Permiso',
    'Cambio de turno':'Cambio turno', 'Baja médica':'Baja médica', 'Consulta general':'Consulta'
  };
  var delay = 0;
  container.innerHTML = data.map(function(s) {
    var bc = s.estado === 'aprobada' ? 'badge-green'
           : s.estado === 'rechazada' ? 'badge-red'
           : s.estado === 'cancelada' ? 'badge-grey'
           : 'badge-yellow';
    var fecha   = new Date(s.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    var tipoLbl = TIPO_SOL[s.tipo] || s.tipo;
    var btnCancelar = s.estado === 'pendiente'
      ? '<button class="btn-sm" onclick="cancelarSolicitud(\'' + s.id + '\')" ' +
        'style="margin-left:0.5rem;color:var(--muted);border-color:rgba(255,255,255,0.1);font-size:0.68rem" ' +
        'title="Cancelar solicitud">✕ Cancelar</button>'
      : '';
    var d = delay; delay += 50;
    return '<div class="vac-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<span class="badge badge-blue vac-tipo" style="min-width:6rem;justify-content:center">' + tipoLbl + '</span>' +
      '<span class="vac-fechas">' + (s.fechas || '—') +
        (s.motivo    ? '<br><span style="font-size:0.72rem;color:var(--muted)">'  + s.motivo    + '</span>' : '') +
        (s.comentario ? '<br><span style="font-size:0.72rem;color:var(--gold)">💬 ' + s.comentario + '</span>' : '') + '</span>' +
      '<span class="vac-dias" style="min-width:5.5rem;font-size:0.75rem;color:var(--muted)">' + fecha + '</span>' +
      '<span class="badge ' + bc + '">' + s.estado + '</span>' +
      btnCancelar +
      '</div>';
  }).join('');
}

// SOLICITUDES - ADMIN
async function cargarSolicitudesAdmin() {
  var container = document.getElementById('solicitudesAdminList');
  if (!container) return;
  container.innerHTML = skelDocs(4);
  var { data, error } = await sb.from('solicitudes').select('*, empleados(nombre)').order('created_at', { ascending: false });
  if (error || !data || !data.length) {
    container.innerHTML = '<div class="empty"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>No hay solicitudes</div>';
    return;
  }
  var delay = 0;
  container.innerHTML = data.map(function(s) {
    var bc = s.estado === 'aprobada' ? 'badge-green'
           : s.estado === 'rechazada' ? 'badge-red'
           : s.estado === 'cancelada' ? 'badge-grey'
           : 'badge-yellow';
    var cmt = s.comentario ? '<div class="doc-meta" style="color:var(--gold);margin-top:3px">💬 ' + s.comentario + '</div>' : '';
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info"><div class="doc-icon">📋</div>' +
      '<div><div class="doc-name">' + (s.empleados ? s.empleados.nombre : 'Empleado') + ' — ' + s.tipo + '</div>' +
      '<div class="doc-meta">' + (s.fechas||'') + (s.motivo ? ' · ' + s.motivo : '') + '</div>' +
      '<div class="doc-meta">' + new Date(s.created_at).toLocaleDateString('es-ES') + '</div>' +
      cmt + '</div></div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center" id="sol-act-' + s.id + '">' +
      '<span class="badge ' + bc + '">' + s.estado + '</span>' +
      (s.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="mostrarAccionSolicitud(\'' + s.id + '\',\'aprobada\')">Aprobar</button>' +
        '<button class="btn-sm" style="border-color:#dc2626;color:#dc2626" onclick="mostrarAccionSolicitud(\'' + s.id + '\',\'rechazada\')">Rechazar</button>'
        : '') +
      '</div></div>';
  }).join('');
}

function mostrarAccionSolicitud(id, estado) {
  var el = document.getElementById('sol-act-' + id);
  if (!el) return;
  var esBuena = estado === 'aprobada';
  var col = esBuena ? 'var(--green)' : 'var(--red)';
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:0.4rem;min-width:200px;max-width:280px">' +
    '<textarea id="cmt-sol-' + id + '" rows="2" placeholder="Comentario para el empleado (opcional)..." ' +
    'style="width:100%;padding:0.45rem 0.7rem;background:var(--surface3);border:1px solid var(--border2);border-radius:var(--r-xs);color:var(--white);font-size:0.78rem;font-family:inherit;resize:none;outline:none"></textarea>' +
    '<div style="display:flex;gap:0.4rem">' +
    '<button class="btn-sm primary" style="background:' + col + ';border-color:' + col + '" ' +
    'onclick="confirmarSolicitud(\'' + id + '\',\'' + estado + '\')">' + (esBuena ? '✓ Aprobar' : '✕ Rechazar') + '</button>' +
    '<button class="btn-sm" onclick="cargarSolicitudesAdmin()">Cancelar</button>' +
    '</div></div>';
  el.querySelector('textarea').focus();
}

async function confirmarSolicitud(id, estado) {
  var cmt = document.getElementById('cmt-sol-' + id);
  var comentario = cmt ? cmt.value.trim() : '';
  var payload = { estado: estado };
  if (comentario) payload.comentario = comentario;
  await sb.from('solicitudes').update(payload).eq('id', id);
  cargarSolicitudesAdmin();
  if (document.getElementById('dashStats')) cargarDashboard();
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
  if (tab === 'dashboard') cargarDashboard();
  if (tab === 'subir' || tab === 'masivo' || tab === 'turnos-admin' || tab === 'importar') cargarEmpleados();
  if (tab !== 'empleados') {
    filtroBuscadorActivo = '';
    var buscador = document.getElementById('empBuscador');
    if (buscador) buscador.value = '';
  }
  if (tab === 'solicitudes-admin')  cargarSolicitudesAdmin();
  if (tab === 'vacaciones-admin')   cargarVacacionesAdmin();
  if (tab === 'turnos-admin') { cargarTurnosAdmin(); poblarMasivaEmpleados(); }
  if (tab === 'resumen-vac')        cargarResumenVacaciones();
}

// ADMIN - EMPLEADOS
async function cargarEmpleados() {
  var { data } = await sb.from('empleados').select('*').order('nombre');
  if (!data) return;
  allEmpleados = data;
  ['subirEmpleado','turnoEmpleado'].forEach(function(selId) {
    var sel = document.getElementById(selId);
    if (sel) {
      sel.innerHTML = '<option value="">Selecciona empleado...</option>';
      data.forEach(function(e){ sel.innerHTML += '<option value="' + e.id + '">' + e.nombre + ' — ' + e.cargo + '</option>'; });
    }
  });
  filtrarEmpleados(filtroCargoActivo);
}

function filtrarEmpleados(cargo, btn) {
  filtroCargoActivo = cargo;
  document.querySelectorAll('.emp-filter').forEach(function(b){ b.classList.remove('primary'); });
  if (btn) btn.classList.add('primary');
  else {
    var activo = document.querySelector('.emp-filter[onclick*="\'' + cargo + '\'"]');
    if (activo) activo.classList.add('primary');
  }
  aplicarFiltrosEmpleados();
}

function buscarEmpleados(q) {
  filtroBuscadorActivo = q.trim().toLowerCase();
  aplicarFiltrosEmpleados();
}

function aplicarFiltrosEmpleados() {
  var datos = filtroCargoActivo === 'todos'
    ? allEmpleados
    : allEmpleados.filter(function(e){ return e.cargo === filtroCargoActivo; });

  if (filtroBuscadorActivo) {
    var q = filtroBuscadorActivo;
    datos = datos.filter(function(e) {
      return (e.nombre  && e.nombre.toLowerCase().includes(q)) ||
             (e.email   && e.email.toLowerCase().includes(q))  ||
             (e.dni     && e.dni.toLowerCase().includes(q));
    });
  }
  renderEmpleadosTabla(datos);
}

function highlightMatch(text, q) {
  if (!q || !text) return text || '';
  var idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return text.slice(0, idx) +
    '<mark style="background:rgba(245,184,0,0.25);color:var(--gold);border-radius:2px;padding:0 1px">' +
    text.slice(idx, idx + q.length) + '</mark>' +
    text.slice(idx + q.length);
}

function renderEmpleadosTabla(data) {
  var container = document.getElementById('empleadosList');
  if (!container) return;
  if (!data.length) {
    var msg = filtroBuscadorActivo
      ? 'Sin resultados para "<strong style="color:var(--white)">' + filtroBuscadorActivo + '</strong>"'
      : 'No hay empleados con ese filtro';
    container.innerHTML = '<div class="empty" style="border:none;padding:2.5rem"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' + msg + '</div>';
    return;
  }
  var q = filtroBuscadorActivo;
  var hasFilter = data.length < allEmpleados.length;
  container.innerHTML =
    (hasFilter ? '<div style="padding:0.5rem 1.5rem;font-size:0.72rem;color:var(--muted);border-bottom:1px solid var(--border)">' + data.length + ' empleado' + (data.length !== 1 ? 's' : '') + ' encontrado' + (data.length !== 1 ? 's' : '') + '</div>' : '') +
    '<table><thead><tr><th>Nombre</th><th>Email</th><th>Cargo</th><th>Estado</th><th></th></tr></thead><tbody>' +
    data.map(function(e, i) {
      return '<tr style="animation:fadeIn 0.25s ease both;animation-delay:' + (i * 35) + 'ms">' +
        '<td><strong style="color:var(--white)">' + highlightMatch(e.nombre, q) + '</strong></td>' +
        '<td style="color:var(--text2)">' + highlightMatch(e.email, q) + '</td>' +
        '<td>' + e.cargo + '</td>' +
        '<td><span class="badge ' + (e.activo ? 'badge-green">Activo' : 'badge-red">Inactivo') + '</span></td>' +
        '<td><button class="btn-sm" onclick="abrirEditEmp(\'' + e.id + '\')" style="margin-left:0">✏ Editar</button></td>' +
        '</tr>';
    }).join('') + '</tbody></table>';
}

// ─── EDITAR EMPLEADO ──────────────────────────────────────

function abrirEditEmp(id) {
  var emp = allEmpleados.find(function(e){ return e.id === id; });
  if (!emp) return;
  document.getElementById('editEmpId').value      = emp.id;
  document.getElementById('editEmpTitle').textContent = emp.nombre;
  document.getElementById('editEmpNombre').value  = emp.nombre  || '';
  document.getElementById('editEmpEmail').value   = emp.email   || '';
  document.getElementById('editEmpDni').value     = emp.dni     || '';
  document.getElementById('editEmpDias').value    = emp.dias_vacaciones_anuales || 22;
  document.getElementById('editEmpActivo').value  = emp.activo ? 'true' : 'false';
  var cargoSel = document.getElementById('editEmpCargo');
  for (var i = 0; i < cargoSel.options.length; i++) {
    cargoSel.options[i].selected = cargoSel.options[i].value === emp.cargo;
  }
  document.getElementById('editEmpOk').style.display    = 'none';
  document.getElementById('editEmpError').style.display = 'none';
  var modal = document.getElementById('editEmpModal');
  modal.style.display = 'flex';
  setTimeout(function(){ document.getElementById('editEmpNombre').focus(); }, 80);
}

function cerrarEditEmp() {
  document.getElementById('editEmpModal').style.display = 'none';
}

async function guardarEmpleado() {
  var id      = document.getElementById('editEmpId').value;
  var nombre  = document.getElementById('editEmpNombre').value.trim();
  var email   = document.getElementById('editEmpEmail').value.trim();
  var dni     = document.getElementById('editEmpDni').value.trim();
  var cargo   = document.getElementById('editEmpCargo').value;
  var dias    = parseInt(document.getElementById('editEmpDias').value) || 22;
  var activo  = document.getElementById('editEmpActivo').value === 'true';
  var ok      = document.getElementById('editEmpOk');
  var err     = document.getElementById('editEmpError');
  var btn     = document.getElementById('editEmpBtn');
  ok.style.display = 'none'; err.style.display = 'none';
  if (!nombre || !email || !dni) {
    err.style.display = 'block'; err.textContent = 'Nombre, email y DNI son obligatorios.'; return;
  }
  btn.disabled = true; btn.textContent = 'Guardando…';
  var { error } = await sb.from('empleados').update({
    nombre: nombre, email: email, dni: dni, cargo: cargo,
    dias_vacaciones_anuales: dias, activo: activo
  }).eq('id', id);
  btn.disabled = false; btn.textContent = 'Guardar cambios';
  if (error) { err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return; }
  ok.style.display = 'block'; ok.textContent = '✓ Datos actualizados correctamente.';
  cargarEmpleados();
  setTimeout(cerrarEditEmp, 1200);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('editEmpModal').style.display === 'flex') cerrarEditEmp();
});
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'editEmpModal') cerrarEditEmp();
});

function exportarEmpleadosExcel() {
  if (!allEmpleados.length) { alert('No hay empleados para exportar.'); return; }
  var datos = filtroCargoActivo === 'todos'
    ? allEmpleados
    : allEmpleados.filter(function(e){ return e.cargo === filtroCargoActivo; });
  var filas = [['Nombre', 'Email', 'DNI', 'Cargo', 'Estado', 'Días vacaciones']];
  datos.forEach(function(e) {
    filas.push([e.nombre, e.email, e.dni || '', e.cargo, e.activo ? 'Activo' : 'Inactivo', e.dias_vacaciones_anuales || 22]);
  });
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = [{wch:30},{wch:35},{wch:12},{wch:25},{wch:10},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
  XLSX.writeFile(wb, 'empleados_enerpro_' + new Date().toISOString().split('T')[0] + '.xlsx');
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
  lista.innerHTML = skelVacs(4);
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
    document.getElementById('vacAno').textContent = anoActual;
    resumen.style.display = 'block';
    // numbers animated after data loads (see below)
  }

  if (!data || !data.length) { lista.innerHTML = '<div class="empty" style="border:none"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>No tienes solicitudes de vacaciones</div>'; return; }

  // Animate counters after data loaded
  animateValue(document.getElementById('vacTotal'),     currentEmpleado.dias_vacaciones_anuales || 22, 600);
  animateValue(document.getElementById('vacUsados'),    usados,    700);
  animateValue(document.getElementById('vacRestantes'), restantes, 700);

  var delay = 0;
  lista.innerHTML = data.map(function(v) {
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var est = v.estado === 'aprobada' ? 'badge-green'
            : v.estado === 'rechazada' ? 'badge-red'
            : v.estado === 'cancelada' ? 'badge-grey'
            : 'badge-yellow';
    var btnCancelar = v.estado === 'pendiente'
      ? '<button class="btn-sm" onclick="cancelarVacacion(\'' + v.id + '\')" ' +
        'style="margin-left:0.25rem;color:var(--muted);border-color:rgba(255,255,255,0.1);font-size:0.68rem" ' +
        'title="Cancelar solicitud">✕ Cancelar</button>'
      : '';
    var d = delay; delay += 50;
    return '<div class="vac-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<span class="badge ' + (VAC_TIPO_CLASS[v.tipo]||'badge-blue') + ' vac-tipo">' + (VAC_TIPO_LABEL[v.tipo]||v.tipo) + '</span>' +
      '<span class="vac-fechas">' + desde + ' → ' + hasta +
        (v.notas     ? '<br><span style="font-size:0.72rem;color:var(--muted)">' + v.notas      + '</span>' : '') +
        (v.comentario ? '<br><span style="font-size:0.72rem;color:var(--gold)">💬 ' + v.comentario + '</span>' : '') + '</span>' +
      '<span class="vac-dias">' + dias + ' d.</span>' +
      '<span class="badge ' + est + '">' + v.estado + '</span>' +
      btnCancelar +
      '</div>';
  }).join('');
}

async function cargarVacacionesAdmin() {
  var lista = document.getElementById('vacAdminLista');
  if (!lista) return;
  lista.innerHTML = skelDocs(4);
  var filtro = document.getElementById('vacAdminFiltro').value;
  var q = sb.from('vacaciones').select('*, empleados(nombre)').order('fecha_inicio');
  if (filtro !== 'todas') q = q.eq('estado', filtro);
  var { data } = await q;
  if (!data || !data.length) { lista.innerHTML = '<div class="empty" style="border:none"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Sin solicitudes de vacaciones</div>'; return; }
  var delay = 0;
  lista.innerHTML = data.map(function(v) {
    var nombre = v.empleados ? v.empleados.nombre : '—';
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var est = v.estado === 'aprobada' ? 'badge-green'
            : v.estado === 'rechazada' ? 'badge-red'
            : v.estado === 'cancelada' ? 'badge-grey'
            : 'badge-yellow';
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info"><div class="doc-icon">🏖️</div>' +
      '<div><div class="doc-name">' + nombre + ' · <span style="color:var(--text2);font-weight:400">' + (VAC_TIPO_LABEL[v.tipo]||v.tipo) + '</span></div>' +
      '<div class="doc-meta">' + desde + ' → ' + hasta + ' (' + dias + ' días)' + (v.notas ? ' · ' + v.notas : '') + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem" id="vac-act-' + v.id + '">' +
      '<span class="badge ' + est + '">' + v.estado + '</span>' +
      (v.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="mostrarAccionVacacion(\'' + v.id + '\',\'aprobada\')">Aprobar</button>' +
        '<button class="btn-sm" style="color:var(--red);border-color:rgba(220,38,38,0.3)" onclick="mostrarAccionVacacion(\'' + v.id + '\',\'rechazada\')">Rechazar</button>'
        : (v.comentario ? '<span style="font-size:0.75rem;color:var(--gold);max-width:180px;overflow:hidden;text-overflow:ellipsis">💬 ' + v.comentario + '</span>' : '')) +
      '</div></div>';
  }).join('');
}

function mostrarAccionVacacion(id, estado) {
  var el = document.getElementById('vac-act-' + id);
  if (!el) return;
  var esBuena = estado === 'aprobada';
  var col = esBuena ? 'var(--green)' : 'var(--red)';
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:0.4rem;min-width:200px;max-width:280px">' +
    '<textarea id="cmt-vac-' + id + '" rows="2" placeholder="Comentario para el empleado (opcional)..." ' +
    'style="width:100%;padding:0.45rem 0.7rem;background:var(--surface3);border:1px solid var(--border2);border-radius:var(--r-xs);color:var(--white);font-size:0.78rem;font-family:inherit;resize:none;outline:none"></textarea>' +
    '<div style="display:flex;gap:0.4rem">' +
    '<button class="btn-sm primary" style="background:' + col + ';border-color:' + col + '" ' +
    'onclick="confirmarVacacion(\'' + id + '\',\'' + estado + '\')">' + (esBuena ? '✓ Aprobar' : '✕ Rechazar') + '</button>' +
    '<button class="btn-sm" onclick="cargarVacacionesAdmin()">Cancelar</button>' +
    '</div></div>';
  el.querySelector('textarea').focus();
}

async function confirmarVacacion(id, estado) {
  var cmt = document.getElementById('cmt-vac-' + id);
  var comentario = cmt ? cmt.value.trim() : '';
  var payload = { estado: estado };
  if (comentario) payload.comentario = comentario;
  await sb.from('vacaciones').update(payload).eq('id', id);
  cargarVacacionesAdmin();
  if (document.getElementById('dashStats')) cargarDashboard();
}

async function gestionarVacacion(id, estado) {
  await sb.from('vacaciones').update({ estado }).eq('id', id);
  cargarVacacionesAdmin();
}

// ─── CANCELAR SOLICITUDES / VACACIONES (EMPLEADO) ────────

async function cancelarSolicitud(id) {
  if (!confirm('¿Cancelar esta solicitud?\nSi ya la revisó el coordinador, contacta con él directamente.')) return;
  var { error } = await sb.from('solicitudes').update({ estado: 'cancelada' }).eq('id', id);
  if (error) { mostrarToast('❌ Error', error.message); return; }
  mostrarToast('✓ Solicitud cancelada', 'La solicitud ha sido cancelada.');
  cargarMisSolicitudes();
}

async function cancelarVacacion(id) {
  if (!confirm('¿Cancelar esta solicitud de vacaciones?')) return;
  var { error } = await sb.from('vacaciones').update({ estado: 'cancelada' }).eq('id', id);
  if (error) { mostrarToast('❌ Error', error.message); return; }
  mostrarToast('✓ Vacaciones canceladas', 'La solicitud ha sido cancelada.');
  cargarVacaciones();
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

  // Preserve admin session before bulk signUp calls
  var { data: sessionData } = await sb.auth.getSession();
  var adminSession = sessionData && sessionData.session;

  var okCount = 0, failCount = 0;
  for (var i = 0; i < importarData.length; i++) {
    progText.textContent = 'Importando ' + (i+1) + ' de ' + importarData.length + '…';
    progBar.style.width = Math.round(((i+1) / importarData.length) * 100) + '%';

    // Generate a random temporary password; employee must change it on first login
    var tempPass = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!1';
    var { error: authErr } = await sb.auth.signUp({ email: importarData[i].email, password: tempPass });

    // Restore admin session if signUp replaced it
    if (adminSession) {
      var { data: cur } = await sb.auth.getSession();
      if (!cur.session || cur.session.access_token !== adminSession.access_token) {
        await sb.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
      }
    }

    // Proceed with DB insert even if Auth account already existed
    if (authErr) {
      var m = authErr.message.toLowerCase();
      if (!m.includes('already registered') && !m.includes('already been registered')) { failCount++; continue; }
    }

    var { error } = await sb.from('empleados').insert({ ...importarData[i], activo: true, debe_cambiar_password: true });
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

// ─── DASHBOARD COORDINADOR ────────────────────────────────

async function cargarDashboard() {
  var statsEl      = document.getElementById('dashStats');
  var sinFirmarEl  = document.getElementById('dashSinFirmar');
  var solicEl      = document.getElementById('dashSolicitudes');
  if (!statsEl) return;

  statsEl.innerHTML = skelStatCards(4);
  if (sinFirmarEl) sinFirmarEl.innerHTML = skelDocs(3);
  if (solicEl)     solicEl.innerHTML     = skelDocs(3);

  var [empRes, solRes, vacRes, cuadRes, solListRes] = await Promise.all([
    sb.from('empleados').select('*', { count:'exact', head:true }).eq('activo', true),
    sb.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado', 'pendiente'),
    sb.from('vacaciones').select('*', { count:'exact', head:true }).eq('estado', 'pendiente'),
    sb.from('documentos').select('firmado, empleados(nombre, cargo)').eq('tipo', 'cuadrante'),
    sb.from('solicitudes').select('*, empleados(nombre)').eq('estado', 'pendiente').order('created_at').limit(15)
  ]);

  var totalEmp  = empRes.count  || 0;
  var totalSol  = solRes.count  || 0;
  var totalVac  = vacRes.count  || 0;
  var cuadrantes = cuadRes.data || [];
  var firmados   = cuadrantes.filter(function(d){ return d.firmado; }).length;
  var sinFirmar  = cuadrantes.filter(function(d){ return !d.firmado; });
  var pct        = cuadrantes.length ? Math.round((firmados / cuadrantes.length) * 100) : 0;

  // Cards de stats
  statsEl.innerHTML =
    '<div class="card card-accent" style="margin:0;animation:scaleIn 0.3s ease both;animation-delay:0ms">' +
      '<div class="card-label">Empleados activos</div>' +
      '<div class="card-value" id="d-emp">0</div>' +
      '<div class="card-sub">En plantilla</div>' +
    '</div>' +
    '<div class="card" style="margin:0;cursor:pointer;animation:scaleIn 0.3s ease both;animation-delay:60ms" onclick="switchTab(\'solicitudes-admin\', document.querySelector(\'[onclick*=\\\"solicitudes-admin\\\"]\'))">' +
      '<div class="card-label">Solicitudes pendientes</div>' +
      '<div class="card-value" id="d-sol" style="color:' + (totalSol > 0 ? 'var(--yellow)' : 'var(--green)') + '">0</div>' +
      '<div class="card-sub">Requieren revisión</div>' +
    '</div>' +
    '<div class="card" style="margin:0;cursor:pointer;animation:scaleIn 0.3s ease both;animation-delay:120ms" onclick="switchTab(\'vacaciones-admin\', document.querySelector(\'[onclick*=\\\"vacaciones-admin\\\"]\'))">' +
      '<div class="card-label">Vacaciones pendientes</div>' +
      '<div class="card-value" id="d-vac" style="color:' + (totalVac > 0 ? 'var(--yellow)' : 'var(--green)') + '">0</div>' +
      '<div class="card-sub">Requieren revisión</div>' +
    '</div>' +
    '<div class="card" style="margin:0;animation:scaleIn 0.3s ease both;animation-delay:180ms">' +
      '<div class="card-label">Cuadrantes firmados</div>' +
      '<div class="card-value" style="color:var(--green)"><span id="d-firm">0</span><span style="font-size:1rem;color:var(--muted)"> / ' + cuadrantes.length + '</span></div>' +
      '<div class="card-sub" style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem">' +
        '<div style="flex:1;height:4px;background:var(--surface3);border-radius:2px">' +
          '<div id="d-pct-bar" style="width:0%;height:100%;background:var(--green);border-radius:2px;transition:width 0.8s cubic-bezier(0.22,1,0.36,1)"></div>' +
        '</div>' +
        '<span id="d-pct">0%</span>' +
      '</div>' +
    '</div>';

  // Animate counters
  animateValue(document.getElementById('d-emp'),  totalEmp,  700);
  animateValue(document.getElementById('d-sol'),  totalSol,  700);
  animateValue(document.getElementById('d-vac'),  totalVac,  700);
  animateValue(document.getElementById('d-firm'), firmados,  700);
  setTimeout(function() {
    var bar = document.getElementById('d-pct-bar');
    var pctEl = document.getElementById('d-pct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }, 200);

  // Lista sin firmar
  if (sinFirmarEl) {
    if (!sinFirmar.length) {
      sinFirmarEl.innerHTML = '<div class="empty" style="border:none;padding:2rem;color:var(--green)">✓ Todos han firmado su cuadrante</div>';
    } else {
      sinFirmarEl.innerHTML = sinFirmar.map(function(d) {
        var nombre = d.empleados ? d.empleados.nombre : '—';
        var cargo  = d.empleados ? d.empleados.cargo  : '';
        return '<div class="doc-item" style="padding:0.75rem 1.25rem">' +
          '<div class="doc-info">' +
            '<div class="doc-icon" style="width:34px;height:34px;font-size:0.9rem">⏳</div>' +
            '<div><div class="doc-name" style="font-size:0.85rem">' + nombre + '</div>' +
            '<div class="doc-meta">' + cargo + '</div></div>' +
          '</div>' +
          '<span class="badge badge-yellow">Pendiente</span>' +
        '</div>';
      }).join('');
    }
  }

  // Solicitudes pendientes en dashboard
  if (solicEl) {
    var sols = solListRes.data || [];
    if (!sols.length) {
      solicEl.innerHTML = '<div class="empty" style="border:none;padding:2rem;color:var(--green)">✓ Sin solicitudes pendientes</div>';
    } else {
      solicEl.innerHTML = sols.map(function(s) {
        var nombre = s.empleados ? s.empleados.nombre : '—';
        var fecha  = new Date(s.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
        return '<div class="doc-item" style="padding:0.75rem 1.25rem">' +
          '<div class="doc-info">' +
            '<div class="doc-icon" style="width:34px;height:34px;font-size:0.9rem">📋</div>' +
            '<div><div class="doc-name" style="font-size:0.85rem">' + nombre + '</div>' +
            '<div class="doc-meta">' + s.tipo + ' · ' + fecha + '</div></div>' +
          '</div>' +
          '<button class="btn-sm" onclick="switchTab(\'solicitudes-admin\',document.querySelector(\'[onclick*=\\\"solicitudes-admin\\\"]\'))">Gestionar →</button>' +
        '</div>';
      }).join('');
    }
  }
}

// ─── TURNOS ADMIN ─────────────────────────────────────────

async function cargarTurnosAdmin() {
  var container = document.getElementById('turnosAdminList');
  if (!container) return;
  container.innerHTML = skelDocs(4);
  var hoy = new Date().toISOString().split('T')[0];
  var { data } = await sb.from('turnos').select('*, empleados(nombre)')
    .gte('fecha', hoy).order('fecha').order('hora_inicio').limit(30);
  if (!data || !data.length) {
    container.innerHTML = '<div class="empty" style="border:none"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>No hay turnos próximos</div>';
    return;
  }
  var delay = 0;
  container.innerHTML = data.map(function(t) {
    var horas = t.hora_inicio ? t.hora_inicio.slice(0,5) + (t.hora_fin ? '–' + t.hora_fin.slice(0,5) : '') : '—';
    var fecha = new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
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
// ─── RESUMEN VACACIONAL ADMIN ────────────────────────────

async function cargarResumenVacaciones() {
  var lista = document.getElementById('resumenVacLista');
  if (!lista) return;
  lista.innerHTML = skelDocs(5);

  var ano = new Date().getFullYear();
  var anoEl = document.getElementById('resumenVacAno');
  if (anoEl) anoEl.textContent = '· ' + ano;

  var filtro = document.getElementById('resumenVacCargo') ? document.getElementById('resumenVacCargo').value : 'todos';

  var empQ = sb.from('empleados').select('*').eq('activo', true).order('nombre');
  if (filtro !== 'todos') empQ = empQ.eq('cargo', filtro);
  var [empRes, vacRes] = await Promise.all([
    empQ,
    sb.from('vacaciones')
      .select('empleado_id, tipo, fecha_inicio, fecha_fin, estado')
      .eq('tipo', 'vacaciones').eq('estado', 'aprobada')
      .gte('fecha_inicio', ano + '-01-01').lte('fecha_inicio', ano + '-12-31')
  ]);

  var empleados = empRes.data || [];
  var vacaciones = vacRes.data || [];

  var usadosMap = {};
  vacaciones.forEach(function(v) {
    usadosMap[v.empleado_id] = (usadosMap[v.empleado_id] || 0) + diasEntre(v.fecha_inicio, v.fecha_fin);
  });

  if (!empleados.length) {
    lista.innerHTML = '<div class="empty" style="border:none"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>No hay empleados activos</div>';
    return;
  }

  var rows = empleados.map(function(e, i) {
    var total     = e.dias_vacaciones_anuales || 22;
    var usados    = usadosMap[e.id] || 0;
    var restantes = Math.max(0, total - usados);
    var pct       = Math.min(100, Math.round((usados / total) * 100));
    var colorBar  = pct >= 90 ? 'var(--red)' : pct >= 60 ? 'var(--yellow)' : 'var(--green)';
    var colorRest = restantes === 0 ? 'var(--red)' : restantes <= 5 ? 'var(--yellow)' : 'var(--green)';
    var inicial   = e.nombre.charAt(0).toUpperCase();
    return '<tr style="animation:fadeIn 0.25s ease both;animation-delay:' + (i * 35) + 'ms">' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.75rem">' +
          '<div style="width:32px;height:32px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;color:#fff;flex-shrink:0">' + inicial + '</div>' +
          '<div><div style="font-weight:500;color:var(--white)">' + e.nombre + '</div>' +
          '<div style="font-size:0.72rem;color:var(--muted)">' + e.cargo + '</div></div>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center;color:var(--text2)">' + total + '</td>' +
      '<td style="text-align:center">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' +
          '<strong style="color:var(--white)">' + usados + '</strong>' +
          '<div style="width:72px;height:4px;background:var(--surface3);border-radius:2px">' +
            '<div style="width:' + pct + '%;height:100%;background:' + colorBar + ';border-radius:2px;transition:width 0.6s"></div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center"><strong style="color:' + colorRest + '">' + restantes + '</strong></td>' +
      '</tr>';
  });

  lista.innerHTML =
    '<table style="font-size:0.85rem">' +
      '<thead><tr>' +
        '<th>Empleado</th>' +
        '<th style="text-align:center">Días anuales</th>' +
        '<th style="text-align:center">Usados</th>' +
        '<th style="text-align:center">Restantes</th>' +
      '</tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody>' +
    '</table>';
}

function exportarResumenVacaciones() {
  var lista = document.getElementById('resumenVacLista');
  if (!lista) return;
  var rows = lista.querySelectorAll('tbody tr');
  if (!rows.length) { alert('No hay datos para exportar.'); return; }
  var ano = new Date().getFullYear();
  var filas = [['Nombre', 'Cargo', 'Días anuales', 'Días usados', 'Días restantes']];
  rows.forEach(function(tr) {
    var tds = tr.querySelectorAll('td');
    var nombre   = tds[0] ? tds[0].querySelector('div > div > div:first-child').textContent.trim() : '';
    var cargo    = tds[0] ? tds[0].querySelector('div > div > div:last-child').textContent.trim() : '';
    var total    = tds[1] ? tds[1].textContent.trim() : '';
    var usados   = tds[2] ? tds[2].querySelector('strong').textContent.trim() : '';
    var rest     = tds[3] ? tds[3].querySelector('strong').textContent.trim() : '';
    filas.push([nombre, cargo, total, usados, rest]);
  });
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = [{wch:32},{wch:26},{wch:14},{wch:13},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws, 'Vacaciones ' + ano);
  XLSX.writeFile(wb, 'resumen_vacaciones_' + ano + '.xlsx');
}

// ─── TURNOS MASIVOS ───────────────────────────────────────

function switchMasivaTab(mode) {
  document.getElementById('masiva-fecha').style.display     = mode === 'fecha'     ? 'block' : 'none';
  document.getElementById('masiva-empleados').style.display = mode === 'empleados' ? 'block' : 'none';
  document.getElementById('masivaTabFecha').classList.toggle('active',     mode === 'fecha');
  document.getElementById('masivaTabEmpleados').classList.toggle('active', mode === 'empleados');
}

function poblarMasivaEmpleados() {
  var sel = document.getElementById('masivaEmpFecha');
  var chk = document.getElementById('masivaEmpCheckList');
  if (!sel || !chk || !allEmpleados.length) return;
  sel.innerHTML = '<option value="">Selecciona empleado...</option>' +
    allEmpleados.map(function(e){ return '<option value="' + e.id + '">' + e.nombre + ' — ' + e.cargo + '</option>'; }).join('');
  chk.innerHTML = allEmpleados.map(function(e) {
    return '<label style="display:flex;align-items:center;gap:0.625rem;padding:0.45rem 0.625rem;border-radius:var(--r-xs);cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'\'">' +
      '<input type="checkbox" class="masiva-emp-chk" value="' + e.id + '" style="width:auto;padding:0;border:none;background:none;min-height:auto;accent-color:var(--gold)">' +
      '<span style="font-size:0.83rem;color:var(--text2)">' + e.nombre + ' <span style="color:var(--muted);font-size:0.75rem">· ' + e.cargo + '</span></span>' +
      '</label>';
  }).join('');
}

function seleccionarTodosEmp(val) {
  document.querySelectorAll('.masiva-emp-chk').forEach(function(c){ c.checked = val; });
}

async function crearTurnosPorFecha() {
  var empId  = document.getElementById('masivaEmpFecha').value;
  var desde  = document.getElementById('masivaDesde').value;
  var hasta  = document.getElementById('masivaHasta').value;
  var tipo   = document.getElementById('masivaTipoFecha').value;
  var ini    = document.getElementById('masivaHoraIni').value;
  var fin    = document.getElementById('masivaHoraFin').value;
  var ubic   = document.getElementById('masivaUbicFecha').value.trim();
  var excFin = document.getElementById('masivaExcluirFinde').checked;
  var ok     = document.getElementById('masivaFechaOk');
  var err    = document.getElementById('masivaFechaErr');
  var btn    = document.getElementById('masivaFechaBtn');
  ok.style.display = 'none'; err.style.display = 'none';
  if (!empId || !desde || !hasta) { err.style.display='block'; err.textContent='Selecciona empleado y rango de fechas.'; return; }
  if (hasta < desde) { err.style.display='block'; err.textContent='La fecha fin debe ser posterior al inicio.'; return; }

  var fechas = [];
  var cur = new Date(desde + 'T12:00:00');
  var end = new Date(hasta + 'T12:00:00');
  while (cur <= end) {
    var dow = cur.getDay(); // 0=dom, 6=sab
    if (!excFin || (dow !== 0 && dow !== 6)) {
      fechas.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  if (!fechas.length) { err.style.display='block'; err.textContent='No hay días hábiles en el rango seleccionado.'; return; }

  btn.disabled = true; btn.textContent = 'Creando ' + fechas.length + ' turnos…';
  var payload = fechas.map(function(f) {
    var t = { empleado_id: empId, fecha: f, tipo: tipo };
    if (ini)  t.hora_inicio = ini;
    if (fin)  t.hora_fin    = fin;
    if (ubic) t.ubicacion   = ubic;
    return t;
  });
  var { error } = await sb.from('turnos').insert(payload);
  btn.disabled = false; btn.textContent = 'Crear turnos en el rango';
  if (error) { err.style.display='block'; err.textContent='Error: ' + error.message; return; }
  ok.style.display='block'; ok.textContent='✓ ' + fechas.length + ' turnos creados correctamente.';
  cargarTurnosAdmin();
}

async function crearTurnosPorEmpleados() {
  var fecha  = document.getElementById('masivaFechaEmp').value;
  var tipo   = document.getElementById('masivaTipoEmp').value;
  var ini    = document.getElementById('masivaHoraIniEmp').value;
  var fin    = document.getElementById('masivaHoraFinEmp').value;
  var ubic   = document.getElementById('masivaUbicEmp').value.trim();
  var ok     = document.getElementById('masivaEmpOk');
  var err    = document.getElementById('masivaEmpErr');
  var btn    = document.getElementById('masivaEmpBtn');
  ok.style.display = 'none'; err.style.display = 'none';

  var selIds = Array.from(document.querySelectorAll('.masiva-emp-chk:checked')).map(function(c){ return c.value; });
  if (!fecha)          { err.style.display='block'; err.textContent='Selecciona una fecha.'; return; }
  if (!selIds.length)  { err.style.display='block'; err.textContent='Selecciona al menos un empleado.'; return; }

  btn.disabled = true; btn.textContent = 'Creando ' + selIds.length + ' turnos…';
  var payload = selIds.map(function(id) {
    var t = { empleado_id: id, fecha: fecha, tipo: tipo };
    if (ini)  t.hora_inicio = ini;
    if (fin)  t.hora_fin    = fin;
    if (ubic) t.ubicacion   = ubic;
    return t;
  });
  var { error } = await sb.from('turnos').insert(payload);
  btn.disabled = false; btn.textContent = 'Crear turnos para seleccionados';
  if (error) { err.style.display='block'; err.textContent='Error: ' + error.message; return; }
  ok.style.display='block'; ok.textContent='✓ ' + selIds.length + ' turnos creados para el ' + fecha + '.';
  seleccionarTodosEmp(false);
  cargarTurnosAdmin();
}

// ─── NOTIFICACIONES REALTIME PARA EL ADMIN ───────────────

function suscribirSolicitudesAdmin() {
  if (adminSolicitudesChannel) { sb.removeChannel(adminSolicitudesChannel); }
  adminSolicitudesChannel = sb.channel('admin-solicitudes-insert')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'solicitudes'
    }, async function(payload) {
      var s = payload.new;
      var nombre = '—';
      if (s.empleado_id) {
        var { data: emp } = await sb.from('empleados').select('nombre').eq('id', s.empleado_id).single();
        if (emp) nombre = emp.nombre;
      }
      var tipo = s.tipo || 'Solicitud';
      mostrarToast('📋 Nueva solicitud', nombre + ' · ' + tipo);
      if (Notification.permission === 'granted') {
        new Notification('ENERPRO — Nueva solicitud', { body: nombre + ': ' + tipo, icon: 'enerprologo.jpg' });
      }
      if (document.getElementById('dashStats')) cargarDashboard();
    })
    .subscribe();
}

function suscribirVacacionesAdmin() {
  if (adminVacacionesChannel) { sb.removeChannel(adminVacacionesChannel); }
  adminVacacionesChannel = sb.channel('admin-vacaciones-insert')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'vacaciones'
    }, async function(payload) {
      var v = payload.new;
      var nombre = '—';
      if (v.empleado_id) {
        var { data: emp } = await sb.from('empleados').select('nombre').eq('id', v.empleado_id).single();
        if (emp) nombre = emp.nombre;
      }
      var tipo   = VAC_TIPO_LABEL[v.tipo] || v.tipo || 'Vacaciones';
      var fechas = (v.fecha_inicio || '') + ' → ' + (v.fecha_fin || '');
      mostrarToast('🏖️ Nueva solicitud de vacaciones', nombre + ' · ' + tipo + ' · ' + fechas);
      if (Notification.permission === 'granted') {
        new Notification('ENERPRO — Vacaciones', { body: nombre + ': ' + tipo + ' (' + fechas + ')', icon: 'enerprologo.jpg' });
      }
      if (document.getElementById('dashStats')) cargarDashboard();
    })
    .subscribe();
}
