/* ENERPRO Portal del Empleado */

const SUPABASE_URL = 'https://rmiaxqbmmnbnxbmlnuny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtaWF4cWJtbW5ibnhibWxudW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTkyMTAsImV4cCI6MjA5NDY5NTIxMH0.oT256vpF6dgop0CAdy9MOAyGyoW3ZK2NAncQVk2tonU';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var currentUser = null;
var currentEmpleado = null;
var allDocs = [];

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
  var isAdmin = email.includes('admin') || (emp && emp.cargo === 'Coordinador');
  document.getElementById('loginWrap').style.display = 'none';
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
    document.querySelectorAll('.admin-only').forEach(function(el){ el.style.display='flex'; });
    cargarEmpleados();
  }
  cargarDocumentos();
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
}

document.querySelectorAll('.nav-item').forEach(function(btn){
  btn.addEventListener('click', function(){ navigateToPage(this.getAttribute('data-page')); });
});

function navTo(page) { navigateToPage(page); }

// LOGOUT
async function doLogout() {
  await sb.auth.signOut();
  currentUser = null; currentEmpleado = null; allDocs = [];
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.querySelectorAll('.admin-only').forEach(function(el){ el.style.display='none'; });
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
    if (cuadranteDiv) cuadranteDiv.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">' +
      '<div style="display:flex;align-items:center;gap:1rem">' +
      '<div style="width:48px;height:48px;background:var(--red-light);border:1px solid rgba(220,38,38,0.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📅</div>' +
      '<div><div style="font-size:1rem;font-weight:600;color:var(--white)">' + cuadrante.nombre + '</div>' +
      '<div style="font-size:0.8rem;color:var(--muted);margin-top:2px">' + (cuadrante.fecha||'') + ' · Cuadrante de servicio</div></div></div>' +
      '<button class="btn-sm primary" onclick="verDoc(\'' + cuadrante.url + '\', \'' + cuadrante.nombre + '\')">👁 Ver cuadrante</button>' +
      '<button class="btn-sm" onclick="descargarDoc(\'' + cuadrante.id + '\', \'' + cuadrante.url + '\', \'' + cuadrante.nombre + '\')">⬇ Descargar</button>' +
      '</div>';
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
    var badge = doc.leido ? '' : '<span class="badge badge-red" style="margin-left:0.5rem">Nuevo</span>';
    return '<div class="doc-item">' +
      '<div class="doc-info"><div class="doc-icon">' + icon + '</div>' +
      '<div><div class="doc-name">' + doc.nombre + badge + '</div>' +
      '<div class="doc-meta">' + (doc.fecha||'') + ' · ' + doc.tipo + '</div></div></div>' +
      '<div>' +
      '<button class="btn-sm primary" onclick="descargarDoc(\'' + doc.id + '\', \'' + doc.url + '\', \'' + doc.nombre + '\')">Descargar</button>' +
      '<button class="btn-sm" style="margin-left:0.5rem;border-color:#dc2626;color:#dc2626" onclick="eliminarDoc(\'' + doc.id + '\', \'' + doc.url + '\')">Eliminar</button>' +
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
  var { data, error } = await sb.storage.from('documentos').createSignedUrl(url, 3600);
  if (error || !data) { alert('No se pudo cargar el documento.'); return; }
  document.getElementById('pdfModalTitle').textContent = nombre;
  document.getElementById('pdfFrame').src = data.signedUrl;
  document.getElementById('pdfModal').style.display = 'flex';
}

function cerrarVisor() {
  document.getElementById('pdfModal').style.display = 'none';
  document.getElementById('pdfFrame').src = '';
}

document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cerrarVisor(); });

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
  });
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
  if (tab === 'subir' || tab === 'masivo') cargarEmpleados();
  if (tab === 'solicitudes-admin') cargarSolicitudesAdmin();
}

// ADMIN - EMPLEADOS
async function cargarEmpleados() {
  var { data } = await sb.from('empleados').select('*').order('nombre');
  if (!data) return;
  var sel = document.getElementById('subirEmpleado');
  if (sel) {
    sel.innerHTML = '<option value="">Selecciona empleado...</option>';
    data.forEach(function(e){ sel.innerHTML += '<option value="' + e.id + '">' + e.nombre + ' — ' + e.cargo + '</option>'; });
  }
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
  var { error: dbError } = await sb.from('empleados').insert({ nombre:nombre, email:email, dni:dni, cargo:cargo, activo:true });
  if (dbError) { err.style.display='block'; err.textContent='Error: '+dbError.message; return; }
  ok.style.display='block'; ok.textContent='✓ Empleado creado correctamente.';
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
