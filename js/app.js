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
var calTurnos = [];
var _docBadgeCount = 0;
var currentAdminTab = 'dashboard';
var _solAdminData = [];
var _vacAdminData = [];
var _cuadAdminAnio  = new Date().getFullYear();
var _cuadAdminMes   = new Date().getMonth();
var _cuadAdminCargo = 'todos';
var _cuadAdminRaw   = { empleados: [], turnos: [] };
var _dashChartSolCtx = null;
var _dashChartVacCtx = null;
var _modoRecuperacionPass = false;

// ─── I18N ─────────────────────────────────────────────────

var _lang = localStorage.getItem('enerpro_lang') || 'es';

var I18N = {
  es: {
    meses:   ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    meses_c: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    // Login
    'login.subtitulo':   'Portal del Empleado · Acceso Privado',
    'login.email':       'Email corporativo',
    'login.email_ph':    'usuario@enerpro.com',
    'login.pass':        'Contraseña',
    'login.pass_ph':     '••••••••',
    'login.btn':         'Acceder al portal',
    'login.accediendo':  'Accediendo...',
    'login.error':       'Credenciales incorrectas. Inténtalo de nuevo.',
    'login.inactivo':    'Tu cuenta está desactivada. Contacta con coordinación.',
    'login.forgot':      '¿Has olvidado tu contraseña?',
    // Recuperar contraseña
    'rp.titulo':         'Recuperar contraseña',
    'rp.sub':            'Introduce tu email corporativo. Te enviaremos un enlace para restablecer la contraseña.',
    'rp.btn':            'Enviar enlace',
    'rp.enviando':       'Enviando...',
    'rp.ok':             '✓ Si el email está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.',
    'rp.err_email':      'Introduce un email válido.',
    'rp.volver':         '← Volver al acceso',
    'rp.set_titulo':     'Nueva contraseña',
    'rp.set_sub':        'Establece tu nueva contraseña para acceder al portal.',
    'rp.set_btn':        'Guardar y acceder',
    'rp.set_ok':         '✓ Contraseña actualizada',
    'rp.err_link':       'El enlace ha caducado o no es válido. Solicita uno nuevo.',
    // Cambio pass obligatorio
    'cp.titulo':         'Nueva contraseña',
    'cp.sub':            'Por seguridad, debes establecer una contraseña propia antes de acceder al portal.',
    'cp.nueva':          'Nueva contraseña',
    'cp.nueva_ph':       'Mínimo 8 caracteres',
    'cp.confirma':       'Confirmar contraseña',
    'cp.confirma_ph':    'Repite la contraseña',
    'cp.btn':            'Cambiar contraseña y acceder',
    'cp.guardando':      'Guardando...',
    'cp.ok':             '✓ Contraseña actualizada',
    'cp.err_corta':      'La contraseña debe tener al menos 8 caracteres.',
    'cp.err_match':      'Las contraseñas no coinciden.',
    // Cambio pass perfil
    'cpp.eyebrow':       'Mi perfil',
    'cpp.titulo':        'Cambiar contraseña',
    'cpp.btn':           'Actualizar contraseña',
    'cpp.guardando':     'Guardando...',
    'cpp.ok':            '✓ Contraseña actualizada correctamente.',
    // Sidebar
    'sidebar.portal':    'Portal del Empleado',
    'sidebar.admin_rol': 'Administrador',
    'sidebar.emp_rol':   'Empleado',
    'nav.principal':     'Principal',
    'nav.miarea':        'Mi área',
    'nav.inicio':        'Inicio',
    'nav.documentos':    'Mis documentos',
    'nav.solicitudes':   'Solicitudes',
    'nav.calendario':    'Mis turnos',
    'nav.vacaciones':    'Vacaciones',
    'nav.admin':         'Administración',
    'nav.perfil':        'Mi perfil',
    'sidebar.logout':    'Cerrar sesión',
    'sidebar.pass':      '🔑 Cambiar contraseña',
    // Perfil
    'prf.eyebrow':       'Mi área',
    'prf.titulo':        'Mi perfil',
    'prf.sub':           'Tu información personal y datos de cuenta',
    'prf.info':          'Información personal',
    'prf.nombre':        'Nombre completo',
    'prf.email':         'Email corporativo',
    'prf.cargo':         'Cargo',
    'prf.dni':           'DNI',
    'prf.vac':           'Vacaciones',
    'prf.cuenta':        'Cuenta',
    'prf.pass_btn':      '🔑 Cambiar contraseña',
    'prf.ano':           'Año',
    'prf.dias_anual':    'Días anuales',
    'prf.usados':        'Días usados',
    'prf.restantes':     'Días restantes',
    'prf.disponibles':   'Disponibles',
    'prf.estado':        'Estado',
    'prf.activo':        'Activo',
    'sidebar.salir':     'Salir',
    // Bottom nav
    'bnav.inicio':       'Inicio',
    'bnav.documentos':   'Documentos',
    'bnav.solicitudes':  'Solicitudes',
    'bnav.vacaciones':   'Vacac.',
    'bnav.calendario':   'Turnos',
    'bnav.admin':        'Admin',
    // Inicio
    'ini.eyebrow':       'Panel principal',
    'ini.bienvenido':    'Bienvenido',
    'ini.empleado':      'empleado',
    'ini.stat_docs':     'Documentos disponibles',
    'ini.stat_docs_sub': 'Nóminas y cuadrantes',
    'ini.stat_unread':   'Sin leer',
    'ini.stat_unread_sub':'Documentos nuevos',
    'ini.stat_estado':   'Estado',
    'ini.stat_estado_sub':'Servicio en curso',
    'ini.stat_vac':      'Vacaciones',
    'ini.stat_vac_sub':  'Días pendientes',
    'ini.qa_docs':       'Documentos',
    'ini.qa_turnos':     'Mis turnos',
    'ini.qa_vac':        'Vacaciones',
    'ini.qa_sol':        'Solicitudes',
    // Doc table columns
    'doc.col_nombre':    'Nombre',
    'doc.col_fecha':     'Fecha',
    'doc.col_estado':    'Estado',
    'doc.col_acc':       'Acciones',
    'ini.cuadrante':     'Mi cuadrante del mes',
    'ini.ultimos':       'Últimos documentos',
    'ini.cargando':      'Cargando...',
    // Documentos
    'doc.eyebrow':       'Mi área',
    'doc.titulo':        'Mis documentos',
    'doc.sub':           'Nóminas, cuadrantes y documentación personal',
    'doc.todos':         'Todos',
    'doc.nominas':       'Nóminas',
    'doc.cuadrantes':    'Cuadrantes',
    'doc.contratos':     'Contratos',
    'doc.ver':           '👁 Ver',
    'doc.descargar':     '⬇ Descargar',
    'doc.firmar':        '✍ Firmar',
    'doc.ver_cuad':      '👁 Ver cuadrante',
    'doc.confirmar':     '✍ Confirmar lectura',
    'doc.firmado':       '✓ Firmado',
    'doc.nuevo':         'Nuevo',
    'doc.cuad_sub':      'Cuadrante de servicio',
    'doc.no_cuad':       'No hay cuadrante disponible.',
    'ini.turno_hoy':     'Tu turno de hoy',
    'ini.pend_titulo':   'Pendiente de tu atención',
    'ini.pend_firmar':   'Sin firmar',
    'ini.pend_resp':     'Solicitud respondida',
    'ini.pend_ver':      'Ver',
    'ini.vac_de':        'Días disponibles · ',
    'doc.empty':         'No hay documentos disponibles',
    'doc.empty_sub':     'Cuando el coordinador suba documentos, aparecerán aquí',
    'doc.cargando':      'Cargando documentos...',
    // Solicitudes empleado
    'sol.eyebrow':       'Buzón',
    'sol.titulo':        'Solicitudes',
    'sol.sub':           'Envía una solicitud al coordinador',
    'sol.tipo':          'Tipo de solicitud',
    'sol.t_vac':         'Solicitud de vacaciones',
    'sol.t_perm':        'Solicitud de permiso',
    'sol.t_turno':       'Cambio de turno',
    'sol.t_baja':        'Baja médica',
    'sol.t_consulta':    'Consulta general',
    'sol.fechas':        'Fechas (si aplica)',
    'sol.fechas_ph':     'Ej: 15 al 20 de junio',
    'sol.desc':          'Descripción',
    'sol.desc_ph':       'Describe tu solicitud...',
    'sol.btn':           'Enviar solicitud',
    'sol.ok':            '✓ Solicitud enviada. El coordinador la revisará en breve.',
    'sol.mis':           'Mis solicitudes',
    'sol.empty':         'Aún no has enviado solicitudes',
    'sol.empty_sub':     'Usa el formulario de arriba para enviar una solicitud al coordinador',
    'sol.cancelar':      '✕ Cancelar',
    'sol.cancelar_ok':   '✓ Solicitud cancelada',
    'sol.cancelar_msg':  'La solicitud ha sido cancelada.',
    'sol.ts_vac':        'Vacaciones',
    'sol.ts_perm':       'Permiso',
    'sol.ts_turno':      'Cambio turno',
    'sol.ts_baja':       'Baja médica',
    'sol.ts_consulta':   'Consulta',
    // Vacaciones empleado
    'vac.eyebrow':       'Mi área',
    'vac.titulo':        'Vacaciones y permisos',
    'vac.sub':           'Solicita días libres y consulta el estado de tus peticiones',
    'vac.dias_anual':    'Días anuales',
    'vac.ano':           'Año',
    'vac.usados':        'Días usados',
    'vac.usados_sub':    'Vacaciones aprobadas',
    'vac.restantes':     'Días restantes',
    'vac.restantes_sub': 'Disponibles',
    'vac.nueva':         'Nueva solicitud',
    'vac.tipo':          'Tipo',
    'vac.t_vac':         'Vacaciones',
    'vac.t_perm':        'Permiso personal',
    'vac.t_asuntos':     'Asuntos propios',
    'vac.t_baja':        'Baja médica',
    'vac.desde':         'Desde',
    'vac.hasta':         'Hasta',
    'vac.notas':         'Notas (opcional)',
    'vac.notas_ph':      'Motivo o indicaciones...',
    'vac.dias_sol':      'Días solicitados: ',
    'vac.btn':           'Enviar solicitud',
    'vac.mis':           'Mis solicitudes',
    'vac.empty':         'No tienes solicitudes de vacaciones',
    'vac.empty_sub':     'Usa el formulario para solicitar vacaciones o permisos',
    'vac.err_solap':     'Ya tienes una solicitud activa que coincide con esas fechas.',
    'vac.err_sin_dias':  'Solo te quedan {n} días de vacaciones disponibles (solicitas {s}).',
    'vac.cancelar_ok':   '✓ Vacaciones canceladas',
    'vac.cancelar_msg':  'La solicitud ha sido cancelada.',
    'vac.l_vac':         'Vacaciones',
    'vac.l_perm':        'Permiso',
    'vac.l_asuntos':     'Asuntos propios',
    'vac.l_baja':        'Baja médica',
    // Calendario
    'cal.eyebrow':       'Mi área',
    'cal.titulo':        'Mis turnos',
    'cal.sub':           'Tus cuadrantes mensuales',
    'cal.ver_cal':       'Ver en calendario',
    'cal.ical':          'Exportar iCal',
    'cal.detalle':       'Detalle del mes',
    'cal.no_turnos':     'No hay turnos asignados este mes',
    'cal.ical_ok':       '📅 iCal exportado',
    'cal.ical_sin':      'No hay turnos en',
    'cal.ical_sin2':     'para exportar.',
    // Tipos turno
    'tur.manana':        'Mañana',
    'tur.tarde':         'Tarde',
    'tur.noche':         'Noche',
    'tur.guardia':       'Guardia',
    'tur.libre':         'Libre',
    'tur.turno':         'Turno',
    // Admin general
    'adm.eyebrow':       'Administración',
    'adm.titulo':        'Panel de control',
    'adm.sub':           'Gestión de empleados y documentos',
    // Tabs admin
    'tab.dashboard':     '📊 Dashboard',
    'tab.empleados':     'Empleados',
    'tab.subir':         'Subir documento',
    'tab.masivo':        'Subida masiva ZIP',
    'tab.registro':      'Registro',
    'tab.solicitudes':   'Solicitudes',
    'tab.turnos':        'Turnos',
    'tab.importar':      'Importar',
    'tab.vacaciones':    'Vacaciones',
    'tab.resumen':       '📋 Resumen vacacional',
    'tab.docs':          '📂 Documentos',
    // Registro de empleados
    'reg.titulo':         'Solicitudes de registro',
    'reg.f_pend':         'Pendientes',
    'reg.f_todas':        'Todas',
    'reg.f_apr':          'Aprobadas',
    'reg.f_rech':         'Rechazadas',
    'reg.actualizar':     'Actualizar',
    'reg.modal_eyebrow':  'Registro de empleado',
    'reg.modal_titulo':   'Aprobar solicitud',
    'reg.dias_label':     'Días de vacaciones / año',
    'reg.email_nota':     'Se creará la cuenta y se enviará un email de acceso al empleado.',
    'reg.confirmar':      'Aprobar y enviar acceso',
    'reg.cancelar':       'Cancelar',
    'reg.aprobar':        'Aprobar',
    'reg.rechazar':       'Rechazar',
    'reg.estado_pend':    'Pendiente',
    'reg.estado_apr':     'Aprobada',
    'reg.estado_rech':    'Rechazada',
    'reg.empty':          'No hay solicitudes pendientes.',
    'login.solicitar':    '¿Primera vez? Solicitar acceso →',
    // Dashboard
    'dash.sin_firmar':   'Sin firmar cuadrante',
    'dash.solicitudes':  'Solicitudes pendientes',
    'dash.actualizar':   '↺ Actualizar',
    'dash.emp_activos':  'Empleados activos',
    'dash.plantilla':    'En plantilla',
    'dash.sol_pend':     'Solicitudes pendientes',
    'dash.revision':     'Requieren revisión',
    'dash.vac_pend':     'Vacaciones pendientes',
    'dash.cuad_firm':    'Cuadrantes firmados',
    'dash.todos_firm':   '✓ Todos han firmado su cuadrante',
    'dash.sin_sol':      '✓ Sin solicitudes pendientes',
    'dash.gestionar':    'Gestionar →',
    // Empleados admin
    'emp.titulo':        'Empleados registrados',
    'emp.exportar':      '⬇ Exportar Excel',
    'emp.anadir':        '+ Añadir empleado',
    'emp.buscar_ph':     'Buscar por nombre, email o DNI…',
    'emp.f_todos':       'Todos',
    'emp.f_vig':         'Vigilantes',
    'emp.f_aux':         'Auxiliares',
    'emp.f_coo':         'Coordinadores',
    'emp.f_adm':         'Administrativos',
    'emp.nuevo':         'Nuevo empleado',
    'emp.nombre':        'Nombre completo',
    'emp.nombre_ph':     'Carlos Martínez López',
    'emp.email':         'Email corporativo',
    'emp.email_ph':      'cmartinez@enerpro.com',
    'emp.dni':           'DNI',
    'emp.dni_ph':        '12345678A',
    'emp.cargo':         'Cargo',
    'emp.pass_ini':      'Contraseña inicial',
    'emp.pass_ph':       'Mínimo 6 caracteres',
    'emp.btn_crear':     'Crear empleado',
    'emp.btn_cancel':    'Cancelar',
    'emp.activo':        'Activo',
    'emp.inactivo':      'Inactivo',
    'emp.editar':        '✏ Editar',
    'emp.ok':            '✓ Empleado creado correctamente.',
    'emp.c_vig':         'Vigilante de seguridad',
    'emp.c_aux':         'Auxiliar de servicio',
    'emp.c_coo':         'Coordinador',
    'emp.c_adm':         'Administrativo',
    // Editar empleado
    'edit.eyebrow':      'Administración',
    'edit.titulo':       'Editar empleado',
    'edit.nombre':       'Nombre completo',
    'edit.email':        'Email corporativo',
    'edit.email_ph':     'email@enerpro.com',
    'edit.dni':          'DNI',
    'edit.cargo':        'Cargo',
    'edit.dias':         'Días vacaciones / año',
    'edit.estado':       'Estado',
    'edit.activo':       'Activo',
    'edit.inactivo':     'Inactivo / Baja',
    'edit.acceso':       'Acceso al portal',
    'edit.reset_btn':    '🔄 Forzar cambio de contraseña en próximo acceso',
    'edit.guardar':      'Guardar cambios',
    'edit.cancelar':     'Cancelar',
    'edit.guardando':    'Guardando…',
    'edit.ok':           '✓ Datos actualizados correctamente.',
    'edit.reset_ok':     '✓ Al próximo inicio de sesión se le pedirá cambiar su contraseña.',
    // Subir doc
    'sub.titulo':        'Subir documento a empleado',
    'sub.empleado':      'Empleado',
    'sub.empleado_ph':   'Selecciona empleado...',
    'sub.tipo':          'Tipo de documento',
    'sub.nombre':        'Nombre del documento',
    'sub.nombre_ph':     'Ej: Nómina Mayo 2026',
    'sub.archivo':       'Archivo PDF',
    'sub.btn':           'Subir documento',
    'sub.ok':            '✓ Documento subido y asignado correctamente.',
    // Tipos doc
    'tdoc.nomina':       'Nómina',
    'tdoc.cuadrante':    'Cuadrante',
    'tdoc.contrato':     'Contrato',
    'tdoc.protocolo':    'Protocolo de seguridad',
    'tdoc.otro':         'Otro',
    // Subida masiva
    'masi.titulo':       'Subida masiva por ZIP',
    'masi.tipo':         'Tipo de documento',
    'masi.nombre':       'Nombre base del documento',
    'masi.nombre_ph':    'Ej: Nómina Mayo 2026',
    'masi.archivo':      'Archivo ZIP',
    'masi.btn':          'Procesar y subir ZIP',
    'masi.proc':         'Procesando...',
    // Solicitudes admin
    'sa.titulo':         'Solicitudes de empleados',
    'sa.f_todas':        'Todas',
    'sa.f_pend':         'Pendientes',
    'sa.f_apr':          'Aprobadas',
    'sa.f_rech':         'Rechazadas',
    'sa.exportar':       '⬇ Exportar Excel',
    'sa.actualizar':     'Actualizar',
    'sa.empty':          'No hay solicitudes',
    'sa.empty_sub':      'Las solicitudes de los empleados aparecerán aquí',
    'sa.aprobar':        'Aprobar',
    'sa.rechazar':       'Rechazar',
    'sa.aprobar_c':      '✓ Aprobar',
    'sa.rechazar_c':     '✕ Rechazar',
    'sa.cmt_ph':         'Comentario para el empleado (opcional)...',
    'sa.cancelar':       'Cancelar',
    // Turnos admin
    'ta.titulo':         'Asignar turno',
    'ta.empleado':       'Empleado',
    'ta.empleado_ph':    'Selecciona empleado...',
    'ta.fecha':          'Fecha',
    'ta.tipo':           'Tipo de turno',
    'ta.inicio':         'Hora inicio',
    'ta.fin':            'Hora fin',
    'ta.ubic':           'Ubicación (opcional)',
    'ta.ubic_ph':        'Ej: Centro Comercial Norte',
    'ta.notas':          'Notas (opcional)',
    'ta.notas_ph':       'Indicaciones especiales...',
    'ta.btn':            'Guardar turno',
    'ta.proximos':       'Próximos turnos',
    'ta.actualizar':     '↺ Actualizar',
    'ta.ok':             '✓ Turno asignado correctamente.',
    'ta.empty':          'No hay turnos próximos',
    'ta.empty_sub':      'El coordinador asignará turnos cuando sea necesario',
    // Cuadrante mensual admin
    'cua.titulo':        'Cuadrante del mes',
    'cua.sin_turnos':    'Sin turnos asignados',
    'cua.empleado':      'Empleado',
    'cua.exportar':      '⬇ Exportar',
    // Dashboard charts
    'grf.sol_titulo':    'Solicitudes · últimos 6 meses',
    'grf.vac_titulo':    'Vacaciones usadas por empleado · ',
    'grf.sol_empty':     'Sin datos de solicitudes',
    'grf.vac_empty':     'Sin datos de vacaciones',
    // Masiva
    'am.titulo':         'Asignación masiva de turnos',
    'am.tab_fecha':      '📅 Rango de fechas',
    'am.tab_emp':        '👥 Varios empleados',
    'am.desde':          'Desde',
    'am.hasta':          'Hasta',
    'am.inicio':         'Hora inicio',
    'am.fin':            'Hora fin',
    'am.ubic_ph':        'Ej: Centro Comercial Norte',
    'am.excl':           'Excluir sábados y domingos',
    'am.btn_fecha':      'Crear turnos en el rango',
    'am.fecha':          'Fecha',
    'am.emp_label':      'Empleados',
    'am.sel_todos':      'Seleccionar todos',
    'am.desel_todos':    'Deseleccionar todos',
    'am.btn_emp':        'Crear turnos para seleccionados',
    // Vacaciones admin
    'va.titulo':         'Solicitudes de vacaciones',
    'va.exportar':       '⬇ Exportar Excel',
    'va.actualizar':     '↺ Actualizar',
    'va.f_pend':         'Pendientes',
    'va.f_apr':          'Aprobadas',
    'va.f_rech':         'Rechazadas',
    'va.f_can':          'Canceladas',
    'va.f_todas':        'Todas',
    'va.aprobar':        'Aprobar',
    'va.rechazar':       'Rechazar',
    'va.aprobar_c':      '✓ Aprobar',
    'va.rechazar_c':     '✕ Rechazar',
    'va.cmt_ph':         'Comentario para el empleado (opcional)...',
    'va.cancelar':       'Cancelar',
    'va.empty':          'Sin solicitudes de vacaciones',
    'va.empty_sub':      'Las solicitudes de vacaciones de los empleados aparecerán aquí',
    // Resumen vacacional
    'rv.titulo':         'Resumen vacacional',
    'rv.c_todos':        'Todos los cargos',
    'rv.c_vig':          'Vigilantes',
    'rv.c_aux':          'Auxiliares',
    'rv.c_coo':          'Coordinadores',
    'rv.c_adm':          'Administrativos',
    'rv.exportar':       '⬇ Exportar Excel',
    'rv.actualizar':     '↺ Actualizar',
    'rv.col_emp':        'Empleado',
    'rv.col_anual':      'Días anuales',
    'rv.col_usados':     'Usados',
    'rv.col_rest':       'Restantes',
    'rv.no_emp':         'No hay empleados activos',
    'rv.no_emp_sub':     'Los empleados activos aparecerán aquí cuando estén dados de alta',
    'rv.chart':          'Días de vacaciones aprobadas por mes · ',
    // Docs admin
    'da.titulo':         'Todos los documentos',
    'da.emp_ph':         'Todos los empleados',
    'da.tipo_ph':        'Todos los tipos',
    'da.firm_ph':        'Firmados y sin firmar',
    'da.firm_si':        'Firmados',
    'da.firm_no':        'Sin firmar',
    'da.actualizar':     '↺ Actualizar',
    'da.ver':            '👁 Ver',
    'da.empty':          'Sin documentos con los filtros seleccionados',
    'da.empty_sub':      'Prueba con otros filtros o espera a que haya documentos',
    'da.badge_firm':     '✓ Firmado',
    'da.badge_nofirm':   'Sin firmar',
    // Importar
    'imp.titulo':        'Importar desde Excel',
    'imp.archivo':       'Archivo Excel (.xlsx)',
    'imp.plantilla':     '⬇ Descargar plantilla',
    'imp.preview':       'Vista previa',
    'imp.btn':           'Importar todos',
    'imp.importando':    'Importando',
    // Demo
    'demo.titulo':       'Datos de demostración',
    'demo.btn_ins':      'Insertar empleados demo',
    'demo.btn_bor':      'Borrar empleados demo',
    // PDF modal
    'pdf.nueva':         '↗ Nueva pestaña',
    'pdf.cerrar':        '✕ Cerrar',
    // Toasts
    'toast.doc_nuevo':   'Nuevo documento recibido',
    'toast.firma_ok':    '✍ Lectura confirmada',
    'toast.sol_cancel':  '✓ Solicitud cancelada',
    'toast.sol_cancel_msg':'La solicitud ha sido cancelada.',
    'toast.vac_cancel':  '✓ Vacaciones canceladas',
    'toast.vac_cancel_msg':'La solicitud ha sido cancelada.',
    'toast.doc_elim':    '🗑 Documento eliminado',
    'toast.doc_elim_msg':'El documento ha sido eliminado correctamente.',
    'toast.pass_ok':     '🔑 Contraseña actualizada',
    'toast.pass_ok_msg': 'Tu contraseña ha sido cambiada correctamente.',
    'toast.sin_datos':   'ℹ️ Sin datos',
    'toast.no_emp':      'No hay empleados para exportar.',
    'toast.no_sol':      'No hay solicitudes para exportar.',
    'toast.no_vac_exp':  'No hay solicitudes de vacaciones para exportar.',
    // Estados
    'est.pendiente':     'pendiente',
    'est.aprobada':      'aprobada',
    'est.rechazada':     'rechazada',
    'est.cancelada':     'cancelada',
    // Genérico
    'g.cargando':        'Cargando...',
    'g.cancelar':        'Cancelar',
    'g.dias':            'días',
    'g.dia':             'día',
    // Idioma
    'lang.label':        '🌐 Idioma',
  },
  ca: {
    meses:   ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'],
    meses_c: ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'],
    // Login
    'login.subtitulo':   "Portal de l'Empleat · Accés Privat",
    'login.email':       'Correu corporatiu',
    'login.email_ph':    'usuari@enerpro.com',
    'login.pass':        'Contrasenya',
    'login.pass_ph':     '••••••••',
    'login.btn':         'Accedir al portal',
    'login.accediendo':  'Accedint...',
    'login.error':       'Credencials incorrectes. Torna-ho a intentar.',
    'login.inactivo':    'El teu compte està desactivat. Contacta amb coordinació.',
    'login.forgot':      'Has oblidat la contrasenya?',
    // Recuperar contraseña
    'rp.titulo':         'Recuperar contrasenya',
    'rp.sub':            'Introdueix el teu correu corporatiu. T\'enviarem un enllaç per restablir la contrasenya.',
    'rp.btn':            'Enviar enllaç',
    'rp.enviando':       'Enviant...',
    'rp.ok':             '✓ Si el correu està registrat, rebràs un enllaç en uns minuts. Revisa també la carpeta de spam.',
    'rp.err_email':      'Introdueix un correu vàlid.',
    'rp.volver':         '← Tornar a l\'accés',
    'rp.set_titulo':     'Nova contrasenya',
    'rp.set_sub':        'Estableix la teva nova contrasenya per accedir al portal.',
    'rp.set_btn':        'Desar i accedir',
    'rp.set_ok':         '✓ Contrasenya actualitzada',
    'rp.err_link':       'L\'enllaç ha caducat o no és vàlid. Sol·licita\'n un de nou.',
    // Cambio pass obligatorio
    'cp.titulo':         'Nova contrasenya',
    'cp.sub':            "Per seguretat, has d'establir una contrasenya pròpia abans d'accedir al portal.",
    'cp.nueva':          'Nova contrasenya',
    'cp.nueva_ph':       'Mínim 8 caràcters',
    'cp.confirma':       'Confirmar contrasenya',
    'cp.confirma_ph':    'Repeteix la contrasenya',
    'cp.btn':            'Canviar contrasenya i accedir',
    'cp.guardando':      'Desant...',
    'cp.ok':             '✓ Contrasenya actualitzada',
    'cp.err_corta':      'La contrasenya ha de tenir almenys 8 caràcters.',
    'cp.err_match':      'Les contrasenyes no coincideixen.',
    // Cambio pass perfil
    'cpp.eyebrow':       'El meu perfil',
    'cpp.titulo':        'Canviar contrasenya',
    'cpp.btn':           'Actualitzar contrasenya',
    'cpp.guardando':     'Desant...',
    'cpp.ok':            '✓ Contrasenya actualitzada correctament.',
    // Sidebar
    'sidebar.portal':    "Portal de l'Empleat",
    'sidebar.admin_rol': 'Administrador',
    'sidebar.emp_rol':   'Empleat',
    'nav.principal':     'Principal',
    'nav.miarea':        'La meva àrea',
    'nav.inicio':        'Inici',
    'nav.documentos':    'Els meus documents',
    'nav.solicitudes':   'Sol·licituds',
    'nav.calendario':    'Els meus torns',
    'nav.vacaciones':    'Vacances',
    'nav.admin':         'Administració',
    'nav.perfil':        'El meu perfil',
    'sidebar.logout':    'Tancar sessió',
    'sidebar.pass':      '🔑 Canviar contrasenya',
    // Perfil
    'prf.eyebrow':       'La meva àrea',
    'prf.titulo':        'El meu perfil',
    'prf.sub':           'La teva informació personal i dades del compte',
    'prf.info':          'Informació personal',
    'prf.nombre':        'Nom complet',
    'prf.email':         'Email corporatiu',
    'prf.cargo':         'Càrrec',
    'prf.dni':           'DNI',
    'prf.vac':           'Vacances',
    'prf.cuenta':        'Compte',
    'prf.pass_btn':      '🔑 Canviar contrasenya',
    'prf.ano':           'Any',
    'prf.dias_anual':    'Dies anuals',
    'prf.usados':        'Dies usats',
    'prf.restantes':     'Dies restants',
    'prf.disponibles':   'Disponibles',
    'prf.estado':        'Estat',
    'prf.activo':        'Actiu',
    'sidebar.salir':     'Sortir',
    // Bottom nav
    'bnav.inicio':       'Inici',
    'bnav.documentos':   'Documents',
    'bnav.solicitudes':  'Sol·licituds',
    'bnav.vacaciones':   'Vac.',
    'bnav.calendario':   'Torns',
    'bnav.admin':        'Admin',
    // Inicio
    'ini.eyebrow':       'Tauler principal',
    'ini.bienvenido':    'Benvingut',
    'ini.empleado':      'empleat',
    'ini.stat_docs':     'Documents disponibles',
    'ini.stat_docs_sub': 'Nòmines i quadrants',
    'ini.stat_unread':   'Sense llegir',
    'ini.stat_unread_sub':'Documents nous',
    'ini.stat_estado':   'Estat',
    'ini.stat_estado_sub':'Servei en curs',
    'ini.stat_vac':      'Vacances',
    'ini.stat_vac_sub':  'Dies pendents',
    'ini.qa_docs':       'Documents',
    'ini.qa_turnos':     'Els meus torns',
    'ini.qa_vac':        'Vacances',
    'ini.qa_sol':        'Sol·licituds',
    'doc.col_nombre':    'Nom',
    'doc.col_fecha':     'Data',
    'doc.col_estado':    'Estat',
    'doc.col_acc':       'Accions',
    'ini.cuadrante':     'El meu quadrant del mes',
    'ini.ultimos':       'Últims documents',
    'ini.cargando':      'Carregant...',
    // Documentos
    'doc.eyebrow':       'La meva àrea',
    'doc.titulo':        'Els meus documents',
    'doc.sub':           'Nòmines, quadrants i documentació personal',
    'doc.todos':         'Tots',
    'doc.nominas':       'Nòmines',
    'doc.cuadrantes':    'Quadrants',
    'doc.contratos':     'Contractes',
    'doc.ver':           '👁 Veure',
    'doc.descargar':     '⬇ Baixar',
    'doc.firmar':        '✍ Signar',
    'doc.ver_cuad':      '👁 Veure quadrant',
    'doc.confirmar':     '✍ Confirmar lectura',
    'doc.firmado':       '✓ Signat',
    'doc.nuevo':         'Nou',
    'doc.cuad_sub':      'Quadrant de servei',
    'doc.no_cuad':       'No hi ha quadrant disponible.',
    'ini.turno_hoy':     'El teu torn d\'avui',
    'ini.pend_titulo':   'Pendent de la teva atenció',
    'ini.pend_firmar':   'Sense signar',
    'ini.pend_resp':     'Sol·licitud resposta',
    'ini.pend_ver':      'Veure',
    'ini.vac_de':        'Dies disponibles · ',
    'doc.empty':         'No hi ha documents disponibles',
    'doc.empty_sub':     'Quan el coordinador pugi documents, apareixeran aquí',
    'doc.cargando':      'Carregant documents...',
    // Solicitudes empleado
    'sol.eyebrow':       'Bústia',
    'sol.titulo':        'Sol·licituds',
    'sol.sub':           'Envia una sol·licitud al coordinador',
    'sol.tipo':          'Tipus de sol·licitud',
    'sol.t_vac':         'Sol·licitud de vacances',
    'sol.t_perm':        'Sol·licitud de permís',
    'sol.t_turno':       'Canvi de torn',
    'sol.t_baja':        'Baixa mèdica',
    'sol.t_consulta':    'Consulta general',
    'sol.fechas':        'Dates (si escau)',
    'sol.fechas_ph':     'Ex: 15 al 20 de juny',
    'sol.desc':          'Descripció',
    'sol.desc_ph':       'Descriu la teva sol·licitud...',
    'sol.btn':           'Enviar sol·licitud',
    'sol.ok':            '✓ Sol·licitud enviada. El coordinador la revisarà en breu.',
    'sol.mis':           'Les meves sol·licituds',
    'sol.empty':         'Encara no has enviat sol·licituds',
    'sol.empty_sub':     'Fes servir el formulari de dalt per enviar una sol·licitud al coordinador',
    'sol.cancelar':      '✕ Cancel·lar',
    'sol.cancelar_ok':   '✓ Sol·licitud cancel·lada',
    'sol.cancelar_msg':  'La sol·licitud ha estat cancel·lada.',
    'sol.ts_vac':        'Vacances',
    'sol.ts_perm':       'Permís',
    'sol.ts_turno':      'Canvi torn',
    'sol.ts_baja':       'Baixa mèdica',
    'sol.ts_consulta':   'Consulta',
    // Vacaciones empleado
    'vac.eyebrow':       'La meva àrea',
    'vac.titulo':        'Vacances i permisos',
    'vac.sub':           "Sol·licita dies lliures i consulta l'estat de les teves peticions",
    'vac.dias_anual':    'Dies anuals',
    'vac.ano':           'Any',
    'vac.usados':        'Dies usats',
    'vac.usados_sub':    'Vacances aprovades',
    'vac.restantes':     'Dies restants',
    'vac.restantes_sub': 'Disponibles',
    'vac.nueva':         'Nova sol·licitud',
    'vac.tipo':          'Tipus',
    'vac.t_vac':         'Vacances',
    'vac.t_perm':        'Permís personal',
    'vac.t_asuntos':     'Assumptes propis',
    'vac.t_baja':        'Baixa mèdica',
    'vac.desde':         'Des de',
    'vac.hasta':         'Fins a',
    'vac.notas':         'Notes (opcional)',
    'vac.notas_ph':      'Motiu o indicacions...',
    'vac.dias_sol':      'Dies sol·licitats: ',
    'vac.btn':           'Enviar sol·licitud',
    'vac.mis':           'Les meves sol·licituds',
    'vac.empty':         'No tens sol·licituds de vacances',
    'vac.empty_sub':     'Fes servir el formulari per sol·licitar vacances o permisos',
    'vac.err_solap':     'Ja tens una sol·licitud activa que coincideix amb aquestes dates.',
    'vac.err_sin_dias':  'Només et queden {n} dies de vacances disponibles (en sol·licites {s}).',
    'vac.cancelar_ok':   '✓ Vacances cancel·lades',
    'vac.cancelar_msg':  'La sol·licitud ha estat cancel·lada.',
    'vac.l_vac':         'Vacances',
    'vac.l_perm':        'Permís',
    'vac.l_asuntos':     'Assumptes propis',
    'vac.l_baja':        'Baixa mèdica',
    // Calendario
    'cal.eyebrow':       'La meva àrea',
    'cal.titulo':        'Els meus torns',
    'cal.sub':           'Els teus quadrants mensuals',
    'cal.ver_cal':       'Veure al calendari',
    'cal.ical':          'Exportar iCal',
    'cal.detalle':       'Detall del mes',
    'cal.no_turnos':     'No hi ha torns assignats aquest mes',
    'cal.ical_ok':       '📅 iCal exportat',
    'cal.ical_sin':      'No hi ha torns a',
    'cal.ical_sin2':     'per exportar.',
    // Tipos turno
    'tur.manana':        'Matí',
    'tur.tarde':         'Tarda',
    'tur.noche':         'Nit',
    'tur.guardia':       'Guàrdia',
    'tur.libre':         'Lliure',
    'tur.turno':         'Torn',
    // Admin general
    'adm.eyebrow':       'Administració',
    'adm.titulo':        'Tauler de control',
    'adm.sub':           "Gestió d'empleats i documents",
    // Tabs admin
    'tab.dashboard':     '📊 Dashboard',
    'tab.empleados':     'Empleats',
    'tab.subir':         'Pujar document',
    'tab.masivo':        'Pujada massiva ZIP',
    'tab.registro':      'Registre',
    'tab.solicitudes':   'Sol·licituds',
    'tab.turnos':        'Torns',
    'tab.importar':      'Importar',
    'tab.vacaciones':    'Vacances',
    'tab.resumen':       '📋 Resum vacacional',
    'tab.docs':          '📂 Documents',
    // Registro de empleados
    'reg.titulo':         'Sol·licituds de registre',
    'reg.f_pend':         'Pendents',
    'reg.f_todas':        'Totes',
    'reg.f_apr':          'Aprovades',
    'reg.f_rech':         'Rebutjades',
    'reg.actualizar':     'Actualitzar',
    'reg.modal_eyebrow':  'Registre d\'empleat',
    'reg.modal_titulo':   'Aprovar sol·licitud',
    'reg.dias_label':     'Dies de vacances / any',
    'reg.email_nota':     'Es crearà el compte i s\'enviarà un email d\'accés a l\'empleat.',
    'reg.confirmar':      'Aprovar i enviar accés',
    'reg.cancelar':       'Cancel·lar',
    'reg.aprobar':        'Aprovar',
    'reg.rechazar':       'Rebutjar',
    'reg.estado_pend':    'Pendent',
    'reg.estado_apr':     'Aprovada',
    'reg.estado_rech':    'Rebutjada',
    'reg.empty':          'No hi ha sol·licituds pendents.',
    'login.solicitar':    'Primera vegada? Sol·licitar accés →',
    // Dashboard
    'dash.sin_firmar':   'Sense signar quadrant',
    'dash.solicitudes':  'Sol·licituds pendents',
    'dash.actualizar':   '↺ Actualitzar',
    'dash.emp_activos':  'Empleats actius',
    'dash.plantilla':    'En plantilla',
    'dash.sol_pend':     'Sol·licituds pendents',
    'dash.revision':     'Requereixen revisió',
    'dash.vac_pend':     'Vacances pendents',
    'dash.cuad_firm':    'Quadrants signats',
    'dash.todos_firm':   '✓ Tots han signat el seu quadrant',
    'dash.sin_sol':      '✓ Sense sol·licituds pendents',
    'dash.gestionar':    'Gestionar →',
    // Empleados admin
    'emp.titulo':        'Empleats registrats',
    'emp.exportar':      '⬇ Exportar Excel',
    'emp.anadir':        '+ Afegir empleat',
    'emp.buscar_ph':     'Cercar per nom, correu o DNI…',
    'emp.f_todos':       'Tots',
    'emp.f_vig':         'Vigilants',
    'emp.f_aux':         'Auxiliars',
    'emp.f_coo':         'Coordinadors',
    'emp.f_adm':         'Administratius',
    'emp.nuevo':         'Nou empleat',
    'emp.nombre':        'Nom complet',
    'emp.nombre_ph':     'Carles Martínez López',
    'emp.email':         'Correu corporatiu',
    'emp.email_ph':      'cmartinez@enerpro.com',
    'emp.dni':           'DNI',
    'emp.dni_ph':        '12345678A',
    'emp.cargo':         'Càrrec',
    'emp.pass_ini':      'Contrasenya inicial',
    'emp.pass_ph':       'Mínim 6 caràcters',
    'emp.btn_crear':     'Crear empleat',
    'emp.btn_cancel':    'Cancel·lar',
    'emp.activo':        'Actiu',
    'emp.inactivo':      'Inactiu',
    'emp.editar':        '✏ Editar',
    'emp.ok':            '✓ Empleat creat correctament.',
    'emp.c_vig':         'Vigilant de seguretat',
    'emp.c_aux':         'Auxiliar de servei',
    'emp.c_coo':         'Coordinador',
    'emp.c_adm':         'Administratiu',
    // Editar empleado
    'edit.eyebrow':      'Administració',
    'edit.titulo':       'Editar empleat',
    'edit.nombre':       'Nom complet',
    'edit.email':        'Correu corporatiu',
    'edit.email_ph':     'email@enerpro.com',
    'edit.dni':          'DNI',
    'edit.cargo':        'Càrrec',
    'edit.dias':         'Dies vacances / any',
    'edit.estado':       'Estat',
    'edit.activo':       'Actiu',
    'edit.inactivo':     'Inactiu / Baixa',
    'edit.acceso':       "Accés al portal",
    'edit.reset_btn':    '🔄 Forçar canvi de contrasenya en el proper accés',
    'edit.guardar':      'Desar canvis',
    'edit.cancelar':     'Cancel·lar',
    'edit.guardando':    'Desant…',
    'edit.ok':           '✓ Dades actualitzades correctament.',
    'edit.reset_ok':     '✓ En el proper inici de sessió se li demanarà canviar la contrasenya.',
    // Subir doc
    'sub.titulo':        "Pujar document a empleat",
    'sub.empleado':      'Empleat',
    'sub.empleado_ph':   'Selecciona empleat...',
    'sub.tipo':          'Tipus de document',
    'sub.nombre':        'Nom del document',
    'sub.nombre_ph':     'Ex: Nòmina Maig 2026',
    'sub.archivo':       'Fitxer PDF',
    'sub.btn':           'Pujar document',
    'sub.ok':            '✓ Document pujat i assignat correctament.',
    // Tipos doc
    'tdoc.nomina':       'Nòmina',
    'tdoc.cuadrante':    'Quadrant',
    'tdoc.contrato':     'Contracte',
    'tdoc.protocolo':    'Protocol de seguretat',
    'tdoc.otro':         'Altre',
    // Subida masiva
    'masi.titulo':       'Pujada massiva per ZIP',
    'masi.tipo':         'Tipus de document',
    'masi.nombre':       'Nom base del document',
    'masi.nombre_ph':    'Ex: Nòmina Maig 2026',
    'masi.archivo':      'Fitxer ZIP',
    'masi.btn':          'Processar i pujar ZIP',
    'masi.proc':         'Processant...',
    // Solicitudes admin
    'sa.titulo':         "Sol·licituds d'empleats",
    'sa.f_todas':        'Totes',
    'sa.f_pend':         'Pendents',
    'sa.f_apr':          'Aprovades',
    'sa.f_rech':         'Rebutjades',
    'sa.exportar':       '⬇ Exportar Excel',
    'sa.actualizar':     'Actualitzar',
    'sa.empty':          'No hi ha sol·licituds',
    'sa.empty_sub':      "Les sol·licituds dels empleats apareixeran aquí",
    'sa.aprobar':        'Aprovar',
    'sa.rechazar':       'Rebutjar',
    'sa.aprobar_c':      '✓ Aprovar',
    'sa.rechazar_c':     '✕ Rebutjar',
    'sa.cmt_ph':         "Comentari per a l'empleat (opcional)...",
    'sa.cancelar':       'Cancel·lar',
    // Turnos admin
    'ta.titulo':         'Assignar torn',
    'ta.empleado':       'Empleat',
    'ta.empleado_ph':    'Selecciona empleat...',
    'ta.fecha':          'Data',
    'ta.tipo':           'Tipus de torn',
    'ta.inicio':         'Hora inici',
    'ta.fin':            'Hora fi',
    'ta.ubic':           'Ubicació (opcional)',
    'ta.ubic_ph':        'Ex: Centre Comercial Nord',
    'ta.notas':          'Notes (opcional)',
    'ta.notas_ph':       'Indicacions especials...',
    'ta.btn':            'Desar torn',
    'ta.proximos':       'Propers torns',
    'ta.actualizar':     '↺ Actualitzar',
    'ta.ok':             '✓ Torn assignat correctament.',
    'ta.empty':          'No hi ha torns propers',
    'ta.empty_sub':      'El coordinador assignarà torns quan sigui necessari',
    // Cuadrante mensual admin
    'cua.titulo':        'Quadrant del mes',
    'cua.sin_turnos':    'Sense torns assignats',
    'cua.empleado':      'Empleat',
    'cua.exportar':      '⬇ Exportar',
    // Dashboard charts
    'grf.sol_titulo':    'Sol·licituds · darrers 6 mesos',
    'grf.vac_titulo':    'Vacances usades per empleat · ',
    'grf.sol_empty':     'Sense dades de sol·licituds',
    'grf.vac_empty':     'Sense dades de vacances',
    // Masiva
    'am.titulo':         'Assignació massiva de torns',
    'am.tab_fecha':      '📅 Rang de dates',
    'am.tab_emp':        '👥 Diversos empleats',
    'am.desde':          'Des de',
    'am.hasta':          'Fins a',
    'am.inicio':         'Hora inici',
    'am.fin':            'Hora fi',
    'am.ubic_ph':        'Ex: Centre Comercial Nord',
    'am.excl':           'Excloure dissabtes i diumenges',
    'am.btn_fecha':      'Crear torns en el rang',
    'am.fecha':          'Data',
    'am.emp_label':      'Empleats',
    'am.sel_todos':      'Seleccionar tots',
    'am.desel_todos':    'Deseleccionar tots',
    'am.btn_emp':        'Crear torns per als seleccionats',
    // Vacaciones admin
    'va.titulo':         'Sol·licituds de vacances',
    'va.exportar':       '⬇ Exportar Excel',
    'va.actualizar':     '↺ Actualitzar',
    'va.f_pend':         'Pendents',
    'va.f_apr':          'Aprovades',
    'va.f_rech':         'Rebutjades',
    'va.f_can':          'Cancel·lades',
    'va.f_todas':        'Totes',
    'va.aprobar':        'Aprovar',
    'va.rechazar':       'Rebutjar',
    'va.aprobar_c':      '✓ Aprovar',
    'va.rechazar_c':     '✕ Rebutjar',
    'va.cmt_ph':         "Comentari per a l'empleat (opcional)...",
    'va.cancelar':       'Cancel·lar',
    'va.empty':          'Sense sol·licituds de vacances',
    'va.empty_sub':      "Les sol·licituds de vacances dels empleats apareixeran aquí",
    // Resumen vacacional
    'rv.titulo':         'Resum vacacional',
    'rv.c_todos':        'Tots els càrrecs',
    'rv.c_vig':          'Vigilants',
    'rv.c_aux':          'Auxiliars',
    'rv.c_coo':          'Coordinadors',
    'rv.c_adm':          'Administratius',
    'rv.exportar':       '⬇ Exportar Excel',
    'rv.actualizar':     '↺ Actualitzar',
    'rv.col_emp':        'Empleat',
    'rv.col_anual':      'Dies anuals',
    'rv.col_usados':     'Usats',
    'rv.col_rest':       'Restants',
    'rv.no_emp':         'No hi ha empleats actius',
    'rv.no_emp_sub':     "Els empleats actius apareixeran aquí quan estiguin donats d'alta",
    'rv.chart':          'Dies de vacances aprovades per mes · ',
    // Docs admin
    'da.titulo':         'Tots els documents',
    'da.emp_ph':         'Tots els empleats',
    'da.tipo_ph':        'Tots els tipus',
    'da.firm_ph':        'Signats i sense signar',
    'da.firm_si':        'Signats',
    'da.firm_no':        'Sense signar',
    'da.actualizar':     '↺ Actualitzar',
    'da.ver':            '👁 Veure',
    'da.empty':          'Sense documents amb els filtres seleccionats',
    'da.empty_sub':      'Prova amb altres filtres o espera que hi hagi documents',
    'da.badge_firm':     '✓ Signat',
    'da.badge_nofirm':   'Sense signar',
    // Importar
    'imp.titulo':        "Importar des d'Excel",
    'imp.archivo':       'Fitxer Excel (.xlsx)',
    'imp.plantilla':     '⬇ Baixar plantilla',
    'imp.preview':       'Vista prèvia',
    'imp.btn':           'Importar tots',
    'imp.importando':    'Important',
    // Demo
    'demo.titulo':       'Dades de demostració',
    'demo.btn_ins':      'Inserir empleats demo',
    'demo.btn_bor':      'Esborrar empleats demo',
    // PDF modal
    'pdf.nueva':         '↗ Pestanya nova',
    'pdf.cerrar':        '✕ Tancar',
    // Toasts
    'toast.doc_nuevo':   'Nou document rebut',
    'toast.firma_ok':    '✍ Lectura confirmada',
    'toast.sol_cancel':  '✓ Sol·licitud cancel·lada',
    'toast.sol_cancel_msg':"La sol·licitud ha estat cancel·lada.",
    'toast.vac_cancel':  '✓ Vacances cancel·lades',
    'toast.vac_cancel_msg':"La sol·licitud ha estat cancel·lada.",
    'toast.doc_elim':    '🗑 Document eliminat',
    'toast.doc_elim_msg':'El document ha estat eliminat correctament.',
    'toast.pass_ok':     '🔑 Contrasenya actualitzada',
    'toast.pass_ok_msg': 'La teva contrasenya ha estat canviada correctament.',
    'toast.sin_datos':   'ℹ️ Sense dades',
    'toast.no_emp':      'No hi ha empleats per exportar.',
    'toast.no_sol':      'No hi ha sol·licituds per exportar.',
    'toast.no_vac_exp':  'No hi ha sol·licituds de vacances per exportar.',
    // Estados
    'est.pendiente':     'pendent',
    'est.aprobada':      'aprovada',
    'est.rechazada':     'rebutjada',
    'est.cancelada':     'cancel·lada',
    // Genérico
    'g.cargando':        'Carregant...',
    'g.cancelar':        'Cancel·lar',
    'g.dias':            'dies',
    'g.dia':             'dia',
    // Idioma
    'lang.label':        '🌐 Idioma',
  }
};

function t(key) {
  return (I18N[_lang] && I18N[_lang][key]) || (I18N.es && I18N.es[key]) || key;
}
function getMes(i)      { return (I18N[_lang].meses   || I18N.es.meses)[i];   }
function getMesCorto(i) { return (I18N[_lang].meses_c || I18N.es.meses_c)[i]; }

// ─── AVATAR CON INICIALES ────────────────────────────────
var _avatarColors = ['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1','#f4511e','#3949ab','#00897b','#c0ca33'];
function avatarColor(nombre) {
  var h = 0;
  for (var i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) & 0x7fffffff;
  return _avatarColors[h % _avatarColors.length];
}
function avatarIni(nombre, size) {
  var parts = (nombre || '?').trim().split(/\s+/);
  var ini   = parts[0].charAt(0).toUpperCase() + (parts[1] ? parts[1].charAt(0).toUpperCase() : '');
  var s     = size || 36;
  var fs    = Math.round(s * 0.36);
  return '<div class="emp-avatar" style="width:' + s + 'px;height:' + s + 'px;font-size:' + fs + 'px;background:' + avatarColor(nombre) + '">' + ini + '</div>';
}

function copiarEmail(email, el) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(email).then(function() {
    mostrarToast('📋 Email copiado', email);
    if (el) { var prev = el.style.color; el.style.color = 'var(--gold)'; setTimeout(function(){ el.style.color = prev; }, 1200); }
  });
}

function getTipoTurno(tipo) {
  var m = { manana:t('tur.manana'), tarde:t('tur.tarde'), noche:t('tur.noche'),
            guardia:t('tur.guardia'), libre:t('tur.libre'), turno:t('tur.turno') };
  return m[tipo] || tipo;
}
function getTipoVac(tipo) {
  var m = { vacaciones:t('vac.l_vac'), permiso:t('vac.l_perm'),
            asuntos_propios:t('vac.l_asuntos'), baja_medica:t('vac.l_baja') };
  return m[tipo] || tipo;
}
function getSolTipoShort(tipo) {
  var m = {
    'Solicitud de vacaciones':t('sol.ts_vac'),  'Solicitud de permiso':t('sol.ts_perm'),
    'Cambio de turno':t('sol.ts_turno'),         'Baja médica':t('sol.ts_baja'),
    'Consulta general':t('sol.ts_consulta')
  };
  return m[tipo] || tipo;
}
function getEstadoBadge(estado) {
  var cls = estado === 'aprobada' ? 'badge-green' : estado === 'rechazada' ? 'badge-red'
          : estado === 'cancelada' ? 'badge-grey' : 'badge-yellow';
  return { cls: cls, lbl: t('est.' + estado) || estado };
}

function cambiarIdioma(lang) {
  if (lang === _lang) return;
  _lang = lang;
  localStorage.setItem('enerpro_lang', lang);
  aplicarIdioma();
}

function aplicarIdioma() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.documentElement.lang = _lang;
  // Resaltar botón de idioma activo (sidebar + login)
  ['langBtnEs','loginLangEs'].forEach(function(id) {
    var b = document.getElementById(id);
    if (b) b.classList.toggle('primary', _lang === 'es');
  });
  ['langBtnCa','loginLangCa'].forEach(function(id) {
    var b = document.getElementById(id);
    if (b) b.classList.toggle('primary', _lang === 'ca');
  });
  var mobileToggle = document.getElementById('langToggleMobile');
  if (mobileToggle) mobileToggle.textContent = _lang.toUpperCase();
  // Re-renderizar contenido dinámico si el usuario está logueado
  if (!currentUser) return;
  var ap = document.querySelector('.page.active');
  if (!ap) return;
  var pid = ap.id;
  if (pid === 'page-inicio' || pid === 'page-documentos' || pid === 'page-calendario') cargarDocumentos();
  if (pid === 'page-solicitudes') cargarMisSolicitudes();
  if (pid === 'page-vacaciones') cargarVacaciones();
  if (pid === 'page-calendario') cargarCalendario();
  if (pid === 'page-admin') {
    if (currentAdminTab === 'dashboard')         cargarDashboard();
    else if (currentAdminTab === 'empleados')    aplicarFiltrosEmpleados();
    else if (currentAdminTab === 'solicitudes-admin') cargarSolicitudesAdmin();
    else if (currentAdminTab === 'vacaciones-admin')  cargarVacacionesAdmin();
    else if (currentAdminTab === 'turnos-admin') cargarTurnosAdmin();
    else if (currentAdminTab === 'resumen-vac')  cargarResumenVacaciones();
    else if (currentAdminTab === 'docs-admin')   cargarDocumentosAdmin();
  }
  var wmEl = document.getElementById('welcomeMsg');
  if (wmEl && currentEmpleado) {
    wmEl.textContent = t('ini.bienvenido') + ', ' + currentEmpleado.nombre.split(' ')[0];
  }
}

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

function emptyState(iconPaths, title, sub) {
  return '<div class="empty-state">' +
    '<div class="empty-state-icon"><svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24">' + iconPaths + '</svg></div>' +
    '<div class="empty-state-title">' + title + '</div>' +
    (sub ? '<div class="empty-state-sub">' + sub + '</div>' : '') +
  '</div>';
}

function skelCalendario() {
  var hdrs = ['L','M','X','J','V','S','D'].map(function(d) {
    return '<div class="cal-day-hdr">' + d + '</div>';
  }).join('');
  var cell = '<div class="cal-day" style="pointer-events:none;min-height:64px">' +
    '<span class="skel" style="display:block;width:14px;height:10px;border-radius:3px;margin-bottom:6px"></span>' +
    '<span class="skel" style="display:block;width:38px;height:8px;border-radius:3px;opacity:0.6"></span>' +
  '</div>';
  var cells = '';
  for (var i = 0; i < 35; i++) cells += cell;
  return hdrs + cells;
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

// ─── BADGE DOCUMENTOS ─────────────────────────────────────

function actualizarBadgeAdmin(count) {
  var badge       = document.getElementById('adminBadge');
  var badgeMobile = document.getElementById('adminBadgeMobile');
  var label   = count > 99 ? '99+' : String(count);
  var mostrar = count > 0;
  if (badge)       { badge.textContent       = label; badge.style.display       = mostrar ? 'inline-flex' : 'none'; }
  if (badgeMobile) { badgeMobile.textContent = label; badgeMobile.style.display = mostrar ? 'flex'        : 'none'; }
}

async function cargarBadgeAdmin() {
  if (!currentIsAdmin) return;
  var [solRes, vacRes, regRes] = await Promise.all([
    sb.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado', 'pendiente'),
    sb.from('vacaciones').select('*',  { count:'exact', head:true }).eq('estado', 'pendiente'),
    sb.from('solicitudes_registro').select('*', { count:'exact', head:true }).eq('estado', 'pendiente')
  ]);
  actualizarBadgeAdmin((solRes.count || 0) + (vacRes.count || 0) + (regRes.count || 0));
  _actualizarBadgeRegistro(regRes.count || 0);
}

function actualizarBadgeDocumentos(count) {
  _docBadgeCount = count;
  var badge       = document.getElementById('docBadge');
  var badgeMobile = document.getElementById('docBadgeMobile');
  var label = count > 99 ? '99+' : count > 0 ? String(count) : '0';
  var mostrar = count > 0;
  if (badge) {
    badge.textContent = label;
    badge.style.display = mostrar ? 'inline-flex' : 'none';
  }
  if (badgeMobile) {
    badgeMobile.textContent = label;
    badgeMobile.style.display = mostrar ? 'flex' : 'none';
  }
}

// LOGIN
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('loginPassword').addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
var rpEmailEl = document.getElementById('rpEmail');
if (rpEmailEl) rpEmailEl.addEventListener('keydown', function(e){ if(e.key==='Enter') enviarRecuperarPass(); });
var rpSetNuevaEl = document.getElementById('rpSetNueva');
if (rpSetNuevaEl) rpSetNuevaEl.addEventListener('keydown', function(e){ if(e.key==='Enter') confirmarResetPassRecuperacion(); });

function abrirRecuperarPass() {
  var loginErr = document.getElementById('loginError');
  if (loginErr) loginErr.style.display = 'none';
  document.getElementById('loginFormView').style.display = 'none';
  document.getElementById('recuperarPassView').style.display = 'block';
  var rpErr = document.getElementById('rpError');
  var rpOk  = document.getElementById('rpOk');
  if (rpErr) rpErr.style.display = 'none';
  if (rpOk)  rpOk.style.display  = 'none';
  var loginEmail = document.getElementById('loginEmail').value.trim();
  var rpEmail = document.getElementById('rpEmail');
  if (loginEmail) rpEmail.value = loginEmail;
  rpEmail.focus();
}

function volverAlLogin() {
  document.getElementById('recuperarPassView').style.display = 'none';
  document.getElementById('loginFormView').style.display = 'block';
  var rpErr = document.getElementById('rpError');
  var rpOk  = document.getElementById('rpOk');
  if (rpErr) rpErr.style.display = 'none';
  if (rpOk)  rpOk.style.display  = 'none';
  document.getElementById('loginPassword').focus();
}

async function enviarRecuperarPass() {
  var email = document.getElementById('rpEmail').value.trim();
  var err = document.getElementById('rpError');
  var ok  = document.getElementById('rpOk');
  var btn = document.getElementById('rpBtn');
  err.style.display = 'none';
  ok.style.display  = 'none';
  if (!email || email.indexOf('@') < 1) {
    err.style.display = 'block';
    err.textContent = t('rp.err_email');
    return;
  }
  btn.disabled = true;
  btn.textContent = t('rp.enviando');
  var redirectTo = window.location.origin + window.location.pathname;
  var { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
  btn.disabled = false;
  btn.textContent = t('rp.btn');
  if (error) {
    err.style.display = 'block';
    err.textContent = 'Error: ' + error.message;
    return;
  }
  ok.style.display = 'block';
  ok.textContent = t('rp.ok');
}

function mostrarResetPassRecuperacion() {
  _modoRecuperacionPass = true;
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('cambioPassModal').style.display = 'none';
  var modal = document.getElementById('resetPassRecuperacionModal');
  modal.style.display = 'flex';
  document.getElementById('rpSetError').style.display = 'none';
  document.getElementById('rpSetNueva').value = '';
  document.getElementById('rpSetConfirma').value = '';
  setTimeout(function() { document.getElementById('rpSetNueva').focus(); }, 80);
}

async function confirmarResetPassRecuperacion() {
  var nueva    = document.getElementById('rpSetNueva').value;
  var confirma = document.getElementById('rpSetConfirma').value;
  var err = document.getElementById('rpSetError');
  var btn = document.getElementById('rpSetBtn');
  err.style.display = 'none';
  if (nueva.length < 8) {
    err.style.display = 'block';
    err.textContent = t('cp.err_corta');
    return;
  }
  if (nueva !== confirma) {
    err.style.display = 'block';
    err.textContent = t('cp.err_match');
    return;
  }
  btn.disabled = true;
  btn.textContent = t('cp.guardando');
  var { error: updErr } = await sb.auth.updateUser({ password: nueva });
  if (updErr) {
    err.style.display = 'block';
    err.textContent = 'Error: ' + updErr.message;
    btn.disabled = false;
    btn.textContent = t('rp.set_btn');
    return;
  }
  btn.textContent = t('rp.set_ok');
  document.getElementById('resetPassRecuperacionModal').style.display = 'none';
  _modoRecuperacionPass = false;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  var { data: userData } = await sb.auth.getUser();
  if (userData && userData.user) {
    var { data: emp } = await sb.from('empleados').select('*').eq('email', userData.user.email).single();
    if (emp && emp.debe_cambiar_password) {
      await sb.from('empleados').update({ debe_cambiar_password: false }).eq('id', emp.id);
    }
    await aplicarSesionDesdeUser(userData.user);
    return;
  }
  btn.disabled = false;
  btn.textContent = t('rp.set_btn');
  document.getElementById('loginWrap').style.display = 'flex';
  volverAlLogin();
}

async function rechazarEmpleadoInactivo() {
  currentUser = null;
  currentEmpleado = null;
  currentIsAdmin = false;
  await sb.auth.signOut();
  document.getElementById('app').style.display = 'none';
  document.getElementById('cambioPassModal').style.display = 'none';
  document.getElementById('resetPassRecuperacionModal').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'flex';
  var err = document.getElementById('loginError');
  if (err) {
    err.style.display = 'block';
    err.textContent = t('login.inactivo');
  }
  volverAlLogin();
}

async function aplicarSesionDesdeUser(user) {
  if (!user || !user.email || _modoRecuperacionPass) return;
  currentUser = user;
  var email = user.email;
  var { data: emp } = await sb.from('empleados').select('*').eq('email', email).single();
  currentEmpleado = emp;
  currentIsAdmin = email.includes('admin') || (emp && emp.cargo === 'Coordinador');

  if (emp && emp.activo === false) {
    await rechazarEmpleadoInactivo();
    return;
  }

  if (emp && emp.debe_cambiar_password) {
    document.getElementById('loginWrap').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('resetPassRecuperacionModal').style.display = 'none';
    document.getElementById('cambioPassModal').style.display = 'flex';
    document.getElementById('cpNueva').focus();
    return;
  }
  iniciarApp();
}

async function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPassword').value;
  var err   = document.getElementById('loginError');
  err.style.display = 'none';
  var btn = document.getElementById('btnLogin');
  btn.textContent = t('login.accediendo'); btn.disabled = true;
  var { data, error } = await sb.auth.signInWithPassword({ email: email, password: pass });
  btn.textContent = t('login.btn'); btn.disabled = false;
  if (error) { err.style.display = 'block'; return; }
  await aplicarSesionDesdeUser(data.user);
}

// ─── S3: TURNO HOY ────────────────────────────────────────
async function cargarTurnoHoy() {
  var banner = document.getElementById('turnoHoyBanner');
  if (!banner || !currentEmpleado) return;
  var hoy = new Date().toISOString().split('T')[0];
  var res = await sb.from('turnos').select('*')
    .eq('empleado_id', currentEmpleado.id)
    .eq('fecha', hoy)
    .limit(1);
  var data = res.data;
  if (!data || !data.length) { banner.style.display = 'none'; return; }
  var tr   = data[0];
  var tipo = tr.tipo || 'turno';
  var tipoLabel = getTipoTurno(tipo);
  var horas = tr.hora_inicio
    ? tr.hora_inicio.slice(0,5) + (tr.hora_fin ? ' – ' + tr.hora_fin.slice(0,5) : '')
    : '';
  var ubic = tr.ubicacion ? ' · ' + tr.ubicacion : '';
  banner.innerHTML =
    '<div class="turno-banner t-' + tipo + '">' +
      '<span class="cal-pill t-' + tipo + '" style="flex-shrink:0;font-size:0.65rem;padding:0.25rem 0.625rem">' + tipoLabel + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:0.82rem;font-weight:600;color:var(--text)">' + t('ini.turno_hoy') + '</div>' +
        (horas || ubic
          ? '<div style="font-size:0.73rem;color:var(--text2);margin-top:1px">' + horas + ubic + '</div>'
          : '') +
      '</div>' +
      '<button class="btn-sm" onclick="navigateToPage(\'calendario\')">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:11px;height:11px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
        t('nav.calendario') + '</button>' +
    '</div>';
  banner.style.display = 'block';
}

// ─── S3: STAT VAC (progress bar) ─────────────────────────
async function cargarStatVacInicio() {
  var card  = document.getElementById('statVacCard');
  var statEl = document.getElementById('statVac');
  if (!card || !currentEmpleado) return;
  var ano = new Date().getFullYear();
  var res = await sb.from('vacaciones')
    .select('fecha_inicio, fecha_fin')
    .eq('empleado_id', currentEmpleado.id)
    .eq('estado', 'aprobada')
    .gte('fecha_inicio', ano + '-01-01')
    .lte('fecha_fin', ano + '-12-31');
  var total   = currentEmpleado.dias_vacaciones_anuales || 22;
  var usados  = 0;
  (res.data || []).forEach(function(v) {
    usados += diasEntre(v.fecha_inicio, v.fecha_fin);
  });
  var restantes = Math.max(0, total - usados);
  var pct       = total > 0 ? Math.min(100, Math.round((usados / total) * 100)) : 0;
  animateValue(statEl, restantes, 700);
  var sub = document.getElementById('statVacSub');
  if (sub) sub.textContent = t('ini.vac_de') + ano;
  var bar = document.getElementById('vacProgressBar');
  if (bar) setTimeout(function() { bar.style.width = pct + '%'; }, 250);
  card.style.display = '';
}

// ─── S3: PENDIENTES DE ATENCIÓN ───────────────────────────
async function cargarPendientesAtencion(docs) {
  var section = document.getElementById('pendienteSection');
  if (!section || !currentEmpleado) return;
  var sinFirmar = (docs || []).filter(function(d) { return !d.firmado; });
  var res = await sb.from('solicitudes')
    .select('id, tipo, estado, created_at')
    .eq('empleado_id', currentEmpleado.id)
    .in('estado', ['aprobada', 'rechazada'])
    .order('created_at', { ascending: false })
    .limit(3);
  var solResp = res.data || [];
  if (!sinFirmar.length && !solResp.length) {
    section.style.display = 'none';
    return;
  }
  var total = sinFirmar.length + solResp.length;
  var html = '<div class="card" style="padding:0;border-top:2px solid var(--gold)">' +
    '<div class="pend-header">' +
      '<span>' + t('ini.pend_titulo') + '</span>' +
      '<span class="badge badge-yellow">' + total + '</span>' +
    '</div>';
  sinFirmar.slice(0, 3).forEach(function(doc) {
    html +=
      '<div class="pend-item">' +
        '<div style="width:32px;height:32px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(245,184,0,0.1);color:var(--gold)">' +
          docIconSVG(doc.tipo) +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:0.82rem;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + doc.nombre + '</div>' +
          '<div style="font-size:0.7rem;color:var(--muted);margin-top:1px">' + t('ini.pend_firmar') + ' · ' + doc.tipo + '</div>' +
        '</div>' +
        '<button class="btn-sm primary" onclick="navigateToPage(\'documentos\')" style="font-size:0.71rem">' + t('ini.pend_ver') + '</button>' +
      '</div>';
  });
  solResp.forEach(function(s) {
    var eb    = getEstadoBadge(s.estado);
    var ok    = s.estado === 'aprobada';
    var fecha = new Date(s.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
    html +=
      '<div class="pend-item">' +
        '<div style="width:32px;height:32px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' +
          (ok ? 'rgba(27,122,69,0.1)' : 'rgba(220,38,38,0.1)') + ';color:' + (ok ? 'var(--green)' : 'var(--red)') + '">' +
          '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:0.82rem;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + getSolTipoShort(s.tipo) + '</div>' +
          '<div style="font-size:0.7rem;color:var(--muted);margin-top:1px">' + t('ini.pend_resp') + ' · ' + fecha + '</div>' +
        '</div>' +
        '<span class="badge ' + eb.cls + '" style="font-size:0.68rem">' + eb.lbl + '</span>' +
      '</div>';
  });
  html += '</div>';
  section.innerHTML = html;
  section.style.display = 'block';
}

function iniciarApp() {
  var emp    = currentEmpleado;
  var email  = currentUser ? currentUser.email : '';
  var isAdmin = currentIsAdmin;
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('cambioPassModal').style.display = 'none';
  document.getElementById('resetPassRecuperacionModal').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('userName').textContent = emp ? emp.nombre : email;
  document.getElementById('userAvatar').textContent = emp ? emp.nombre.charAt(0).toUpperCase() : '?';
  var mobileUser = document.getElementById('mobileUserName');
  if (mobileUser) mobileUser.textContent = emp ? emp.nombre.split(' ')[0] : email.split('@')[0];
  document.getElementById('welcomeMsg').textContent = t('ini.bienvenido') + ', ' + (emp ? emp.nombre.split(' ')[0] : t('ini.empleado'));
  var mesFmt = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  var mesLabel = mesFmt.charAt(0).toUpperCase() + mesFmt.slice(1);
  document.getElementById('welcomeSub').textContent = emp ? emp.cargo + ' · ' + mesLabel : mesLabel;
  if (isAdmin) {
    document.getElementById('sidebarRole').textContent = t('sidebar.admin_rol');
    document.getElementById('userRoleLabel').textContent = t('sidebar.admin_rol');
    document.querySelectorAll('.admin-only, .admin-only-mobile').forEach(function(el){ el.style.display='flex'; });
    cargarEmpleados();
    cargarDashboard();
  }
  cargarDocumentos();
  cargarTurnoHoy();
  cargarStatVacInicio();
  pedirPermisoNotificaciones();
  suscribirDocumentosNuevos();
  suscribirSolicitudesEmpleado();
  suscribirVacacionesEmpleado();
  if (isAdmin) {
    suscribirSolicitudesAdmin();
    suscribirVacacionesAdmin();
    cargarBadgeAdmin();
  }
}

async function confirmarCambioPassword() {
  var nueva    = document.getElementById('cpNueva').value;
  var confirma = document.getElementById('cpConfirma').value;
  var err = document.getElementById('cpError');
  var btn = document.getElementById('cpBtn');
  err.style.display = 'none';
  if (nueva.length < 8) {
    err.style.display = 'block'; err.textContent = t('cp.err_corta'); return;
  }
  if (nueva !== confirma) {
    err.style.display = 'block'; err.textContent = t('cp.err_match'); return;
  }
  btn.disabled = true; btn.textContent = t('cp.guardando');
  var { error: updErr } = await sb.auth.updateUser({ password: nueva });
  if (updErr) {
    err.style.display = 'block'; err.textContent = 'Error: ' + updErr.message;
    btn.disabled = false; btn.textContent = t('cp.btn');
    return;
  }
  if (currentEmpleado) {
    await sb.from('empleados').update({ debe_cambiar_password: false }).eq('id', currentEmpleado.id);
    currentEmpleado.debe_cambiar_password = false;
  }
  btn.textContent = t('cp.ok');
  setTimeout(function() {
    btn.disabled = false;
    btn.textContent = t('cp.btn');
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
  // Scroll to top on every page change
  var mainEl = document.querySelector('.main');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
  if (page === 'calendario') { cargarCalendario(); cargarDocumentos(); }
  if (page === 'vacaciones') cargarVacaciones();
  if (page === 'solicitudes') cargarMisSolicitudes();
  if (page === 'documentos') actualizarBadgeDocumentos(0);
  if (page === 'perfil') cargarPerfil();
}

document.querySelectorAll('.nav-item').forEach(function(btn){
  btn.addEventListener('click', function(){ navigateToPage(this.getAttribute('data-page')); });
});

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
  var cpPerfilModal = document.getElementById('cambioPassPerfilModal');
  if (cpPerfilModal) cpPerfilModal.style.display = 'none';
  document.querySelectorAll('.admin-only, .admin-only-mobile').forEach(function(el){ el.style.display='none'; });
  navigateToPage('inicio');
}

function confirmarLogout() {
  if (confirm(t('sidebar.logout') + ' — ¿Seguro que quieres cerrar la sesión?')) doLogout();
}
document.getElementById('btnLogout').addEventListener('click', confirmarLogout);
var btnLogoutMobile = document.getElementById('btnLogoutMobile');
if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', confirmarLogout);

// DOCUMENTOS
/* Format a cuadrante fecha field into a readable "Mes YYYY" string.
   Falls back to extracting year/month from the document name. */
function _formatFechaCuadrante(fecha, nombre) {
  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if (fecha) {
    var parts = fecha.split('-');
    if (parts.length >= 2) {
      var m = parseInt(parts[1], 10) - 1;
      var y = parts[0];
      if (m >= 0 && m < 12) return MESES[m] + ' ' + y;
    }
  }
  // Try to extract from name e.g. "Cuadrante 01-2026" or "Cuadrante Enero 2026"
  var mNombre = (nombre || '').match(/(\d{4})/);
  if (mNombre) return mNombre[1];
  return fecha || '—';
}

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

  var unreadCount = data.filter(function(d){ return !d.leido; }).length;
  animateValue(document.getElementById('statDocs'),   data.length, 700);
  animateValue(document.getElementById('statUnread'), unreadCount, 700);
  var unreadCard = document.getElementById('statUnreadCard');
  if (unreadCard) unreadCard.style.display = unreadCount > 0 ? '' : 'none';
  var activePage = document.querySelector('.page.active');
  if (!activePage || activePage.id !== 'page-documentos') {
    actualizarBadgeDocumentos(unreadCount);
  }
  renderDocs(data, 'recentDocs', 3);
  renderDocs(data, 'docsList');
  cargarPendientesAtencion(data);
  var cuadrantes = data.filter(function(d){ return d.tipo === 'cuadrante'; });
  var cuadranteDiv = document.getElementById('cuadranteDestacado');
  var cuadranteMes = document.getElementById('cuadranteMes');
  if (cuadrantes.length) {
    if (cuadranteMes) cuadranteMes.textContent = cuadrantes.length > 1 ? cuadrantes.length + ' docs' : (cuadrantes[0].fecha || 'Actual');
    if (cuadranteDiv) cuadranteDiv.innerHTML = cuadrantes.map(function(cuadrante, i) {
      var cSafeName = cuadrante.nombre.replace(/'/g, "\\'");
      var cSafeUrl  = cuadrante.url.replace(/'/g, "\\'");
      var cFirmaHtml = cuadrante.firmado
        ? '<span class="badge badge-green" style="font-size:var(--text-xs)">' + t('doc.firmado') + '</span>'
        : '<button class="btn-sm gold" style="white-space:nowrap" onclick="firmarDoc(\'' + cuadrante.id + '\', \'' + cSafeName + '\', this)">' + t('doc.confirmar') + '</button>';
      var unread = cuadrante.leido ? '' : '<span class="dt-badge-new" style="vertical-align:middle;margin-left:0.375rem">' + t('doc.nuevo') + '</span>';
      var mesLabel = _formatFechaCuadrante(cuadrante.fecha, cuadrante.nombre);
      var border = i < cuadrantes.length - 1 ? 'border-bottom:1px solid var(--border);' : '';
      return '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding:0.875rem 1.25rem;' + border + '">' +
        '<div style="display:flex;align-items:center;gap:0.875rem;min-width:0">' +
        '<div class="doc-icon" style="width:38px;height:38px;flex-shrink:0;background:var(--gold-light);color:var(--gold-dark)">' + docIconSVG('cuadrante') + '</div>' +
        '<div style="min-width:0">' +
        '<div style="font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:18rem">' + cuadrante.nombre + unread + '</div>' +
        '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:2px">' + mesLabel + '</div>' +
        '</div></div>' +
        '<div style="display:flex;gap:0.375rem;flex-wrap:wrap;align-items:center;flex-shrink:0">' +
        '<button class="btn-sm primary" onclick="verDoc(\'' + cSafeUrl + '\', \'' + cSafeName + '\')">' + t('doc.ver_cuad') + '</button>' +
        '<button class="btn-sm" onclick="descargarDoc(\'' + cuadrante.id + '\', \'' + cSafeUrl + '\', \'' + cSafeName + '\')">' + t('doc.descargar') + '</button>' +
        cFirmaHtml +
        '</div></div>';
    }).join('');
  } else {
    if (cuadranteMes) cuadranteMes.style.display = 'none';
    if (cuadranteDiv) cuadranteDiv.innerHTML = '<div style="color:var(--muted);font-size:var(--text-base);padding:1.5rem">' + t('doc.no_cuad') + '</div>';
  }
  _renderCuadrantesEnTurnos(cuadrantes);
}

function _renderCuadrantesEnTurnos(cuadrantes) {
  var el = document.getElementById('cuadrantesListTurnos');
  if (!el) return;
  var list = cuadrantes || (allDocs || []).filter(function(d){ return d.tipo === 'cuadrante'; });
  if (!list.length) {
    el.innerHTML = '<div style="padding:2.5rem 1.5rem;text-align:center;color:var(--muted);font-size:var(--text-base)">' + t('doc.no_cuad') + '</div>';
    return;
  }
  el.innerHTML = list.map(function(c, i) {
    var safeName  = c.nombre.replace(/'/g, "\\'");
    var safeUrl   = c.url.replace(/'/g, "\\'");
    var mesLabel  = _formatFechaCuadrante(c.fecha, c.nombre);
    var firmaHtml = c.firmado
      ? '<span class="badge badge-green">' + t('doc.firmado') + '</span>'
      : '<button class="btn-sm gold" style="white-space:nowrap" onclick="firmarDoc(\'' + c.id + '\', \'' + safeName + '\', this)">' + t('doc.confirmar') + '</button>';
    var unread = c.leido ? '' : '<span class="dt-badge-new" style="vertical-align:middle;margin-left:0.375rem">' + t('doc.nuevo') + '</span>';
    var border = i < list.length - 1 ? 'border-bottom:1px solid var(--border);' : '';
    return '<div style="display:flex;align-items:center;gap:1.25rem;padding:1.125rem 1.5rem;' + border + '">' +
      '<div style="width:44px;height:44px;flex-shrink:0;border-radius:var(--r-sm);background:var(--gold-light);color:var(--gold-dark);display:flex;align-items:center;justify-content:center">' + docIconSVG('cuadrante') + '</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:var(--text-md);font-weight:600;color:var(--text)">' + mesLabel + unread + '</div>' +
      '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + c.nombre + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0">' +
      firmaHtml +
      '<button class="btn-sm primary" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')">' + t('doc.ver_cuad') + '</button>' +
      '<button class="btn-sm" onclick="descargarDoc(\'' + c.id + '\', \'' + safeUrl + '\', \'' + safeName + '\')">' + t('doc.descargar') + '</button>' +
      '</div></div>';
  }).join('');
}

function renderDocs(docs, containerId, limit) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var list = limit ? docs.slice(0, limit) : docs;
  if (!list.length) {
    container.innerHTML = emptyState('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>', t('doc.empty'), t('doc.empty_sub'));
    return;
  }
  // For dashboard preview (limit=3): keep compact card rows
  if (limit) {
    container.innerHTML = list.map(function(doc) {
      var ic = _DOC_IC[doc.tipo] || { bg:'var(--surface2)', color:'var(--text2)' };
      var safeName = doc.nombre.replace(/'/g, "\\'");
      var safeUrl  = doc.url.replace(/'/g, "\\'");
      var unread = doc.leido ? '' : '<span class="dt-badge-new">' + t('doc.nuevo') + '</span>';
      return '<div class="doc-item">' +
        '<div class="doc-info"><div class="doc-icon" style="background:' + ic.bg + ';color:' + ic.color + '">' + docIconSVG(doc.tipo) + '</div>' +
        '<div><div class="doc-name">' + doc.nombre + unread + '</div>' +
        '<div class="doc-meta">' + (doc.fecha||'') + ' · ' + doc.tipo + '</div></div></div>' +
        '<button class="btn-sm primary" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')">' + t('doc.ver') + '</button>' +
        '</div>';
    }).join('');
    return;
  }
  // Full doc list: proper table
  var tipos = { nomina: t('doc.nominas'), cuadrante: t('doc.cuadrantes'), contrato: t('doc.contratos') };
  var rows = list.map(function(doc, i) {
    var ic = _DOC_IC[doc.tipo] || { bg:'var(--surface2)', color:'var(--text2)' };
    var safeName = doc.nombre.replace(/'/g, "\\'");
    var safeUrl  = doc.url.replace(/'/g, "\\'");
    var unread   = doc.leido ? '' : '<span class="dt-badge-new">' + t('doc.nuevo') + '</span>';
    var estadoCell = doc.firmado
      ? '<span class="dt-badge-ok"><svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:0.75rem;height:0.75rem"><polyline points="20 6 9 17 4 12"/></svg>' + t('doc.firmado') + '</span>'
      : '<span class="dt-badge-pend">' + t('doc.firmar') + '</span>';
    var actions =
      '<button class="dt-btn" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')" title="' + t('doc.ver') + '">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:0.85rem;height:0.85rem"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '</button>' +
      '<button class="dt-btn" onclick="descargarDoc(\'' + doc.id + '\', \'' + safeUrl + '\', \'' + safeName + '\')" title="' + t('doc.descargar') + '">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:0.85rem;height:0.85rem"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
      '</button>' +
      (!doc.firmado ? '<button class="dt-btn dt-btn-sign" onclick="firmarDoc(\'' + doc.id + '\', \'' + safeName + '\', this)" title="' + t('doc.firmar') + '">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:0.85rem;height:0.85rem"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
      '</button>' : '') +
      (currentIsAdmin ? '<button class="dt-btn dt-btn-del" onclick="eliminarDoc(\'' + doc.id + '\', \'' + safeUrl + '\')" title="Eliminar">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:0.85rem;height:0.85rem"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>' +
      '</button>' : '');
    var fechaLabel = doc.tipo === 'cuadrante'
      ? _formatFechaCuadrante(doc.fecha, doc.nombre)
      : (doc.fecha || '—');
    return '<tr style="animation:fadeIn 0.22s ease both;animation-delay:' + (i * 30) + 'ms">' +
      '<td class="dt-tipo-cell"><div class="doc-icon" style="background:' + ic.bg + ';color:' + ic.color + '">' + docIconSVG(doc.tipo) + '</div></td>' +
      '<td><span class="dt-nombre">' + doc.nombre + '</span>' + unread + '</td>' +
      '<td class="dt-fecha">' + fechaLabel + '</td>' +
      '<td>' + estadoCell + '</td>' +
      '<td class="dt-actions">' + actions + '</td>' +
      '</tr>';
  }).join('');
  container.innerHTML =
    '<table class="doc-table">' +
      '<thead><tr>' +
        '<th style="width:3rem"></th>' +
        '<th>' + t('doc.col_nombre') + '</th>' +
        '<th>' + t('doc.col_fecha') + '</th>' +
        '<th>' + t('doc.col_estado') + '</th>' +
        '<th style="text-align:right">' + t('doc.col_acc') + '</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}

function filterDocs(tipo) {
  document.querySelectorAll('.doc-filter').forEach(function(b){ b.classList.remove('primary'); });
  var active = document.querySelector('.doc-filter[data-filter="' + tipo + '"]');
  if (active) active.classList.add('primary');
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
  if (error) { mostrarToast('❌ Error al descargar', 'No se pudo descargar el documento.'); return; }
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
  var old = modal.querySelector('.pdf-fallback');
  if (old) old.remove();
  frame.style.display = 'block';
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
  frame.src = data.signedUrl;
  if (link) link.href = data.signedUrl;
}

function cerrarVisor() {
  var modal = document.getElementById('pdfModal');
  var frame = document.getElementById('pdfFrame');
  modal.style.display = 'none';
  frame.src = '';
  frame.style.display = 'block';
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
    if (ok) { ok.style.display = 'block'; ok.textContent = '✓ Solicitud enviada. El coordinador la revisará en breve.'; }
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
    container.innerHTML = emptyState('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', t('sol.empty'), t('sol.empty_sub'));
    return;
  }
  var delay = 0;
  container.innerHTML = data.map(function(s) {
    var eb = getEstadoBadge(s.estado);
    var fecha   = new Date(s.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    var tipoLbl = getSolTipoShort(s.tipo);
    var btnCancelar = s.estado === 'pendiente'
      ? '<button class="btn-sm" onclick="cancelarSolicitud(\'' + s.id + '\')" ' +
        'style="margin-left:0.5rem;color:var(--muted);border-color:rgba(255,255,255,0.1);font-size:0.68rem" ' +
        'title="Cancelar solicitud">' + t('sol.cancelar') + '</button>'
      : '';
    var d = delay; delay += 50;
    return '<div class="vac-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<span class="badge badge-blue vac-tipo" style="min-width:6rem;justify-content:center">' + tipoLbl + '</span>' +
      '<span class="vac-fechas">' + (s.fechas || '—') +
        (s.motivo    ? '<br><span style="font-size:0.72rem;color:var(--muted)">'  + s.motivo    + '</span>' : '') +
        (s.comentario ? '<br><span style="font-size:0.72rem;color:var(--gold)">💬 ' + s.comentario + '</span>' : '') + '</span>' +
      '<span class="vac-dias" style="min-width:5.5rem;font-size:0.75rem;color:var(--muted)">' + fecha + '</span>' +
      '<span class="badge ' + eb.cls + '">' + eb.lbl + '</span>' +
      btnCancelar +
      '</div>';
  }).join('');
}

// SOLICITUDES - ADMIN
async function cargarSolicitudesAdmin() {
  var container = document.getElementById('solicitudesAdminList');
  if (!container) return;
  container.innerHTML = skelDocs(4);
  var filtro = (document.getElementById('solAdminFiltro') || {}).value || 'todas';
  var q = sb.from('solicitudes').select('*, empleados(nombre)').order('created_at', { ascending: false });
  if (filtro !== 'todas') q = q.eq('estado', filtro);
  var { data, error } = await q;
  _solAdminData = data || [];
  if (error || !_solAdminData.length) {
    container.innerHTML = emptyState('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', t('sa.empty'), t('sa.empty_sub'));
    return;
  }
  filtrarSolicitudesAdmin();
}

function filtrarSolicitudesAdmin() {
  var container = document.getElementById('solicitudesAdminList');
  if (!container) return;
  var q = (document.getElementById('solAdminBuscador') || {}).value || '';
  q = q.toLowerCase().trim();
  var data = q ? _solAdminData.filter(function(s) {
    var nombre = s.empleados ? s.empleados.nombre.toLowerCase() : '';
    return nombre.includes(q);
  }) : _solAdminData;
  if (!data.length) {
    container.innerHTML = emptyState('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', t('sa.empty'), t('sa.empty_sub'));
    return;
  }
  var contador = (data.length < _solAdminData.length)
    ? '<div style="padding:0.5rem 1.5rem;font-size:0.72rem;color:var(--muted);border-bottom:1px solid var(--border)">' + data.length + ' de ' + _solAdminData.length + ' solicitudes</div>'
    : '';
  var delay = 0;
  container.innerHTML = contador + data.map(function(s) {
    var eb = getEstadoBadge(s.estado);
    var cmt = s.comentario ? '<div class="doc-meta" style="color:var(--gold);margin-top:3px">💬 ' + s.comentario + '</div>' : '';
    var nombre = s.empleados ? s.empleados.nombre : 'Empleado';
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info"><div class="doc-icon">📋</div>' +
      '<div><div class="doc-name">' + highlightMatch(nombre, q) + ' — ' + s.tipo + '</div>' +
      '<div class="doc-meta">' + (s.fechas||'') + (s.motivo ? ' · ' + s.motivo : '') + '</div>' +
      '<div class="doc-meta">' + new Date(s.created_at).toLocaleDateString('es-ES') + '</div>' +
      cmt + '</div></div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center" id="sol-act-' + s.id + '">' +
      '<span class="badge ' + eb.cls + '">' + eb.lbl + '</span>' +
      (s.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="mostrarAccionSolicitud(\'' + s.id + '\',\'aprobada\')">' + t('sa.aprobar') + '</button>' +
        '<button class="btn-sm" style="border-color:#dc2626;color:#dc2626" onclick="mostrarAccionSolicitud(\'' + s.id + '\',\'rechazada\')">' + t('sa.rechazar') + '</button>'
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
    '<textarea id="cmt-sol-' + id + '" rows="2" placeholder="' + t('sa.cmt_ph') + '" ' +
    'style="width:100%;padding:0.45rem 0.7rem;background:var(--surface3);border:1px solid var(--border2);border-radius:var(--r-xs);color:var(--text);font-size:0.78rem;font-family:inherit;resize:none;outline:none"></textarea>' +
    '<div style="display:flex;gap:0.4rem">' +
    '<button class="btn-sm primary" style="background:' + col + ';border-color:' + col + '" ' +
    'onclick="confirmarSolicitud(\'' + id + '\',\'' + estado + '\')">' + (esBuena ? t('sa.aprobar_c') : t('sa.rechazar_c')) + '</button>' +
    '<button class="btn-sm" onclick="cargarSolicitudesAdmin()">' + t('sa.cancelar') + '</button>' +
    '</div></div>';
  el.querySelector('textarea').focus();
}

async function confirmarSolicitud(id, estado) {
  var cmt = document.getElementById('cmt-sol-' + id);
  var comentario = cmt ? cmt.value.trim() : '';
  var payload = { estado: estado };
  if (comentario) payload.comentario = comentario;
  var { data: solData } = await sb.from('solicitudes').update(payload).eq('id', id).select('empleado_id, tipo').single();
  if (solData) notificarEmail('solicitud_' + estado, solData.empleado_id, { tipo: solData.tipo, comentario: comentario });
  cargarSolicitudesAdmin();
  if (document.getElementById('dashStats')) cargarDashboard();
  cargarBadgeAdmin();
}

// TABS ADMIN
function switchTab(tab, el) {
  currentAdminTab = tab;
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
  if (tab === 'registro-admin')     cargarSolicitudesRegistro();
  if (tab === 'solicitudes-admin')  cargarSolicitudesAdmin();
  if (tab === 'vacaciones-admin')   cargarVacacionesAdmin();
  if (tab === 'turnos-admin') { cargarTurnosAdmin(); poblarMasivaEmpleados(); cargarCuadranteAdmin(); }
  if (tab === 'resumen-vac')        cargarResumenVacaciones();
  if (tab === 'docs-admin')         cargarDocumentosAdmin();
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
      ? 'Sin resultados para "<strong style="color:var(--text)">' + filtroBuscadorActivo + '</strong>"'
      : 'No hay empleados con ese filtro';
    container.innerHTML = '<div class="empty" style="border:none;padding:2.5rem"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' + msg + '</div>';
    return;
  }
  var q = filtroBuscadorActivo;
  var hasFilter = data.length < allEmpleados.length;
  container.innerHTML =
    (hasFilter ? '<div style="padding:0.5rem 1.5rem;font-size:0.72rem;color:var(--muted);border-bottom:1px solid var(--border)">' + data.length + ' empleado' + (data.length !== 1 ? 's' : '') + ' encontrado' + (data.length !== 1 ? 's' : '') + '</div>' : '') +
    '<table><thead><tr><th style="width:2.5rem"></th><th>Nombre</th><th>Email</th><th>Cargo</th><th>' + t('edit.estado') + '</th><th></th></tr></thead><tbody>' +
    data.map(function(e, i) {
      var emailSafe = e.email.replace(/'/g, "\\'");
      return '<tr style="animation:fadeIn 0.25s ease both;animation-delay:' + (i * 35) + 'ms">' +
        '<td style="padding-right:0">' + avatarIni(e.nombre, 32) + '</td>' +
        '<td><strong style="color:var(--text)">' + highlightMatch(e.nombre, q) + '</strong></td>' +
        '<td><span class="email-copy" title="Clic para copiar" onclick="copiarEmail(\'' + emailSafe + '\',this)" style="color:var(--text2);font-size:0.82rem">' + highlightMatch(e.email, q) + '</span></td>' +
        '<td>' + e.cargo + '</td>' +
        '<td><span class="badge ' + (e.activo ? 'badge-green">' + t('emp.activo') : 'badge-red">' + t('emp.inactivo')) + '</span></td>' +
        '<td><button class="btn-sm" onclick="abrirEditEmp(\'' + e.id + '\')" style="margin-left:0">' + t('emp.editar') + '</button></td>' +
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
  btn.disabled = true; btn.textContent = t('edit.guardando');
  var { error } = await sb.from('empleados').update({
    nombre: nombre, email: email, dni: dni, cargo: cargo,
    dias_vacaciones_anuales: dias, activo: activo
  }).eq('id', id);
  btn.disabled = false; btn.textContent = t('edit.guardar');
  if (error) { err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return; }
  ok.style.display = 'block'; ok.textContent = t('edit.ok');
  cargarEmpleados();
  setTimeout(cerrarEditEmp, 1200);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('editEmpModal').style.display === 'flex') cerrarEditEmp();
});
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'editEmpModal') cerrarEditEmp();
});

function _descargarXlsx(filas, nombreHoja, anchos, nombreArchivo) {
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(filas);
  if (anchos) ws['!cols'] = anchos;
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  XLSX.writeFile(wb, nombreArchivo + '.xlsx');
}

function exportarEmpleadosExcel() {
  if (!allEmpleados.length) { mostrarToast(t('toast.sin_datos'), t('toast.no_emp')); return; }
  var datos = filtroCargoActivo === 'todos'
    ? allEmpleados
    : allEmpleados.filter(function(e){ return e.cargo === filtroCargoActivo; });
  var filas = [['Nombre', 'Email', 'DNI', 'Cargo', 'Estado', 'Días vacaciones']];
  datos.forEach(function(e) {
    filas.push([e.nombre, e.email, e.dni || '', e.cargo, e.activo ? 'Activo' : 'Inactivo', e.dias_vacaciones_anuales || 22]);
  });
  _descargarXlsx(filas, 'Empleados', [{wch:30},{wch:35},{wch:12},{wch:25},{wch:10},{wch:16}], 'empleados_enerpro_' + new Date().toISOString().split('T')[0]);
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
  if (dbError) { err.style.display='block'; err.textContent='Error al guardar: '+dbError.message; return; }

  ok.style.display='block'; ok.textContent=t('emp.ok') + authMsg;
  document.getElementById('empNombre').value='';
  document.getElementById('empEmail').value='';
  document.getElementById('empDni').value='';
  document.getElementById('empPassword').value='';
  cargarEmpleados();
}

// ─── REGISTRO DE EMPLEADOS ────────────────────────────────

async function cargarSolicitudesRegistro() {
  var listEl = document.getElementById('registroAdminList');
  if (!listEl) return;
  listEl.innerHTML = '<div class="loading">Cargando...</div>';

  var filtro = (document.getElementById('regAdminFiltro') || {}).value || 'pendiente';
  var query = sb.from('solicitudes_registro').select('*').order('created_at', { ascending: false });
  if (filtro !== 'todas') query = query.eq('estado', filtro);

  var { data, error } = await query;
  if (error) {
    listEl.innerHTML = '<div class="empty-state" style="padding:2rem">Error al cargar solicitudes: ' + error.message + '</div>';
    // Table may not exist yet — show SQL hint
    if (error.message.includes('does not exist') || error.code === '42P01') {
      listEl.innerHTML = '<div class="empty-state" style="padding:2rem;text-align:left"><p style="color:var(--muted);font-size:0.82rem;margin-bottom:0.5rem">La tabla <code>solicitudes_registro</code> no existe todavía.</p><p style="font-size:0.78rem;color:var(--muted)">Créala en el panel SQL de Supabase (ver instrucciones).</p></div>';
    }
    return;
  }

  _actualizarBadgeRegistro(data ? data.filter(function(r){ return r.estado === 'pendiente'; }).length : 0);

  if (!data || !data.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:2rem">' + t('reg.empty') + '</div>';
    return;
  }

  var estadoColor = { pendiente: 'var(--yellow)', aprobada: 'var(--green)', rechazada: 'var(--red)' };
  var estadoLabel = { pendiente: t('reg.estado_pend'), aprobada: t('reg.estado_apr'), rechazada: t('reg.estado_rech') };

  var html = '<table class="dt-table"><thead><tr>' +
    '<th>Nombre</th><th>Email</th><th>DNI</th><th>Cargo</th><th>Fecha</th><th>Estado</th><th>Acción</th>' +
    '</tr></thead><tbody>';

  data.forEach(function(r) {
    var fecha = new Date(r.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
    var color = estadoColor[r.estado] || 'var(--muted)';
    var label = estadoLabel[r.estado] || r.estado;
    var acciones = '';
    if (r.estado === 'pendiente') {
      acciones = '<button class="btn-sm primary" onclick="abrirAprobarRegistro(\'' + r.id + '\',\'' + _esc(r.nombre) + '\',\'' + _esc(r.email) + '\',\'' + _esc(r.dni) + '\',\'' + _esc(r.cargo) + '\')" style="margin-right:0.4rem" data-i18n="reg.aprobar">' + t('reg.aprobar') + '</button>' +
        '<button class="btn-sm btn-danger" onclick="rechazarRegistro(\'' + r.id + '\',\'' + _esc(r.nombre) + '\')" data-i18n="reg.rechazar">' + t('reg.rechazar') + '</button>';
    }
    html += '<tr>' +
      '<td style="color:var(--text);font-weight:500">' + _esc(r.nombre) + '</td>' +
      '<td style="color:var(--text2)">' + _esc(r.email) + '</td>' +
      '<td>' + _esc(r.dni) + '</td>' +
      '<td>' + _esc(r.cargo) + '</td>' +
      '<td style="color:var(--muted)">' + fecha + '</td>' +
      '<td><span style="font-size:0.72rem;font-weight:600;color:' + color + '">' + label + '</span>' + (r.nota ? ' <span style="font-size:0.7rem;color:var(--muted)" title="' + _esc(r.nota) + '">✱</span>' : '') + '</td>' +
      '<td>' + acciones + '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  listEl.innerHTML = html;
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function _actualizarBadgeRegistro(count) {
  var badge = document.getElementById('regPendBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function abrirAprobarRegistro(id, nombre, email, dni, cargo) {
  document.getElementById('aprobarRegId').value    = id;
  document.getElementById('aprobarRegEmail').value = email;
  document.getElementById('aprobarRegNombre').value = nombre;
  document.getElementById('aprobarRegDni').value   = dni;
  document.getElementById('aprobarRegCargo').value = cargo;
  document.getElementById('aprobarRegDias').value  = '22';
  document.getElementById('aprobarRegOk').style.display   = 'none';
  document.getElementById('aprobarRegError').style.display = 'none';
  document.getElementById('aprobarRegBtn').disabled = false;
  document.getElementById('aprobarRegInfo').innerHTML =
    '<strong>' + _esc(nombre) + '</strong> · ' + _esc(email) + '<br>' +
    _esc(cargo) + ' · DNI: ' + _esc(dni);
  document.getElementById('aprobarRegModal').style.display = 'flex';
}

function cerrarAprobarRegModal() {
  document.getElementById('aprobarRegModal').style.display = 'none';
}

async function confirmarAprobarRegistro() {
  var btn   = document.getElementById('aprobarRegBtn');
  var errEl = document.getElementById('aprobarRegError');
  var okEl  = document.getElementById('aprobarRegOk');
  if (!btn || !errEl || !okEl) { alert('Error: modal no encontrado. Recarga la página.'); return; }

  try {
    errEl.style.display = 'none';
    okEl.style.display  = 'none';
    btn.disabled = true;
    btn.textContent = 'Creando cuenta…';

    var id     = document.getElementById('aprobarRegId').value;
    var email  = document.getElementById('aprobarRegEmail').value;
    var nombre = document.getElementById('aprobarRegNombre').value;
    var dni    = document.getElementById('aprobarRegDni').value;
    var cargo  = document.getElementById('aprobarRegCargo').value;

    // Crear usuario Auth — guardar sesión admin primero
    var { data: sessionData } = await sb.auth.getSession();
    var adminSession = sessionData && sessionData.session;
    var tempPass = Math.random().toString(36).slice(-10) + 'Aa1!';
    var { data: authData, error: authError } = await sb.auth.signUp({ email: email, password: tempPass });
    if (adminSession && authData && authData.session) {
      await sb.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
    }
    if (authError && !authError.message.toLowerCase().includes('already registered')) {
      throw new Error('Error al crear acceso: ' + authError.message);
    }

    // Crear registro en tabla empleados
    var { error: dbError } = await sb.from('empleados').insert({
      nombre: nombre, email: email, dni: dni, cargo: cargo,
      activo: true, debe_cambiar_password: true
    });
    if (dbError) throw new Error('Error al crear empleado: ' + dbError.message);

    // Marcar solicitud como aprobada y enviar email de acceso
    await sb.from('solicitudes_registro').update({ estado: 'aprobada' }).eq('id', id);
    await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

    okEl.textContent = '✓ Cuenta creada. Email de acceso enviado a ' + email;
    okEl.style.display = 'block';
    showToast('✓ ' + nombre + ' — cuenta creada y email enviado', 'success');
    setTimeout(function() {
      cerrarAprobarRegModal();
      cargarSolicitudesRegistro();
      cargarEmpleados();
      cargarBadgeAdmin();
    }, 1800);

  } catch(e) {
    errEl.textContent = e.message || 'Error inesperado.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Aprobar y enviar acceso';
  }
}

async function rechazarRegistro(id, nombre) {
  var nota = window.prompt('Motivo del rechazo (opcional, se guardará internamente):');
  if (nota === null) return; // cancelled
  var { error } = await sb.from('solicitudes_registro').update({ estado: 'rechazada', nota: nota || null }).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('Solicitud de ' + nombre + ' rechazada.', 'info');
  cargarSolicitudesRegistro();
  cargarBadgeAdmin();
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
  if (dbError) { err.style.display='block'; err.textContent='Error al guardar: '+dbError.message; return; }
  ok.style.display='block'; ok.textContent=t('sub.ok');
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
      progressText.textContent = t('masi.proc') + ' ' +(i+1)+' / '+files.length+': '+filename;
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
    currentUser = null;
    currentEmpleado = null;
    currentIsAdmin = false;
    _modoRecuperacionPass = false;
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginWrap').style.display = 'flex';
    document.getElementById('resetPassRecuperacionModal').style.display = 'none';
    document.getElementById('cambioPassModal').style.display = 'none';
  }
  if (event === 'PASSWORD_RECOVERY' && session) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    mostrarResetPassRecuperacion();
    return;
  }
  if (event === 'INITIAL_SESSION' && session && session.user) {
    aplicarSesionDesdeUser(session.user);
  }
});

// ─── VACACIONES ──────────────────────────────────────────

var VAC_TIPO_LABEL = { vacaciones:'Vacaciones', permiso:'Permiso', asuntos_propios:'Asuntos propios', baja_medica:'Baja médica' };
var VAC_TIPO_CLASS = { vacaciones:'badge-blue', permiso:'badge-yellow', asuntos_propios:'badge-yellow', baja_medica:'badge-red' };

function diasEntre(desde, hasta) {
  var d1 = new Date(desde + 'T12:00:00'), d2 = new Date(hasta + 'T12:00:00');
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

function fechasSolapan(desdeA, hastaA, desdeB, hastaB) {
  return desdeA <= hastaB && desdeB <= hastaA;
}

function calcVacacionesAnuales(emp, data, ano) {
  ano = ano || new Date().getFullYear();
  var total = emp.dias_vacaciones_anuales || 22;
  var usados = 0, pendientes = 0;
  if (data) {
    data.forEach(function(v) {
      if (v.tipo !== 'vacaciones') return;
      if (new Date(v.fecha_inicio + 'T12:00:00').getFullYear() !== ano) return;
      var d = diasEntre(v.fecha_inicio, v.fecha_fin);
      if (v.estado === 'aprobada') usados += d;
      else if (v.estado === 'pendiente') pendientes += d;
    });
  }
  return {
    total: total,
    usados: usados,
    pendientes: pendientes,
    restantes: Math.max(0, total - usados),
    disponibles: Math.max(0, total - usados - pendientes)
  };
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

  var { data: existentes } = await sb.from('vacaciones').select('*')
    .eq('empleado_id', currentEmpleado.id);

  var haySolape = (existentes || []).some(function(v) {
    if (v.estado !== 'pendiente' && v.estado !== 'aprobada') return false;
    return fechasSolapan(desde, hasta, v.fecha_inicio, v.fecha_fin);
  });
  if (haySolape) {
    err.style.display = 'block';
    err.textContent = t('vac.err_solap');
    return;
  }

  if (tipo === 'vacaciones') {
    var anoSol = new Date(desde + 'T12:00:00').getFullYear();
    var stats  = calcVacacionesAnuales(currentEmpleado, existentes, anoSol);
    var pedidos = diasEntre(desde, hasta);
    if (pedidos > stats.disponibles) {
      err.style.display = 'block';
      err.textContent = t('vac.err_sin_dias').replace('{n}', stats.disponibles).replace('{s}', pedidos);
      return;
    }
  }

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
  var stats     = calcVacacionesAnuales(currentEmpleado, data, anoActual);
  var total     = stats.total;
  var usados    = stats.usados;
  var restantes = stats.restantes;
  var resumen = document.getElementById('vacResumen');
  if (resumen) {
    document.getElementById('vacAno').textContent = anoActual;
    resumen.style.display = 'block';
  }

  // Always animate counters regardless of whether there are list items
  animateValue(document.getElementById('vacTotal'),     total,     600);
  animateValue(document.getElementById('vacUsados'),    usados,    700);
  animateValue(document.getElementById('vacRestantes'), restantes, 700);

  if (!data || !data.length) { lista.innerHTML = emptyState('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', t('vac.empty'), t('vac.empty_sub')); return; }

  var delay = 0;
  lista.innerHTML = data.map(function(v) {
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var eb = getEstadoBadge(v.estado);
    var btnCancelar = v.estado === 'pendiente'
      ? '<button class="btn-sm" onclick="cancelarVacacion(\'' + v.id + '\')" ' +
        'style="margin-left:0.25rem;color:var(--muted);border-color:rgba(255,255,255,0.1);font-size:0.68rem" ' +
        'title="Cancelar solicitud">' + t('sol.cancelar') + '</button>'
      : '';
    var d = delay; delay += 50;
    return '<div class="vac-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<span class="badge ' + (VAC_TIPO_CLASS[v.tipo]||'badge-blue') + ' vac-tipo">' + getTipoVac(v.tipo) + '</span>' +
      '<span class="vac-fechas">' + desde + ' → ' + hasta +
        (v.notas     ? '<br><span style="font-size:0.72rem;color:var(--muted)">' + v.notas      + '</span>' : '') +
        (v.comentario ? '<br><span style="font-size:0.72rem;color:var(--gold)">💬 ' + v.comentario + '</span>' : '') + '</span>' +
      '<span class="vac-dias">' + dias + ' d.</span>' +
      '<span class="badge ' + eb.cls + '">' + eb.lbl + '</span>' +
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
  _vacAdminData = data || [];
  if (!_vacAdminData.length) {
    lista.innerHTML = emptyState('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', t('va.empty'), t('va.empty_sub'));
    return;
  }
  filtrarVacacionesAdmin();
}

function filtrarVacacionesAdmin() {
  var lista = document.getElementById('vacAdminLista');
  if (!lista) return;
  var q = (document.getElementById('vacAdminBuscador') || {}).value || '';
  q = q.toLowerCase().trim();
  var data = q ? _vacAdminData.filter(function(v) {
    var nombre = v.empleados ? v.empleados.nombre.toLowerCase() : '';
    return nombre.includes(q);
  }) : _vacAdminData;
  if (!data.length) {
    lista.innerHTML = emptyState('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', t('va.empty'), t('va.empty_sub'));
    return;
  }
  var contador = (data.length < _vacAdminData.length)
    ? '<div style="padding:0.5rem 1.5rem;font-size:0.72rem;color:var(--muted);border-bottom:1px solid var(--border)">' + data.length + ' de ' + _vacAdminData.length + ' solicitudes</div>'
    : '';
  var delay = 0;
  lista.innerHTML = contador + data.map(function(v) {
    var nombre = v.empleados ? v.empleados.nombre : '—';
    var desde  = new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    var hasta  = new Date(v.fecha_fin  +'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    var eb = getEstadoBadge(v.estado);
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info"><div class="doc-icon">🏖️</div>' +
      '<div><div class="doc-name">' + highlightMatch(nombre, q) + ' · <span style="color:var(--text2);font-weight:400">' + getTipoVac(v.tipo) + '</span></div>' +
      '<div class="doc-meta">' + desde + ' → ' + hasta + ' (' + dias + ' ' + t('g.dias') + ')' + (v.notas ? ' · ' + v.notas : '') + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem" id="vac-act-' + v.id + '">' +
      '<span class="badge ' + eb.cls + '">' + eb.lbl + '</span>' +
      (v.estado === 'pendiente' ?
        '<button class="btn-sm primary" onclick="mostrarAccionVacacion(\'' + v.id + '\',\'aprobada\')">' + t('va.aprobar') + '</button>' +
        '<button class="btn-sm" style="color:var(--red);border-color:rgba(220,38,38,0.3)" onclick="mostrarAccionVacacion(\'' + v.id + '\',\'rechazada\')">' + t('va.rechazar') + '</button>'
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
    '<textarea id="cmt-vac-' + id + '" rows="2" placeholder="' + t('va.cmt_ph') + '" ' +
    'style="width:100%;padding:0.45rem 0.7rem;background:var(--surface3);border:1px solid var(--border2);border-radius:var(--r-xs);color:var(--text);font-size:0.78rem;font-family:inherit;resize:none;outline:none"></textarea>' +
    '<div style="display:flex;gap:0.4rem">' +
    '<button class="btn-sm primary" style="background:' + col + ';border-color:' + col + '" ' +
    'onclick="confirmarVacacion(\'' + id + '\',\'' + estado + '\')">' + (esBuena ? t('va.aprobar_c') : t('va.rechazar_c')) + '</button>' +
    '<button class="btn-sm" onclick="cargarVacacionesAdmin()">' + t('va.cancelar') + '</button>' +
    '</div></div>';
  el.querySelector('textarea').focus();
}

async function confirmarVacacion(id, estado) {
  var cmt = document.getElementById('cmt-vac-' + id);
  var comentario = cmt ? cmt.value.trim() : '';
  var payload = { estado: estado };
  if (comentario) payload.comentario = comentario;
  var { data: vacData } = await sb.from('vacaciones').update(payload).eq('id', id).select('empleado_id, tipo, fecha_inicio, fecha_fin').single();
  if (vacData) notificarEmail('vacacion_' + estado, vacData.empleado_id, { tipo: vacData.tipo, desde: vacData.fecha_inicio, hasta: vacData.fecha_fin, comentario: comentario });
  cargarVacacionesAdmin();
  if (document.getElementById('dashStats')) cargarDashboard();
  cargarBadgeAdmin();
}

// ─── CANCELAR SOLICITUDES / VACACIONES (EMPLEADO) ────────

async function cancelarSolicitud(id) {
  if (!confirm(t('sol.cancelar_ok') + '\n' + t('sol.cancelar_msg'))) return;
  var { error } = await sb.from('solicitudes').update({ estado: 'cancelada' }).eq('id', id);
  if (error) { mostrarToast('❌ Error', error.message); return; }
  mostrarToast(t('toast.sol_cancel'), t('toast.sol_cancel_msg'));
  cargarMisSolicitudes();
}

async function cancelarVacacion(id) {
  if (!confirm(t('vac.cancelar_ok') + '\n' + t('vac.cancelar_msg'))) return;
  var { error } = await sb.from('vacaciones').update({ estado: 'cancelada' }).eq('id', id);
  if (error) { mostrarToast('❌ Error', error.message); return; }
  mostrarToast(t('toast.vac_cancel'), t('toast.vac_cancel_msg'));
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
  aplicarIdioma();
  registrarServiceWorker();
  var hash = window.location.hash || '';
  if (hash.indexOf('error=') !== -1) {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('loginError').textContent = t('rp.err_link');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
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
  var grid = document.getElementById('calGrid');
  if (grid) grid.innerHTML = skelCalendario();
  var primerDia = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-01';
  var ultimoDia = new Date(calYear, calMonth + 1, 0);
  var ultimoDiaStr = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-' + String(ultimoDia.getDate()).padStart(2,'0');

  var q = sb.from('turnos').select('*').gte('fecha', primerDia).lte('fecha', ultimoDiaStr).order('fecha');
  if (currentEmpleado) q = q.eq('empleado_id', currentEmpleado.id);
  var { data } = await q;
  calTurnos = data || [];
  renderCalendario(calTurnos);
}

function renderCalendario(turnos) {
  document.getElementById('calMesLabel').textContent = getMes(calMonth) + ' ' + calYear;

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
      mapa[dateStr].forEach(function(turno) {
        var pill = document.createElement('div');
        pill.className = 'cal-pill t-' + turno.tipo;
        var txt = getTipoTurno(turno.tipo);
        if (turno.hora_inicio) txt = turno.hora_inicio.slice(0,5) + (turno.hora_fin ? '–' + turno.hora_fin.slice(0,5) : '');
        pill.textContent = txt;
        cell.appendChild(pill);
      });
    }
    grid.appendChild(cell);
  }

  // Resumen lista de turnos del mes
  var resumen = document.getElementById('calResumen');
  if (!turnos.length) {
    resumen.innerHTML = '<div class="empty">' + t('cal.no_turnos') + '</div>';
    return;
  }
  resumen.innerHTML = '<div class="card" style="padding:0"><div style="padding:0.875rem 1.25rem;border-bottom:1px solid var(--border);font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted)">' + t('cal.detalle') + '</div>' +
    turnos.map(function(turno) {
      var fecha = new Date(turno.fecha + 'T12:00:00');
      var fechaStr = fecha.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
      var horas = turno.hora_inicio ? turno.hora_inicio.slice(0,5) + (turno.hora_fin ? ' – ' + turno.hora_fin.slice(0,5) : '') : '—';
      return '<div class="cal-resumen-item">' +
        '<span class="cal-pill t-' + turno.tipo + '" style="min-width:4.5rem;text-align:center">' + getTipoTurno(turno.tipo) + '</span>' +
        '<span class="cal-resumen-fecha">' + fechaStr + '</span>' +
        '<span class="cal-resumen-horas">' + horas + '</span>' +
        '<span class="cal-resumen-lugar">' + (turno.ubicacion || '') + '</span>' +
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

// ─── EXPORTAR CALENDARIO A iCAL ───────────────────────────

function exportarCalendarioICal() {
  if (!calTurnos || !calTurnos.length) {
    mostrarToast(t('toast.sin_datos'), t('cal.ical_sin') + ' ' + getMes(calMonth) + ' ' + t('cal.ical_sin2'));
    return;
  }
  var toIcalTime = function(hhmm) {
    return hhmm.slice(0, 5).replace(':', '') + '00';
  };
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ENERPRO//Portal del Empleado//ES',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:ENERPRO \u2014 Mis turnos',
    'X-WR-TIMEZONE:Europe/Madrid'
  ];
  calTurnos.forEach(function(t) {
    var dateStr = t.fecha.replace(/-/g, '');
    var dtStart, dtEnd;
    if (t.hora_inicio) {
      dtStart = 'DTSTART;TZID=Europe/Madrid:' + dateStr + 'T' + toIcalTime(t.hora_inicio);
      dtEnd   = t.hora_fin
        ? 'DTEND;TZID=Europe/Madrid:'   + dateStr + 'T' + toIcalTime(t.hora_fin)
        : 'DTEND;TZID=Europe/Madrid:'   + dateStr + 'T' + toIcalTime(t.hora_inicio);
    } else {
      dtStart = 'DTSTART;VALUE=DATE:' + dateStr;
      var nextDay = new Date(t.fecha + 'T12:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      dtEnd = 'DTEND;VALUE=DATE:' + nextDay.toISOString().split('T')[0].replace(/-/g, '');
    }
    var label = getTipoTurno(t.tipo);
    var summary = 'SUMMARY:' + t('tur.turno') + ' ' + label;
    if (t.hora_inicio) {
      summary += ' \u2014 ' + t.hora_inicio.slice(0,5);
      if (t.hora_fin) summary += '\u2013' + t.hora_fin.slice(0,5);
    }
    var desc = [];
    if (t.ubicacion) desc.push('Ubicaci\u00f3n: ' + t.ubicacion);
    if (t.notas) desc.push(t.notas);
    lines.push('BEGIN:VEVENT');
    lines.push('UID:enerpro-turno-' + (t.id || Date.now() + Math.random()) + '@enerpro.com');
    lines.push(dtStart);
    lines.push(dtEnd);
    lines.push(summary);
    if (desc.length) lines.push('DESCRIPTION:' + desc.join('\\n').replace(/,/g, '\\,'));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');

  var icsContent = lines.join('\r\n');
  var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'turnos_enerpro_' + getMes(calMonth).toLowerCase() + '_' + calYear + '.ics';
  link.click();
  mostrarToast(t('cal.ical_ok'), getMes(calMonth) + ' ' + calYear + ' \u2014 ' + calTurnos.length + ' turno' + (calTurnos.length !== 1 ? 's' : '') + '.');
}

// ─── DASHBOARD COORDINADOR ────────────────────────────────

async function cargarPerfil() {
  var emp = currentEmpleado;
  if (!emp) return;

  var avatarEl = document.getElementById('prfAvatar');
  var inicial = emp.nombre ? emp.nombre.charAt(0).toUpperCase() : '?';
  if (avatarEl) avatarEl.textContent = inicial;

  var setTxt = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  setTxt('prfNombreHero', emp.nombre);
  setTxt('prfCargoHero',  emp.cargo);
  setTxt('prfEmailHero',  emp.email);
  setTxt('prfNombre',     emp.nombre);
  setTxt('prfEmail',      emp.email);
  setTxt('prfCargo',      emp.cargo);
  setTxt('prfDni',        emp.dni);

  var year = new Date().getFullYear();
  var anoEl = document.getElementById('prfAno');
  if (anoEl) anoEl.textContent = year;

  var anuales = emp.dias_vacaciones_anuales || 22;
  setTxt('prfDiasAnual', anuales);
  setTxt('prfDiasUsados', '…');
  setTxt('prfDiasRest',   '…');

  var { data: vacs } = await sb.from('vacaciones')
    .select('fecha_inicio, fecha_fin')
    .eq('empleado_id', emp.id)
    .eq('estado', 'aprobada')
    .gte('fecha_inicio', year + '-01-01')
    .lte('fecha_fin', year + '-12-31');

  var usados = 0;
  (vacs || []).forEach(function(v) {
    if (!v.fecha_inicio || !v.fecha_fin) return;
    var d1 = new Date(v.fecha_inicio), d2 = new Date(v.fecha_fin);
    usados += Math.round((d2 - d1) / 86400000) + 1;
  });
  var restantes = Math.max(0, anuales - usados);
  var pct = anuales > 0 ? Math.min(100, Math.round((usados / anuales) * 100)) : 0;

  setTxt('prfDiasUsados', usados);
  setTxt('prfDiasRest',   restantes);
  var bar = document.getElementById('prfVacBar');
  if (bar) setTimeout(function() { bar.style.width = pct + '%'; }, 100);
}

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
      '<div class="card-label">' + t('dash.emp_activos') + '</div>' +
      '<div class="card-value" id="d-emp">0</div>' +
      '<div class="card-sub">' + t('dash.plantilla') + '</div>' +
    '</div>' +
    '<div class="card" style="margin:0;cursor:pointer;animation:scaleIn 0.3s ease both;animation-delay:60ms" onclick="switchTab(\'solicitudes-admin\', document.querySelector(\'[onclick*=\\\"solicitudes-admin\\\"]\'))">' +
      '<div class="card-label">' + t('dash.sol_pend') + '</div>' +
      '<div class="card-value" id="d-sol" style="color:' + (totalSol > 0 ? 'var(--yellow)' : 'var(--green)') + '">0</div>' +
      '<div class="card-sub">' + t('dash.revision') + '</div>' +
    '</div>' +
    '<div class="card" style="margin:0;cursor:pointer;animation:scaleIn 0.3s ease both;animation-delay:120ms" onclick="switchTab(\'vacaciones-admin\', document.querySelector(\'[onclick*=\\\"vacaciones-admin\\\"]\'))">' +
      '<div class="card-label">' + t('dash.vac_pend') + '</div>' +
      '<div class="card-value" id="d-vac" style="color:' + (totalVac > 0 ? 'var(--yellow)' : 'var(--green)') + '">0</div>' +
      '<div class="card-sub">' + t('dash.revision') + '</div>' +
    '</div>' +
    '<div class="card" style="margin:0;animation:scaleIn 0.3s ease both;animation-delay:180ms">' +
      '<div class="card-label">' + t('dash.cuad_firm') + '</div>' +
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
      sinFirmarEl.innerHTML = '<div class="empty" style="border:none;padding:2rem;color:var(--green)">' + t('dash.todos_firm') + '</div>';
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
          '<span class="badge badge-yellow">' + t('est.pendiente') + '</span>' +
        '</div>';
      }).join('');
    }
  }

  // Solicitudes pendientes en dashboard
  if (solicEl) {
    var sols = solListRes.data || [];
    if (!sols.length) {
      solicEl.innerHTML = '<div class="empty" style="border:none;padding:2rem;color:var(--green)">' + t('dash.sin_sol') + '</div>';
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
          '<button class="btn-sm" onclick="switchTab(\'solicitudes-admin\',document.querySelector(\'[onclick*=\\\"solicitudes-admin\\\"]\'))">' + t('dash.gestionar') + '</button>' +
        '</div>';
      }).join('');
    }
  }
  // Charts (non-blocking)
  cargarDashboardCharts();
}

// ─── DASHBOARD CHARTS ─────────────────────────────────────

function dibujarBarChart(canvasId, labels, values, color, maxVal) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.offsetWidth || 400;
  var H = parseInt(canvas.getAttribute('height')) || 160;
  canvas.width  = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  if (!values.length) return;

  var n       = values.length;
  var padLeft = 36;
  var padRight= 12;
  var padTop  = 10;
  var padBot  = 32;
  var chartW  = W - padLeft - padRight;
  var chartH  = H - padTop - padBot;
  var mx      = maxVal || Math.max.apply(null, values) || 1;
  var barW    = Math.floor(chartW / n * 0.55);
  var gap     = chartW / n;

  // Horizontal guide lines (3)
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  [0.25, 0.5, 0.75, 1].forEach(function(pct) {
    var y = padTop + chartH - chartH * pct;
    ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(W - padRight, y); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(mx * pct), padLeft - 4, y + 3.5);
  });

  // Bars
  values.forEach(function(val, i) {
    var bx  = padLeft + gap * i + (gap - barW) / 2;
    var bh  = Math.max(2, chartH * (val / mx));
    var by  = padTop + chartH - bh;

    // Bar gradient
    var grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color.replace(')', ',0.45)').replace('rgb', 'rgba'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, barW, bh, [3, 3, 0, 0]) : ctx.rect(bx, by, barW, bh);
    ctx.fill();

    // Value label on top
    if (val > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.font = 'bold 10px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, bx + barW / 2, by - 3);
    }

    // X label
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'center';
    var lbl = labels[i] || '';
    if (lbl.length > 6) lbl = lbl.slice(0, 6);
    ctx.fillText(lbl, bx + barW / 2, H - 6);
  });
}

async function cargarDashboardCharts() {
  var anioActual = new Date().getFullYear();
  var mesActual  = new Date().getMonth(); // 0-based

  // Chart 1: solicitudes por mes, últimos 6 meses
  var mesesLabels = [];
  var mesesDesde  = [];
  for (var i = 5; i >= 0; i--) {
    var m = mesActual - i;
    var a = anioActual;
    while (m < 0) { m += 12; a--; }
    mesesLabels.push(getMesCorto(m));
    mesesDesde.push({ anio: a, mes: m });
  }

  var solPromesas = mesesDesde.map(function(md) {
    var desde = md.anio + '-' + String(md.mes + 1).padStart(2, '0') + '-01';
    var hasta = new Date(md.anio, md.mes + 1, 0);
    var hastaStr = md.anio + '-' + String(md.mes + 1).padStart(2, '0') + '-' + String(hasta.getDate()).padStart(2, '0');
    return sb.from('solicitudes').select('*', { count:'exact', head:true })
      .gte('created_at', desde + 'T00:00:00')
      .lte('created_at', hastaStr + 'T23:59:59');
  });

  var solResults = await Promise.all(solPromesas);
  var solValues  = solResults.map(function(r) { return r.count || 0; });
  var solTotal   = solValues.reduce(function(a, b) { return a + b; }, 0);

  var solEmpty = document.getElementById('chartSolEmpty');
  var solCanvas = document.getElementById('chartSolicitudes');
  if (solTotal === 0) {
    if (solEmpty)  solEmpty.style.display  = 'block';
    if (solCanvas) solCanvas.style.display = 'none';
  } else {
    if (solEmpty)  solEmpty.style.display  = 'none';
    if (solCanvas) solCanvas.style.display = 'block';
    dibujarBarChart('chartSolicitudes', mesesLabels, solValues, 'rgb(245,184,0)', null);
  }

  // Update label for vacaciones chart
  var vacLabelEl = document.getElementById('dashChartVacLabel');
  if (vacLabelEl) vacLabelEl.textContent = t('grf.vac_titulo') + anioActual;

  // Chart 2: días de vacaciones aprobadas por empleado (año actual)
  var { data: vacData } = await sb.from('vacaciones')
    .select('empleado_id, fecha_inicio, fecha_fin, empleados(nombre)')
    .eq('estado', 'aprobada')
    .gte('fecha_inicio', anioActual + '-01-01')
    .lte('fecha_inicio', anioActual + '-12-31');

  var empDias = {};
  var empNombres = {};
  (vacData || []).forEach(function(v) {
    if (!v.fecha_inicio || !v.fecha_fin) return;
    var d1 = new Date(v.fecha_inicio + 'T12:00:00');
    var d2 = new Date(v.fecha_fin    + 'T12:00:00');
    var dias = Math.round((d2 - d1) / 86400000) + 1;
    var eid  = v.empleado_id;
    empDias[eid]    = (empDias[eid] || 0) + dias;
    empNombres[eid] = v.empleados ? v.empleados.nombre.split(' ')[0] : '?';
  });

  var empIds     = Object.keys(empDias).sort(function(a, b) { return empDias[b] - empDias[a]; }).slice(0, 12);
  var vacLabels  = empIds.map(function(id) { return empNombres[id]; });
  var vacValues  = empIds.map(function(id) { return empDias[id]; });

  var vacEmpty  = document.getElementById('chartVacEmpty');
  var vacCanvas = document.getElementById('chartVacaciones');
  if (!vacValues.length) {
    if (vacEmpty)  vacEmpty.style.display  = 'block';
    if (vacCanvas) vacCanvas.style.display = 'none';
  } else {
    if (vacEmpty)  vacEmpty.style.display  = 'none';
    if (vacCanvas) vacCanvas.style.display = 'block';
    dibujarBarChart('chartVacaciones', vacLabels, vacValues, 'rgb(96,165,250)', null);
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
    container.innerHTML = emptyState('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>', t('ta.empty'), t('ta.empty_sub'));
    return;
  }
  var delay = 0;
  container.innerHTML = data.map(function(turno) {
    var horas = turno.hora_inicio ? turno.hora_inicio.slice(0,5) + (turno.hora_fin ? '–' + turno.hora_fin.slice(0,5) : '') : '—';
    var fecha = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
    var d = delay; delay += 45;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info">' +
      '<div class="doc-icon" style="font-size:1.1rem">📅</div>' +
      '<div><div class="doc-name">' + (turno.empleados ? turno.empleados.nombre : '—') + '</div>' +
      '<div class="doc-meta">' + fecha + ' · ' + horas + (turno.ubicacion ? ' · ' + turno.ubicacion : '') + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
      '<span class="cal-pill t-' + turno.tipo + '">' + getTipoTurno(turno.tipo) + '</span>' +
      '<button class="btn-sm" onclick="eliminarTurno(\'' + turno.id + '\')" style="color:var(--red);border-color:rgba(220,38,38,0.3)">✕</button>' +
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
  ok.style.display = 'block'; ok.textContent = t('ta.ok');
  document.getElementById('turnoFecha').value = '';
  document.getElementById('turnoInicio').value = '';
  document.getElementById('turnoFin').value = '';
  document.getElementById('turnoUbicacion').value = '';
  document.getElementById('turnoNotas').value = '';
  cargarTurnosAdmin();
  cargarCuadranteAdmin();
}

async function eliminarTurno(id) {
  if (!confirm('¿Eliminar este turno?')) return;
  await sb.from('turnos').delete().eq('id', id);
  cargarTurnosAdmin();
  cargarCuadranteAdmin();
}

// ─── CUADRANTE VISUAL MENSUAL (ADMIN) ─────────────────────

function cuadranteAdminPrev() {
  _cuadAdminMes--;
  if (_cuadAdminMes < 0) { _cuadAdminMes = 11; _cuadAdminAnio--; }
  cargarCuadranteAdmin();
}
function cuadranteAdminNext() {
  _cuadAdminMes++;
  if (_cuadAdminMes > 11) { _cuadAdminMes = 0; _cuadAdminAnio++; }
  cargarCuadranteAdmin();
}
function cuadranteAdminHoy() {
  _cuadAdminAnio = new Date().getFullYear();
  _cuadAdminMes  = new Date().getMonth();
  cargarCuadranteAdmin();
}
function cuadranteFiltrarCargo(cargo, el) {
  _cuadAdminCargo = cargo;
  var btns = document.querySelectorAll('#cuadranteCargoFiltros .emp-filter');
  btns.forEach(function(b) { b.classList.remove('primary'); });
  if (el) el.classList.add('primary');
  renderCuadranteAdmin();
}

async function cargarCuadranteAdmin() {
  var grid  = document.getElementById('cuadranteAdminGrid');
  var label = document.getElementById('cuadranteAdminLabel');
  if (!grid) return;

  if (label) label.textContent = getMes(_cuadAdminMes) + ' ' + _cuadAdminAnio;
  grid.innerHTML = '<div class="loading" style="padding:2rem">' + t('g.cargando') + '</div>';

  var anio      = _cuadAdminAnio;
  var mes       = _cuadAdminMes;
  var primerDia = anio + '-' + String(mes + 1).padStart(2, '0') + '-01';
  var diasMes   = new Date(anio, mes + 1, 0).getDate();
  var ultimoDia = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(diasMes).padStart(2, '0');

  var [empRes, turRes] = await Promise.all([
    sb.from('empleados').select('id, nombre, cargo').eq('activo', true).order('nombre'),
    sb.from('turnos').select('empleado_id, fecha, tipo, ubicacion, hora_inicio, hora_fin')
      .gte('fecha', primerDia).lte('fecha', ultimoDia)
  ]);

  _cuadAdminRaw = { empleados: empRes.data || [], turnos: turRes.data || [] };
  renderCuadranteAdmin();
}

function renderCuadranteAdmin() {
  var grid  = document.getElementById('cuadranteAdminGrid');
  var label = document.getElementById('cuadranteAdminLabel');
  if (!grid) return;

  if (label) label.textContent = getMes(_cuadAdminMes) + ' ' + _cuadAdminAnio;

  var anio    = _cuadAdminAnio;
  var mes     = _cuadAdminMes;
  var diasMes = new Date(anio, mes + 1, 0).getDate();
  var hoy     = new Date().toISOString().split('T')[0];

  var empleados = _cuadAdminRaw.empleados.filter(function(e) {
    return _cuadAdminCargo === 'todos' || e.cargo === _cuadAdminCargo;
  });
  var turnos = _cuadAdminRaw.turnos;

  if (!empleados.length) {
    grid.innerHTML = '<div class="empty" style="border:none;padding:2rem">' + t('cua.sin_turnos') + '</div>';
    return;
  }

  // Build lookup: empId → { 'YYYY-MM-DD' → {tipo, ubicacion, hora_inicio, hora_fin} }
  var mapa = {};
  empleados.forEach(function(e) { mapa[e.id] = {}; });
  turnos.forEach(function(tur) {
    if (mapa[tur.empleado_id]) {
      mapa[tur.empleado_id][tur.fecha] = {
        tipo:       tur.tipo,
        ubicacion:  tur.ubicacion  || '',
        horaInicio: tur.hora_inicio ? tur.hora_inicio.slice(0,5) : '',
        horaFin:    tur.hora_fin    ? tur.hora_fin.slice(0,5)    : ''
      };
    }
  });

  var abrev = { manana:'M', tarde:'T', noche:'N', guardia:'G', libre:'L' };

  // Header
  var thead = '<thead><tr><th style="min-width:9rem;text-align:left;padding:0.35rem 0.75rem">' + t('cua.empleado') + '</th>';
  for (var d = 1; d <= diasMes; d++) {
    var fechaCol = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var esHoy    = fechaCol === hoy;
    var diaSem   = new Date(fechaCol + 'T12:00:00').getDay();
    var esFinDe  = (diaSem === 0 || diaSem === 6);
    thead += '<th class="' + (esHoy ? 'cua-hoy-col' : '') + '" style="min-width:2rem;' + (esFinDe ? 'color:rgba(245,184,0,0.6)' : '') + '">' + d + '</th>';
  }
  thead += '</tr></thead>';

  // Body — group by cargo when showing all
  var tbody = '<tbody>';
  var ordenEmps = empleados.slice().sort(function(a, b) {
    if (_cuadAdminCargo !== 'todos') return 0;
    var cargoOrd = ['Coordinador','Vigilante de seguridad','Auxiliar de servicio','Administrativo'];
    var ia = cargoOrd.indexOf(a.cargo); var ib = cargoOrd.indexOf(b.cargo);
    if (ia < 0) ia = 99; if (ib < 0) ib = 99;
    if (ia !== ib) return ia - ib;
    return a.nombre.localeCompare(b.nombre);
  });
  var lastCargo = null;
  ordenEmps.forEach(function(emp) {
    if (_cuadAdminCargo === 'todos' && emp.cargo !== lastCargo) {
      lastCargo = emp.cargo;
      tbody += '<tr class="cua-cargo-sep"><td colspan="' + (diasMes + 1) + '">' + (emp.cargo || '—') + '</td></tr>';
    }
    tbody += '<tr><td title="' + emp.nombre + (emp.cargo ? ' · ' + emp.cargo : '') + '" style="display:flex;align-items:center;gap:0.5rem">' + avatarIni(emp.nombre, 24) + '<span>' + emp.nombre.split(' ').slice(0,2).join(' ') + '</span></td>';
    for (var d2 = 1; d2 <= diasMes; d2++) {
      var fechaCel = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d2).padStart(2, '0');
      var info     = mapa[emp.id] && mapa[emp.id][fechaCel];
      var esHoy2   = fechaCel === hoy;
      if (info) {
        var tooltip = getTipoTurno(info.tipo);
        if (info.horaInicio) tooltip += ' ' + info.horaInicio + (info.horaFin ? '–' + info.horaFin : '');
        if (info.ubicacion)  tooltip += '\n' + info.ubicacion;
        tbody += '<td class="' + (esHoy2 ? 'cua-hoy-col' : '') + '" title="' + tooltip.replace(/"/g, '&quot;') + '">' +
          '<div class="cua-cell"><span class="cua-pill t-' + info.tipo + '">' + (abrev[info.tipo] || info.tipo.charAt(0).toUpperCase()) + '</span></div></td>';
      } else {
        tbody += '<td class="' + (esHoy2 ? 'cua-hoy-col' : '') + '" style="color:var(--border2)">·</td>';
      }
    }
    tbody += '</tr>';
  });
  tbody += '</tbody>';

  // Legend
  var legendItems = [
    { tipo:'manana', abr:'M' }, { tipo:'tarde', abr:'T' },
    { tipo:'noche',  abr:'N' }, { tipo:'guardia', abr:'G' }, { tipo:'libre', abr:'L' }
  ];
  var legend = '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;padding:0.75rem 1.25rem;border-top:1px solid var(--border)">';
  legendItems.forEach(function(li) {
    legend += '<span class="cua-pill t-' + li.tipo + '" style="font-size:0.68rem">' + li.abr + ' ' + getTipoTurno(li.tipo) + '</span>';
  });
  legend += '</div>';

  grid.innerHTML = '<table class="cua-table">' + thead + tbody + '</table>' + legend;
}

function exportarCuadranteCSV() {
  var anio    = _cuadAdminAnio;
  var mes     = _cuadAdminMes;
  var diasMes = new Date(anio, mes + 1, 0).getDate();
  var empleados = _cuadAdminRaw.empleados.filter(function(e) {
    return _cuadAdminCargo === 'todos' || e.cargo === _cuadAdminCargo;
  });
  if (!empleados.length) { mostrarToast(t('toast.sin_datos'), t('cua.sin_turnos')); return; }

  var mapa = {};
  empleados.forEach(function(e) { mapa[e.id] = {}; });
  _cuadAdminRaw.turnos.forEach(function(tur) {
    if (mapa[tur.empleado_id]) mapa[tur.empleado_id][tur.fecha] = tur.tipo;
  });

  var abrev = { manana:'M', tarde:'T', noche:'N', guardia:'G', libre:'L' };
  var dias = [];
  for (var d = 1; d <= diasMes; d++) dias.push(d);

  var header = [t('cua.empleado')].concat(dias).join(';') + '\n';
  var rows = empleados.map(function(emp) {
    var celdas = dias.map(function(d) {
      var fecha = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var tipo  = mapa[emp.id][fecha];
      return tipo ? (abrev[tipo] || tipo.charAt(0).toUpperCase()) : '';
    });
    return [emp.nombre].concat(celdas).join(';');
  }).join('\n');

  var blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'cuadrante_' + getMes(mes) + '_' + anio + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// DOC ICON SVG — returns an SVG string for each document type
function docIconSVG(tipo) {
  var s = 'width:1.15rem;height:1.15rem;flex-shrink:0';
  if (tipo === 'nomina')    return '<svg style="'+s+'" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
  if (tipo === 'cuadrante') return '<svg style="'+s+'" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  if (tipo === 'contrato')  return '<svg style="'+s+'" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
  return '<svg style="'+s+'" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
}
var _DOC_IC = {
  nomina:    { bg:'rgba(245,184,0,0.08)',   color:'#92680a' },
  cuadrante: { bg:'rgba(0,0,0,0.05)',       color:'#6b7280' },
  contrato:  { bg:'rgba(22,163,74,0.08)',   color:'#16a34a' }
};

// FIRMA DE DOCUMENTOS — avoids browser confirm() which is blocked in iOS PWA mode
async function firmarDoc(docId, nombre, btn) {
  if (btn && !btn.dataset.confirmando) {
    btn.dataset.confirmando = '1';
    var txtOrig = btn.innerHTML;
    btn.innerHTML = '¿Confirmar?';
    btn.classList.add('primary'); btn.classList.remove('gold');
    setTimeout(function() {
      if (btn && btn.dataset.confirmando) {
        delete btn.dataset.confirmando;
        btn.innerHTML = txtOrig;
        btn.classList.remove('primary'); btn.classList.add('gold');
      }
    }, 3000);
    return;
  }
  if (btn) { delete btn.dataset.confirmando; btn.disabled = true; btn.innerHTML = '...'; }
  var res = await sb.from('documentos').update({
    firmado: true,
    fecha_firma: new Date().toISOString(),
    leido: true
  }).eq('id', docId).select('id');
  if (res.error) {
    mostrarToast('❌ Error', res.error.message || 'No se pudo registrar la firma.');
    if (btn) { btn.disabled = false; btn.innerHTML = t('doc.firmar'); }
    return;
  }
  if (!res.data || !res.data.length) {
    mostrarToast('❌ Sin permiso', 'No se pudo registrar la firma. Contacta con coordinación.');
    if (btn) { btn.disabled = false; btn.innerHTML = t('doc.firmar'); }
    return;
  }
  cargarDocumentos();
  mostrarToast(t('toast.firma_ok'), nombre);
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
      mostrarToast(t('toast.doc_nuevo'), nombre + (tipo ? ' · ' + tipo : ''));
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
    lista.innerHTML = emptyState('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', t('rv.no_emp'), t('rv.no_emp_sub'));
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
          '<div><div style="font-weight:500;color:var(--text)">' + e.nombre + '</div>' +
          '<div style="font-size:0.72rem;color:var(--muted)">' + e.cargo + '</div></div>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center;color:var(--text2)">' + total + '</td>' +
      '<td style="text-align:center">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' +
          '<strong style="color:var(--text)">' + usados + '</strong>' +
          '<div style="width:72px;height:4px;background:var(--surface3);border-radius:2px">' +
            '<div style="width:' + pct + '%;height:100%;background:' + colorBar + ';border-radius:2px;transition:width 0.6s"></div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center"><strong style="color:' + colorRest + '">' + restantes + '</strong></td>' +
      '</tr>';
  });

  // Gráfico mensual: días de vacaciones aprobadas por mes (empleados filtrados)
  var empIds = {};
  empleados.forEach(function(e){ empIds[e.id] = true; });
  var mensual = new Array(12).fill(0);
  vacaciones.forEach(function(v) {
    if (!empIds[v.empleado_id]) return;
    var desde = new Date(v.fecha_inicio + 'T12:00:00');
    var hasta = new Date(v.fecha_fin   + 'T12:00:00');
    var cur = new Date(desde);
    while (cur <= hasta) {
      mensual[cur.getMonth()]++;
      cur.setDate(cur.getDate() + 1);
    }
  });
  var maxDias = Math.max.apply(null, mensual) || 1;
  var chartHtml =
    '<div style="padding:1.25rem 1.5rem 1.5rem;border-top:1px solid var(--border)">' +
    '<div style="font-size:0.62rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:1rem">' + t('rv.chart') + ano + '</div>' +
    '<div style="display:flex;align-items:flex-end;gap:5px;height:68px">' +
    mensual.map(function(d, i) {
      var pxH = d > 0 ? Math.max(4, Math.round((d / maxDias) * 56)) : 2;
      var col = d === 0
        ? 'rgba(255,255,255,0.04)'
        : (d >= maxDias * 0.8 ? 'var(--red)' : d >= maxDias * 0.45 ? 'var(--yellow)' : 'var(--green)');
      var hoy = new Date();
      var esActual = (i === hoy.getMonth() && ano === hoy.getFullYear());
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;height:68px">' +
        (d > 0 ? '<span style="font-size:0.5rem;color:var(--muted);line-height:1">' + d + '</span>' : '') +
        '<div title="' + getMes(i) + ': ' + d + ' ' + (d !== 1 ? t('g.dias') : t('g.dia')) + '"' +
          ' style="width:100%;height:' + pxH + 'px;background:' + col + ';border-radius:3px 3px 0 0;' +
          (esActual && d > 0 ? 'box-shadow:0 0 8px ' + col + ';' : '') +
          'transition:height 0.6s cubic-bezier(0.22,1,0.36,1);animation:scaleIn 0.4s ease both;animation-delay:' + (i * 28) + 'ms"></div>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:5px;margin-top:3px;border-top:1px solid rgba(255,255,255,0.05);padding-top:5px">' +
    [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i) {
      var hoy = new Date();
      var esActual = (i === hoy.getMonth() && ano === hoy.getFullYear());
      return '<div style="flex:1;text-align:center;font-size:0.52rem;color:' + (esActual ? 'var(--gold)' : 'var(--muted)') + ';font-weight:' + (esActual ? '700' : '400') + '">' + getMesCorto(i) + '</div>';
    }).join('') +
    '</div>' +
    '</div>';

  lista.innerHTML =
    '<table style="font-size:0.85rem">' +
      '<thead><tr>' +
        '<th>' + t('rv.col_emp') + '</th>' +
        '<th style="text-align:center">' + t('rv.col_anual') + '</th>' +
        '<th style="text-align:center">' + t('rv.col_usados') + '</th>' +
        '<th style="text-align:center">' + t('rv.col_rest') + '</th>' +
      '</tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody>' +
    '</table>' +
    chartHtml;
}

function exportarResumenVacaciones() {
  var lista = document.getElementById('resumenVacLista');
  if (!lista) return;
  var rows = lista.querySelectorAll('tbody tr');
  if (!rows.length) { mostrarToast('ℹ️ Sin datos', 'No hay datos para exportar.'); return; }
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
  _descargarXlsx(filas, 'Vacaciones ' + ano, [{wch:32},{wch:26},{wch:14},{wch:13},{wch:14}], 'resumen_vacaciones_' + ano);
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
    var dow = cur.getDay();
    if (!excFin || (dow !== 0 && dow !== 6)) {
      fechas.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  if (!fechas.length) { err.style.display='block'; err.textContent='No hay días hábiles en el rango seleccionado.'; return; }

  btn.disabled = true; btn.textContent = t('g.cargando');
  var payload = fechas.map(function(f) {
    var p = { empleado_id: empId, fecha: f, tipo: tipo };
    if (ini)  p.hora_inicio = ini;
    if (fin)  p.hora_fin    = fin;
    if (ubic) p.ubicacion   = ubic;
    return p;
  });
  var { error } = await sb.from('turnos').insert(payload);
  btn.disabled = false; btn.textContent = t('am.btn_fecha');
  if (error) { err.style.display='block'; err.textContent='Error: ' + error.message; return; }
  ok.style.display='block'; ok.textContent='✓ ' + fechas.length + ' turnos creados correctamente.';
  cargarTurnosAdmin();
  cargarCuadranteAdmin();
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

  btn.disabled = true; btn.textContent = t('g.cargando');
  var payload = selIds.map(function(id) {
    var p = { empleado_id: id, fecha: fecha, tipo: tipo };
    if (ini)  p.hora_inicio = ini;
    if (fin)  p.hora_fin    = fin;
    if (ubic) p.ubicacion   = ubic;
    return p;
  });
  var { error } = await sb.from('turnos').insert(payload);
  btn.disabled = false; btn.textContent = t('am.btn_emp');
  if (error) { err.style.display='block'; err.textContent='Error: ' + error.message; return; }
  ok.style.display='block'; ok.textContent='✓ ' + selIds.length + ' turnos creados para el ' + fecha + '.';
  seleccionarTodosEmp(false);
  cargarTurnosAdmin();
  cargarCuadranteAdmin();
}

// ─── PDF CUADRANTE BETA10 IMPORT ─────────────────────────────

var _pdfImportData = null;
var _PDFJS_SRC    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
var _PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function _cargarPdfjsLib() {
  return new Promise(function(resolve, reject) {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = _PDFJS_WORKER;
      resolve(); return;
    }
    var s = document.createElement('script');
    s.src = _PDFJS_SRC;
    s.onload = function() { window.pdfjsLib.GlobalWorkerOptions.workerSrc = _PDFJS_WORKER; resolve(); };
    s.onerror = function() { reject(new Error('No se pudo cargar PDF.js desde CDN')); };
    document.head.appendChild(s);
  });
}

/* Group PDF text items into visual rows by shared y-coordinate (±tol pt). */
function _pdfAgruparFilas(items, tol) {
  tol = tol || 4;
  var sorted = items.slice().sort(function(a, b) {
    if (a.page !== b.page) return a.page - b.page;
    return b.y - a.y; // PDF y=0 is bottom; descending = top-to-bottom reading order
  });
  var rows = [];
  sorted.forEach(function(item) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0].page === item.page && Math.abs(rows[i][0].y - item.y) <= tol) {
        rows[i].push(item); return;
      }
    }
    rows.push([item]);
  });
  rows.forEach(function(row) { row.sort(function(a, b) { return a.x - b.x; }); });
  return rows;
}

/* Return the day number whose column x-position is closest to x, within colTol. */
function _pdfXADia(x, diaXMap, colTol) {
  var best = null, bestDist = Infinity;
  Object.keys(diaXMap).forEach(function(dia) {
    var d = Math.abs(x - diaXMap[dia]);
    if (d < bestDist) { bestDist = d; best = parseInt(dia, 10); }
  });
  return (bestDist <= colTol) ? best : null;
}

/* Infer shift type from hora_inicio (HH:00 string). */
function _pdfInferirTipo(hi) {
  var h = parseInt((hi || '').split(':')[0], 10);
  if (isNaN(h))          return 'turno';
  if (h >= 5  && h <= 9)  return 'manana';
  if (h >= 13 && h <= 17) return 'tarde';
  if (h >= 20 || h <= 4)  return 'noche';
  return 'turno';
}

/* Uppercase + strip diacritics for name comparison. */
function _pdfNormNombre(s) {
  return (s || '').toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* Fuzzy-match a Beta10 name ("GARCIA BURGOS, LUIS JOSE") to an empleados row. */
function _pdfBuscarEmpleado(nombrePDF, empleados) {
  var norm     = _pdfNormNombre(nombrePDF.replace(',', ' '));
  var palabras = norm.split(' ').filter(Boolean);
  var mejor = null, mejorScore = 0;
  empleados.forEach(function(emp) {
    var ne    = _pdfNormNombre(emp.nombre);
    var score = palabras.filter(function(w) { return ne.indexOf(w) !== -1; }).length;
    if (score > mejorScore) { mejorScore = score; mejor = emp; }
  });
  var minScore = Math.max(2, Math.ceil(palabras.length * 0.5));
  return (mejor && mejorScore >= minScore) ? mejor : null;
}

/**
 * Parse a Beta10 cuadrante PDF.
 * Returns { nombre, mes, anio, turnos: [{fecha, hora_inicio, hora_fin, tipo, ubicacion}] }
 */
async function parsearPDFCuadrante(arrayBuffer) {
  var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Collect all text items with x/y positions across all pages
  var allItems = [];
  for (var p = 1; p <= pdf.numPages; p++) {
    var page = await pdf.getPage(p);
    var tc   = await page.getTextContent();
    tc.items.forEach(function(item) {
      var s = item.str.trim();
      if (s) allItems.push({ str: s, x: item.transform[4], y: item.transform[5], page: p });
    });
  }

  var rows = _pdfAgruparFilas(allItems);
  var nombre = null, mes = null, anio = null;
  var diaHeaderRowIdx = -1, diaXMap = {};

  rows.forEach(function(row, idx) {
    var line = row.map(function(i) { return i.str; }).join(' ');

    // "000836 - GARCIA BURGOS, LUIS JOSE"
    var mEmp = line.match(/\d{3,8}\s*[-–]\s*([A-ZÁÉÍÓÚÑÜA-Za-záéíóúñü][A-ZÁÉÍÓÚÑÜA-Za-záéíóúñü ,]{3,})/);
    if (mEmp && !nombre) nombre = mEmp[1].trim();

    // "MES SERVICIO: 01 (ENERO / 2026)"
    var mMes = line.match(/MES\s+SERVICIO\D{0,6}(\d{1,2})\D{1,40}(\d{4})/);
    if (mMes && !mes) { mes = parseInt(mMes[1], 10); anio = parseInt(mMes[2], 10); }

    // Day-header row: ≥20 items whose text is a bare integer 1–31
    if (diaHeaderRowIdx === -1) {
      var nums = row.filter(function(item) {
        var n = parseInt(item.str, 10);
        return !isNaN(n) && n >= 1 && n <= 31 && String(n) === item.str.trim();
      });
      if (nums.length >= 20) {
        diaHeaderRowIdx = idx;
        nums.forEach(function(item) { diaXMap[parseInt(item.str, 10)] = item.x; });
      }
    }
  });

  if (!nombre)              throw new Error('No se encontró el nombre del empleado en el PDF.');
  if (!mes || !anio)        throw new Error('No se encontró el mes/año en el PDF.');
  if (diaHeaderRowIdx < 0)  throw new Error('No se encontró la tabla de turnos (fila de días 1-31).');

  // Column snap tolerance = half the average inter-column gap
  var diasKeys = Object.keys(diaXMap).map(Number).sort(function(a, b) { return a - b; });
  var colTol   = 10;
  if (diasKeys.length >= 2) {
    var span = diaXMap[diasKeys[diasKeys.length - 1]] - diaXMap[diasKeys[0]];
    colTol   = Math.max(8, Math.ceil(span / (diasKeys.length - 1) / 2) + 2);
  }
  var minDiaX = diaXMap[diasKeys[0]];

  var turnos = [];
  var debugRows = []; // raw text of data rows for diagnostics

  for (var i = diaHeaderRowIdx + 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row.length) continue;

    var nameItems = row.filter(function(it) { return it.x < minDiaX - 5; });
    var dataItems = row.filter(function(it) { return it.x >= minDiaX - 5; });
    if (!dataItems.length) continue;

    var ubicacion = nameItems.map(function(it) { return it.str; }).join(' ').trim() || null;

    // Collect raw strings for debug panel
    if (debugRows.length < 6) {
      debugRows.push((ubicacion ? '[' + ubicacion + '] ' : '') +
        dataItems.map(function(it) { return '"' + it.str + '"'; }).join(' '));
    }

    // Build cells: merge items within 10pt of each other (handles "07" + "/" + "19" splits)
    var cells = [];
    dataItems.forEach(function(it) {
      if (cells.length && Math.abs(it.x - cells[cells.length - 1].x) < 10) {
        cells[cells.length - 1].str += it.str;
      } else {
        cells.push({ str: it.str, x: it.x });
      }
    });

    // Multi-fragment window scan: try 1, 2 or 3 consecutive cells combined
    var ci = 0;
    while (ci < cells.length) {
      var matched = false;
      for (var win = 3; win >= 1; win--) {
        if (ci + win > cells.length) continue;
        var combined = '';
        for (var w = 0; w < win; w++) combined += cells[ci + w].str;
        combined = combined.replace(/\s/g, '');

        // Accept: "07/19"  "07:00/19:00"  "07-19"  "07 19" (any separator between two numbers)
        var mTime = combined.match(/^(\d{1,2})(?::00)?[\/\-:](\d{1,2})(?::00)?$/) ||
                    combined.match(/^(\d{2})(\d{2})$/);
        if (mTime) {
          var dia = _pdfXADia(cells[ci].x, diaXMap, colTol);
          if (dia) {
            var hi = ('0' + parseInt(mTime[1], 10)).slice(-2) + ':00';
            var hf = ('0' + parseInt(mTime[2], 10)).slice(-2) + ':00';
            var mm2 = ('0' + mes).slice(-2);
            var dd2 = ('0' + dia).slice(-2);
            turnos.push({
              fecha:       anio + '-' + mm2 + '-' + dd2,
              hora_inicio: hi,
              hora_fin:    hf,
              tipo:        _pdfInferirTipo(hi),
              ubicacion:   ubicacion
            });
          }
          ci += win;
          matched = true;
          break;
        }
      }
      if (!matched) ci++;
    }
  }

  return { nombre: nombre, mes: mes, anio: anio, turnos: turnos, debugRows: debugRows };
}

async function handlePDFCuadrante(e) {
  var file = e.target.files[0];
  if (!file) return;

  var ok   = document.getElementById('pdfImportOk');
  var err  = document.getElementById('pdfImportError');
  var prev = document.getElementById('pdfPreview');
  ok.style.display = 'none'; err.style.display = 'none'; prev.style.display = 'none';
  _pdfImportData = null;

  prev.innerHTML = '<div class="loading">Procesando PDF…</div>';
  prev.style.display = 'block';

  try {
    await _cargarPdfjsLib();
    var buf   = await file.arrayBuffer();
    var datos = await parsearPDFCuadrante(buf);

    var { data: empleados } = await sb.from('empleados').select('id, nombre').eq('activo', true);
    var emp = _pdfBuscarEmpleado(datos.nombre, empleados || []);
    if (!emp) {
      prev.style.display = 'none';
      err.style.display = 'block';
      err.textContent = 'Empleado no encontrado: "' + datos.nombre + '". Verifica que el nombre coincide con la BD.';
      return;
    }

    _pdfImportData = { empleadoId: emp.id, empleadoNombre: emp.nombre,
                       mes: datos.mes, anio: datos.anio, turnos: datos.turnos };

    var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var mesStr = (MESES[datos.mes - 1] || datos.mes) + ' ' + datos.anio;

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;'
      + 'margin-bottom:0.875rem;flex-wrap:wrap;gap:0.5rem">'
      + '<div><div style="font-weight:600;color:var(--text)">' + emp.nombre + '</div>'
      + '<div style="font-size:var(--text-xs);color:var(--muted)">' + mesStr
      + ' &nbsp;·&nbsp; <strong>' + datos.turnos.length + ' turnos</strong></div></div>'
      + '<button class="btn-sm primary" onclick="confirmarImportPDF()" style="min-height:36px">'
      + 'Confirmar e importar</button></div>';

    if (datos.turnos.length) {
      html += '<div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-sm)">'
        + '<table style="font-size:var(--text-xs)"><thead><tr>'
        + '<th>Fecha</th><th>Inicio</th><th>Fin</th><th>Tipo</th><th>Servicio</th>'
        + '</tr></thead><tbody>';
      datos.turnos.slice(0, 25).forEach(function(turno) {
        html += '<tr><td>' + turno.fecha + '</td>'
          + '<td>' + turno.hora_inicio + '</td><td>' + turno.hora_fin + '</td>'
          + '<td><span class="cal-pill t-' + turno.tipo + '">' + getTipoTurno(turno.tipo) + '</span></td>'
          + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
          + (turno.ubicacion || '—') + '</td></tr>';
      });
      if (datos.turnos.length > 25) {
        html += '<tr><td colspan="5" style="text-align:center;color:var(--muted)">'
          + '… y ' + (datos.turnos.length - 25) + ' más</td></tr>';
      }
      html += '</tbody></table></div>';
      html += '<p style="font-size:var(--text-xs);color:var(--muted);margin-top:0.625rem">'
        + '⚠ Los turnos existentes de ' + emp.nombre + ' en ' + mesStr + ' se reemplazarán.</p>';
    } else {
      html += '<div style="background:var(--yellow-light);border:1px solid rgba(245,184,0,0.3);'
        + 'border-radius:var(--r-xs);padding:0.875rem 1rem;margin-bottom:0.75rem">'
        + '<div style="font-size:var(--text-sm);font-weight:600;color:var(--yellow);margin-bottom:0.375rem">'
        + '0 turnos encontrados</div>'
        + '<div style="font-size:var(--text-xs);color:var(--text2)">El PDF se procesó correctamente (empleado y mes detectados) '
        + 'pero ninguna celda coincide con el formato esperado.<br>'
        + 'Revisa el texto extraído a continuación para ver el formato real del PDF.</div></div>';
      if (datos.debugRows && datos.debugRows.length) {
        html += '<div style="font-size:var(--text-xs);font-weight:600;color:var(--muted);margin-bottom:0.375rem">'
          + '🔍 Texto extraído de las primeras filas de datos:</div>'
          + '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-xs);'
          + 'padding:0.75rem;font-family:monospace;font-size:11px;color:var(--text2);'
          + 'white-space:pre-wrap;word-break:break-all;max-height:180px;overflow-y:auto">'
          + datos.debugRows.map(function(r) { return r; }).join('\n')
          + '</div>'
          + '<p style="font-size:var(--text-xs);color:var(--muted);margin-top:0.5rem">'
          + 'Copia este texto y compártelo para ajustar el parser al formato exacto de tu PDF.</p>';
      }
    }
    prev.innerHTML = html;

  } catch (ex) {
    prev.style.display = 'none';
    err.style.display = 'block';
    err.textContent = 'Error al procesar el PDF: ' + ex.message;
  }
}

async function confirmarImportPDF() {
  if (!_pdfImportData) return;
  var ok  = document.getElementById('pdfImportOk');
  var err = document.getElementById('pdfImportError');
  ok.style.display = 'none'; err.style.display = 'none';

  var d   = _pdfImportData;
  var mm  = ('0' + d.mes).slice(-2);
  var pri = d.anio + '-' + mm + '-01';
  var ult = d.anio + '-' + mm + '-' + new Date(d.anio, d.mes, 0).getDate();

  // Replace: delete existing shifts for employee+month, then insert new ones
  var { error: delErr } = await sb.from('turnos').delete()
    .eq('empleado_id', d.empleadoId).gte('fecha', pri).lte('fecha', ult);
  if (delErr) {
    err.style.display = 'block'; err.textContent = 'Error al limpiar turnos previos: ' + delErr.message; return;
  }

  if (d.turnos.length) {
    var payload = d.turnos.map(function(turno) {
      return { empleado_id: d.empleadoId, fecha: turno.fecha, tipo: turno.tipo,
               hora_inicio: turno.hora_inicio, hora_fin: turno.hora_fin,
               ubicacion: turno.ubicacion || null };
    });
    var { error: insErr } = await sb.from('turnos').insert(payload);
    if (insErr) {
      err.style.display = 'block'; err.textContent = 'Error al guardar turnos: ' + insErr.message; return;
    }
  }

  ok.style.display = 'block';
  ok.textContent = '✓ ' + d.turnos.length + ' turnos importados para ' + d.empleadoNombre + '.';
  document.getElementById('pdfPreview').style.display = 'none';
  document.getElementById('pdfCuadranteArchivo').value = '';
  _pdfImportData = null;
  cargarTurnosAdmin();
  cargarCuadranteAdmin();
}

// ─── PWA ─────────────────────────────────────────────────

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}

// ─── EMAIL NOTIFICATIONS SCAFFOLD ────────────────────────
// Calls the 'notificar-email' Supabase Edge Function.
// Deploy the function at supabase/functions/notificar-email/index.ts
// and configure RESEND_API_KEY + FROM_EMAIL in Supabase secrets.
// This call is fire-and-forget: failures are silent so UX is unaffected.
function notificarEmail(tipo, empleadoId, extra) {
  if (!empleadoId) return;
  sb.functions.invoke('notificar-email', {
    body: { tipo: tipo, empleado_id: empleadoId, extra: extra || {} }
  }).catch(function() {});
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
      cargarBadgeAdmin();
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
      cargarBadgeAdmin();
    })
    .subscribe();
}

// ─── CAMBIO DE CONTRASEÑA DESDE PERFIL ───────────────────

function abrirCambioPassPerfil() {
  document.getElementById('cpPerfilNueva').value    = '';
  document.getElementById('cpPerfilConfirma').value = '';
  document.getElementById('cpPerfilError').style.display = 'none';
  document.getElementById('cpPerfilOk').style.display    = 'none';
  var modal = document.getElementById('cambioPassPerfilModal');
  modal.style.display = 'flex';
  setTimeout(function() { document.getElementById('cpPerfilNueva').focus(); }, 80);
}

function cerrarCambioPassPerfil() {
  document.getElementById('cambioPassPerfilModal').style.display = 'none';
}

async function guardarCambioPassPerfil() {
  var nueva    = document.getElementById('cpPerfilNueva').value;
  var confirma = document.getElementById('cpPerfilConfirma').value;
  var err = document.getElementById('cpPerfilError');
  var ok  = document.getElementById('cpPerfilOk');
  var btn = document.getElementById('cpPerfilBtn');
  err.style.display = 'none'; ok.style.display = 'none';
  if (nueva.length < 8) {
    err.style.display = 'block'; err.textContent = t('cp.err_corta'); return;
  }
  if (nueva !== confirma) {
    err.style.display = 'block'; err.textContent = t('cp.err_match'); return;
  }
  btn.disabled = true; btn.textContent = t('cpp.guardando');
  var { error } = await sb.auth.updateUser({ password: nueva });
  btn.disabled = false; btn.textContent = t('cpp.btn');
  if (error) {
    err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return;
  }
  ok.style.display = 'block'; ok.textContent = t('cpp.ok');
  document.getElementById('cpPerfilNueva').value    = '';
  document.getElementById('cpPerfilConfirma').value = '';
  mostrarToast(t('toast.pass_ok'), t('toast.pass_ok_msg'));
  setTimeout(cerrarCambioPassPerfil, 2200);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('cambioPassPerfilModal') &&
      document.getElementById('cambioPassPerfilModal').style.display === 'flex') cerrarCambioPassPerfil();
});
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'cambioPassPerfilModal') cerrarCambioPassPerfil();
});

// ─── FORZAR RESET DE CONTRASEÑA (ADMIN) ──────────────────

async function forzarResetPassword() {
  var id     = document.getElementById('editEmpId').value;
  var nombre = document.getElementById('editEmpNombre').value.trim() || 'este empleado';
  if (!confirm('¿Forzar cambio de contraseña a ' + nombre + '?\n\nSe le pedirá establecer una nueva contraseña la próxima vez que inicie sesión.')) return;
  var btn = document.getElementById('editEmpResetBtn');
  var err = document.getElementById('editEmpError');
  var ok  = document.getElementById('editEmpOk');
  err.style.display = 'none'; ok.style.display = 'none';
  btn.disabled = true; btn.textContent = '⏳ ' + t('g.cargando');
  var { error } = await sb.from('empleados').update({ debe_cambiar_password: true }).eq('id', id);
  btn.disabled = false; btn.textContent = t('edit.reset_btn');
  if (error) { err.style.display = 'block'; err.textContent = 'Error: ' + error.message; return; }
  ok.style.display = 'block'; ok.textContent = t('edit.reset_ok');
  cargarEmpleados();
}

// ─── DOCUMENTOS ADMIN ─────────────────────────────────────

var allDocsAdmin = [];

async function cargarDocumentosAdmin() {
  var lista = document.getElementById('docsAdminList');
  if (!lista) return;
  lista.innerHTML = skelDocs(6);

  var { data, error } = await sb.from('documentos')
    .select('*, empleados(nombre, cargo)')
    .order('fecha', { ascending: false });

  if (error || !data) {
    lista.innerHTML = '<div class="empty" style="border:none">Error al cargar documentos</div>';
    return;
  }
  allDocsAdmin = data;

  var countEl = document.getElementById('docsAdminCount');
  if (countEl) countEl.textContent = '· ' + data.length + ' documentos';

  var empSel = document.getElementById('docsAdminEmp');
  if (empSel) {
    var empMap = {};
    data.forEach(function(d) {
      if (d.empleados) empMap[d.empleado_id] = d.empleados.nombre;
    });
    var optsHtml = '<option value="">Todos los empleados</option>';
    var sortedIds = Object.keys(empMap).sort(function(a, b) {
      return empMap[a].localeCompare(empMap[b]);
    });
    sortedIds.forEach(function(id) {
      optsHtml += '<option value="' + id + '">' + empMap[id] + '</option>';
    });
    var prevVal = empSel.value;
    empSel.innerHTML = optsHtml;
    if (prevVal) empSel.value = prevVal;
  }

  filtrarDocsAdmin();
}

function filtrarDocsAdmin() {
  var empId   = document.getElementById('docsAdminEmp')    ? document.getElementById('docsAdminEmp').value    : '';
  var tipo    = document.getElementById('docsAdminTipo')   ? document.getElementById('docsAdminTipo').value   : '';
  var firmado = document.getElementById('docsAdminFirmado')? document.getElementById('docsAdminFirmado').value: '';

  var filtered = allDocsAdmin.filter(function(d) {
    if (empId && d.empleado_id !== empId) return false;
    if (tipo  && d.tipo !== tipo) return false;
    if (firmado !== '' && String(d.firmado) !== firmado) return false;
    return true;
  });

  var countEl = document.getElementById('docsAdminCount');
  if (countEl) countEl.textContent = '· ' + filtered.length + ' de ' + allDocsAdmin.length;

  renderDocsAdmin(filtered);
}

function renderDocsAdmin(docs) {
  var lista = document.getElementById('docsAdminList');
  if (!lista) return;
  if (!docs.length) {
    lista.innerHTML = emptyState('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>', t('da.empty'), t('da.empty_sub'));
    return;
  }
  var delay = 0;
  lista.innerHTML = docs.map(function(doc) {
    var icon      = doc.tipo === 'nomina' ? '📄' : doc.tipo === 'cuadrante' ? '📅' : doc.tipo === 'contrato' ? '📋' : '📁';
    var nombreEmp = doc.empleados ? doc.empleados.nombre : '—';
    var cargo     = doc.empleados ? doc.empleados.cargo  : '';
    var safeName  = doc.nombre.replace(/'/g, "\\'");
    var safeUrl   = doc.url.replace(/'/g, "\\'");
    var badgeFirma = doc.firmado
      ? '<span class="badge badge-green">' + t('da.badge_firm') + '</span>'
      : '<span class="badge badge-yellow">' + t('da.badge_nofirm') + '</span>';
    var d = delay; delay += 40;
    return '<div class="doc-item" style="animation:fadeIn 0.28s ease both;animation-delay:' + d + 'ms">' +
      '<div class="doc-info">' +
      '<div class="doc-icon">' + icon + '</div>' +
      '<div>' +
        '<div class="doc-name"><strong style="color:var(--gold)">' + nombreEmp + '</strong> — ' + doc.nombre + '</div>' +
        '<div class="doc-meta">' + (doc.fecha || '') + ' · ' + doc.tipo + (cargo ? ' · <span style="color:var(--muted)">' + cargo + '</span>' : '') + '</div>' +
      '</div></div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
      badgeFirma +
      '<button class="btn-sm primary" onclick="verDoc(\'' + safeUrl + '\', \'' + safeName + '\')">' + t('da.ver') + '</button>' +
      '<button class="btn-sm" onclick="eliminarDocAdmin(\'' + doc.id + '\', \'' + safeUrl + '\')" style="color:var(--red);border-color:rgba(220,38,38,0.3)">✕</button>' +
      '</div></div>';
  }).join('');
}

async function eliminarDocAdmin(docId, url) {
  if (!confirm('¿Eliminar este documento?')) return;
  await sb.storage.from('documentos').remove([url]);
  await sb.from('documentos').delete().eq('id', docId);
  mostrarToast(t('toast.doc_elim'), t('toast.doc_elim_msg'));
  cargarDocumentosAdmin();
}

// ─── EXPORTAR SOLICITUDES A EXCEL ────────────────────────

async function exportarSolicitudesExcel() {
  var { data } = await sb.from('solicitudes')
    .select('*, empleados(nombre)')
    .order('created_at', { ascending: false });
  if (!data || !data.length) { mostrarToast(t('toast.sin_datos'), t('toast.no_sol')); return; }
  var filas = [['Empleado', 'Tipo', 'Fechas', 'Motivo', 'Estado', 'Comentario coordinador', 'Fecha solicitud']];
  data.forEach(function(s) {
    filas.push([
      s.empleados ? s.empleados.nombre : '—',
      s.tipo       || '',
      s.fechas     || '',
      s.motivo     || '',
      s.estado     || '',
      s.comentario || '',
      new Date(s.created_at).toLocaleDateString('es-ES')
    ]);
  });
  _descargarXlsx(filas, 'Solicitudes', [{wch:28},{wch:22},{wch:18},{wch:40},{wch:12},{wch:30},{wch:16}], 'solicitudes_enerpro_' + new Date().toISOString().split('T')[0]);
}

// ─── EXPORTAR VACACIONES A EXCEL ─────────────────────────

async function exportarVacacionesExcel() {
  var filtro = document.getElementById('vacAdminFiltro') ? document.getElementById('vacAdminFiltro').value : 'todas';
  var q = sb.from('vacaciones').select('*, empleados(nombre)').order('fecha_inicio');
  if (filtro !== 'todas') q = q.eq('estado', filtro);
  var { data } = await q;
  if (!data || !data.length) { mostrarToast(t('toast.sin_datos'), t('toast.no_vac_exp')); return; }
  var filas = [['Empleado', 'Tipo', 'Desde', 'Hasta', 'Días', 'Estado', 'Comentario coordinador', 'Notas']];
  data.forEach(function(v) {
    var nombre = v.empleados ? v.empleados.nombre : '—';
    var tipo   = VAC_TIPO_LABEL[v.tipo] || v.tipo;
    var dias   = diasEntre(v.fecha_inicio, v.fecha_fin);
    filas.push([nombre, tipo, v.fecha_inicio, v.fecha_fin, dias, v.estado, v.comentario || '', v.notas || '']);
  });
  _descargarXlsx(filas, 'Vacaciones', [{wch:28},{wch:16},{wch:12},{wch:12},{wch:8},{wch:12},{wch:30},{wch:30}], 'vacaciones_enerpro_' + new Date().toISOString().split('T')[0]);
}
