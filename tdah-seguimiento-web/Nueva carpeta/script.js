// JavaScript para Sistema de Seguimiento TDAH
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización
    initializeApp();
    
    // Event Listeners
    setupEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
});

const STORAGE_KEYS = {
    patients: 'tdah.patients.v1'
};

let charts = {
    byStatus: null,
    byAge: null,
    weeklyAttention: null
};

function initializeApp() {
    console.log('Sistema TDAH inicializado 🧠');
    
    // Animación de entrada para tarjetas
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function setupEventListeners() {
    // Botón flotante para acciones rápidas
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
        fabButton.addEventListener('click', showQuickActions);
    }
    
    // Búsqueda de pacientes
    const searchInput = document.getElementById('patientSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Botones de acción rápida
    const quickActionButtons = document.querySelectorAll('.btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });

    // Navegación tipo "ventanas"
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();

    // Botones para abrir Nuevo Estudiante
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) newPatientBtn.addEventListener('click', () => navigateTo('/new'));
    const newPatientBtn2 = document.getElementById('newPatientBtn2');
    if (newPatientBtn2) newPatientBtn2.addEventListener('click', () => navigateTo('/new'));

    // Formulario Nuevo Estudiante
    const newPatientForm = document.getElementById('newPatientForm');
    if (newPatientForm) {
        newPatientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const patient = getPatientFromForm(newPatientForm);
            addPatient(patient);
            newPatientForm.reset();
            showNotification('Estudiante guardado', 'success');
        });
    }

    const saveAndGoList = document.getElementById('npSaveAndGoList');
    if (saveAndGoList && newPatientForm) {
        saveAndGoList.addEventListener('click', () => {
            const patient = getPatientFromForm(newPatientForm);
            addPatient(patient);
            newPatientForm.reset();
            showNotification('Estudiante guardado', 'success');
            navigateTo('/patients');
        });
    }

    const refreshChartsBtn = document.getElementById('refreshChartsBtn');
    if (refreshChartsBtn) {
        refreshChartsBtn.addEventListener('click', () => {
            renderCharts();
            showNotification('Gráficas actualizadas', 'success');
        });
    }

    // Registro diario
    const dailyRecordForm = document.getElementById('dailyRecordForm');
    if (dailyRecordForm) {
        dailyRecordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const record = getDailyRecordFromForm(dailyRecordForm);
            if (!record) return;
            upsertDailyRecord(record.studentId, record);
            showNotification('Registro diario guardado', 'success');
            updateStats();
            renderPatientsTable();
            renderCharts();
        });
    }

    const chartsStudent = document.getElementById('chartsStudent');
    if (chartsStudent) chartsStudent.addEventListener('change', () => renderCharts());
    const chartsWeekEnd = document.getElementById('chartsWeekEnd');
    if (chartsWeekEnd) chartsWeekEnd.addEventListener('change', () => renderCharts());

    const exportWeeklyBtn = document.getElementById('exportWeeklyBtn');
    if (exportWeeklyBtn) exportWeeklyBtn.addEventListener('click', () => exportWeeklyTxt());

    const exportWeeklyPdfBtn = document.getElementById('exportWeeklyPdfBtn');
    if (exportWeeklyPdfBtn) exportWeeklyPdfBtn.addEventListener('click', () => exportWeeklyPdf());
}

function loadInitialData() {
    ensureSeedData();
    renderPatientsTable();
    updateStats();
    renderCharts();
    hydrateStudentSelects();

    setTimeout(() => {
        showNotification('Sistema cargado correctamente', 'success');
    }, 600);
}

function handleActionClick(event) {
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    if (icon && icon.classList.contains('fa-eye')) {
        viewPatientDetails(button);
    } else if (icon && icon.classList.contains('fa-edit')) {
        editPatient(button);
    } else if (icon && icon.classList.contains('fa-chart-bar')) {
        viewPatientStats(button);
    }
}

function viewPatientDetails(button) {
    const row = button.closest('tr');
    const patientName = row.querySelector('.patient-name').textContent;
    
    showNotification(`Viendo detalles de: ${patientName}`, 'info');
    
    // Aquí podrías abrir un modal con detalles del paciente
    console.log(`Mostrando detalles de ${patientName}`);
}

function editPatient(button) {
    const row = button.closest('tr');
    const patientName = row.querySelector('.patient-name').textContent;
    
    showNotification(`Editando: ${patientName}`, 'info');
    console.log(`Editando paciente: ${patientName}`);
}

function viewPatientStats(button) {
    const row = button.closest('tr');
    const patientName = row.querySelector('.patient-name').textContent;
    
    showNotification(`Estadísticas de: ${patientName}`, 'info');
    console.log(`Mostrando estadísticas de: ${patientName}`);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const nameEl = row.querySelector('.patient-name');
        const idEl = row.querySelector('.patient-id');
        const patientName = nameEl ? nameEl.textContent.toLowerCase() : '';
        const patientId = idEl ? idEl.textContent.toLowerCase() : '';
        
        if (patientName.includes(searchTerm) || patientId.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleQuickAction(event) {
    const button = event.currentTarget;
    const buttonText = button.textContent.trim();
    
    switch(buttonText) {
        case 'Abrir Registro':
            showNotification('Abriendo registro diario...', 'info');
            navigateTo('/daily');
            break;
        case 'Ver Lista':
            showNotification('Abriendo lista de estudiantes...', 'info');
            navigateTo('/patients');
            break;
        case 'Ver Gráficas':
            showNotification('Abriendo gráficas...', 'info');
            navigateTo('/charts');
            break;
        case 'Nuevo Estudiante':
            showNotification('Abriendo formulario de nuevo estudiante...', 'info');
            navigateTo('/new');
            break;
        default:
            console.log('Acción no reconocida:', buttonText);
    }
}

function showQuickActions() {
    // Crear menú flotante de acciones rápidas
    const existingMenu = document.querySelector('.quick-actions-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'quick-actions-menu fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-2 z-50';
    menu.innerHTML = `
        <button type="button" data-fab-action="new-student" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
            <i class="fas fa-user-plus mr-2 text-blue-600"></i>Nuevo Estudiante
        </button>
        <button type="button" data-fab-action="daily" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
            <i class="fas fa-clipboard-check mr-2 text-green-600"></i>Nuevo registro diario
        </button>
        <button type="button" data-fab-action="charts" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
            <i class="fas fa-chart-pie mr-2 text-purple-600"></i>Ver gráficas
        </button>
        <button type="button" data-fab-action="export" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
            <i class="fas fa-file-export mr-2 text-red-600"></i>Exportar semana
        </button>
    `;

    menu.addEventListener('click', e => {
        const btn = e.target.closest('[data-fab-action]');
        if (!btn) return;
        e.stopPropagation();
        const action = btn.getAttribute('data-fab-action');
        menu.remove();
        if (action === 'new-student') navigateTo('/new');
        else if (action === 'daily') navigateTo('/daily');
        else if (action === 'charts') navigateTo('/charts');
        else if (action === 'export') {
            navigateTo('/charts');
            setTimeout(() => {
                const exportBtn = document.getElementById('exportWeeklyBtn');
                if (exportBtn) exportBtn.click();
            }, 50);
        }
    });
    
    document.body.appendChild(menu);
    
    // Cerrar menú al hacer clic fuera
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function updateStats() {
    const patients = getPatients();

    const activePatients = patients.length;
    const todayYmd = isoToYmd(new Date().toISOString());
    const todayFromRecords = patients.reduce((acc, p) => {
        if (!Array.isArray(p.dailyRecords)) return acc;
        return acc + p.dailyRecords.filter(r => r && r.date === todayYmd).length;
    }, 0);
    const todayFromEvaluations = patients.reduce(
        (acc, p) => acc + (Array.isArray(p.evaluations) ? p.evaluations.filter(e => isToday(e.date)).length : 0),
        0
    );
    const todayRecords = todayFromRecords + todayFromEvaluations;
    const reminders = Math.max(0, Math.round(activePatients * 0.5));
    const averageProgress = patients.length
        ? Math.round(patients.reduce((acc, p) => acc + (typeof p.progress === 'number' ? p.progress : 0), 0) / patients.length)
        : 0;

    const elActive = document.getElementById('statActivePatients');
    if (elActive) elActive.textContent = String(activePatients);
    const elRecords = document.getElementById('statTodayRecords');
    if (elRecords) elRecords.textContent = String(todayRecords);
    const elRem = document.getElementById('statReminders');
    if (elRem) elRem.textContent = String(reminders);
    const elProg = document.getElementById('statAvgProgress');
    if (elProg) elProg.textContent = `${averageProgress}%`;
}

function animateCounter(target, label) {
    // Esta función animaría los contadores si tuviéramos elementos específicos
    console.log(`Actualizando ${label}: ${target}`);
}

function updateProgressBar(percentage) {
    // Esta función actualizaría una barra de progreso si existiera
    console.log(`Progreso actualizado: ${percentage}%`);
}

function showNotification(message, type = 'info') {
    // Eliminar notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Funciones para manejo de datos (simuladas)
function savePatientData(patientData) {
    // Simular guardado de datos
    console.log('Guardando datos del paciente:', patientData);
    showNotification('Datos guardados correctamente', 'success');
}

function getPatientData(patientId) {
    // Simular obtención de datos
    console.log('Obteniendo datos del paciente:', patientId);
    return {
        id: patientId,
        name: 'Estudiante ejemplo',
        age: 12,
        evaluations: []
    };
}

// Función para formatear fechas
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Función para calcular edad
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function navigateTo(path) {
    window.location.hash = `#${path}`;
}

function getCurrentRoute() {
    const hash = window.location.hash || '#/dashboard';
    const route = hash.replace(/^#/, '');
    return route.startsWith('/') ? route : '/dashboard';
}

function handleRouteChange() {
    const route = getCurrentRoute();
    const view = route.replace('/', '') || 'dashboard';

    const views = document.querySelectorAll('.app-view');
    views.forEach(v => {
        const vName = v.getAttribute('data-view');
        if (vName === view) v.classList.remove('hidden');
        else v.classList.add('hidden');
    });

    const links = document.querySelectorAll('.top-nav-link');
    links.forEach(a => {
        const href = a.getAttribute('href') || '';
        a.classList.toggle('active', href === `#/${view}`);
    });

    if (view === 'patients') {
        renderPatientsTable();
    }
    if (view === 'charts') {
        hydrateStudentSelects();
        renderCharts();
    }
    if (view === 'daily') {
        hydrateStudentSelects();
        presetDailyRecordDate();
    }
    if (view === 'dashboard') {
        updateStats();
    }
}

function getPatients() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.patients);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function setPatients(patients) {
    localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients));
}

function ensureSeedData() {
    const existing = getPatients();
    if (existing.length) return;

    const seed = [
        {
            id: 'P001',
            name: 'María González',
            birthDate: '2013-02-15',
            guardian: 'Laura González',
            phone: '',
            status: 'stable',
            notes: '',
            createdAt: new Date().toISOString(),
            lastEvaluationAt: daysAgoIso(2),
            evaluations: [{ date: daysAgoIso(2), score: 62 }],
            dailyRecords: [
                { studentId: 'P001', date: isoToYmd(daysAgoIso(4)), attention: 3, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P001', date: isoToYmd(daysAgoIso(3)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P001', date: isoToYmd(daysAgoIso(2)), attention: 3, tasksCompleted: false, interruptions: 'many', comment: '' },
                { studentId: 'P001', date: isoToYmd(daysAgoIso(1)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P001', date: isoToYmd(daysAgoIso(0)), attention: 5, tasksCompleted: true, interruptions: 'few', comment: '' }
            ],
            progress: 82
        },
        {
            id: 'P002',
            name: 'Carlos Rodríguez',
            birthDate: '2010-09-01',
            guardian: 'Pedro Rodríguez',
            phone: '',
            status: 'observation',
            notes: '',
            createdAt: new Date().toISOString(),
            lastEvaluationAt: daysAgoIso(1),
            evaluations: [{ date: daysAgoIso(1), score: 71 }],
            dailyRecords: [
                { studentId: 'P002', date: isoToYmd(daysAgoIso(4)), attention: 2, tasksCompleted: false, interruptions: 'many', comment: '' },
                { studentId: 'P002', date: isoToYmd(daysAgoIso(3)), attention: 3, tasksCompleted: false, interruptions: 'many', comment: '' },
                { studentId: 'P002', date: isoToYmd(daysAgoIso(2)), attention: 2, tasksCompleted: false, interruptions: 'many', comment: '' },
                { studentId: 'P002', date: isoToYmd(daysAgoIso(1)), attention: 3, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P002', date: isoToYmd(daysAgoIso(0)), attention: 3, tasksCompleted: true, interruptions: 'few', comment: '' }
            ],
            progress: 68
        },
        {
            id: 'P003',
            name: 'Ana Martínez',
            birthDate: '2015-06-10',
            guardian: 'Sofía Martínez',
            phone: '',
            status: 'improving',
            notes: '',
            createdAt: new Date().toISOString(),
            lastEvaluationAt: daysAgoIso(7),
            evaluations: [{ date: daysAgoIso(7), score: 58 }],
            dailyRecords: [
                { studentId: 'P003', date: isoToYmd(daysAgoIso(4)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P003', date: isoToYmd(daysAgoIso(3)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P003', date: isoToYmd(daysAgoIso(2)), attention: 5, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P003', date: isoToYmd(daysAgoIso(1)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' },
                { studentId: 'P003', date: isoToYmd(daysAgoIso(0)), attention: 4, tasksCompleted: true, interruptions: 'few', comment: '' }
            ],
            progress: 84
        }
    ];

    setPatients(seed);
}

function getNextPatientId(patients) {
    const nums = patients
        .map(p => (p.id || '').match(/^P(\d+)$/))
        .filter(Boolean)
        .map(m => Number(m[1]))
        .filter(n => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `P${String(next).padStart(3, '0')}`;
}

function getPatientFromForm(form) {
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const birthDate = String(fd.get('birthDate') || '').trim();
    const guardian = String(fd.get('guardian') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const status = String(fd.get('status') || 'stable').trim();
    const notes = String(fd.get('notes') || '').trim();

    const patients = getPatients();
    const id = getNextPatientId(patients);
    const createdAt = new Date().toISOString();

    return {
        id,
        name,
        birthDate,
        guardian,
        phone,
        status,
        notes,
        createdAt,
        lastEvaluationAt: null,
        evaluations: [],
        progress: 0
    };
}

function addPatient(patient) {
    const patients = getPatients();
    patients.unshift(patient);
    setPatients(patients);
    renderPatientsTable();
    updateStats();
    renderCharts();
}

function getLastActivityLabel(p) {
    let latestYmd = '';
    if (Array.isArray(p.dailyRecords)) {
        for (const r of p.dailyRecords) {
            if (r && r.date && (!latestYmd || r.date > latestYmd)) latestYmd = r.date;
        }
    }
    if (latestYmd) return humanizeDate(`${latestYmd}T12:00:00`);
    if (p.lastEvaluationAt) return humanizeDate(p.lastEvaluationAt);
    return 'Sin registros';
}

function renderPatientsTable() {
    const tbody = document.getElementById('patientsTbody');
    if (!tbody) return;

    const patients = getPatients();
    if (!patients.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 1.25rem; color: #6b7280;">
                    No hay estudiantes registrados. Ve a <a href="#/new" style="color:#6d28d9; font-weight:600; text-decoration:none;">Nuevo estudiante</a>.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = patients
        .map(p => {
            const age = p.birthDate ? calculateAge(p.birthDate) : '';
            const lastActivity = getLastActivityLabel(p);
            const statusLabel = statusToLabel(p.status);
            const statusClass = statusToClass(p.status);
            const avatarSeed = encodeURIComponent(p.id || p.name || 'patient');
            return `
                <tr data-patient-id="${escapeHtml(p.id)}">
                    <td>
                        <div class="patient-info">
                            <img src="https://picsum.photos/seed/${avatarSeed}/40/40.jpg" alt="Estudiante">
                            <div>
                                <p class="patient-name">${escapeHtml(p.name || '')}</p>
                                <p class="patient-id">ID: ${escapeHtml(p.id || '')}</p>
                            </div>
                        </div>
                    </td>
                    <td>${age !== '' ? `${age} años` : '-'}</td>
                    <td>${escapeHtml(lastActivity)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-button view" data-action="view" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-button edit" data-action="edit" title="Editar (demo)">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button stats" data-action="stats" title="Ver gráficas">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');

    // Delegación de eventos para botones de acción
    tbody.querySelectorAll('.action-button').forEach(btn => btn.addEventListener('click', onPatientAction));
}

function onPatientAction(e) {
    const btn = e.currentTarget;
    const row = btn.closest('tr');
    const patientId = row ? row.getAttribute('data-patient-id') : '';
    const action = btn.getAttribute('data-action');
    const patient = getPatients().find(p => p.id === patientId);
    if (!patient) return;

    if (action === 'view') {
        showNotification(`Viendo: ${patient.name}`, 'info');
    } else if (action === 'edit') {
        showNotification(`Edición demo: ${patient.name}`, 'info');
    } else if (action === 'stats') {
        showNotification(`Abriendo gráficas...`, 'info');
        navigateTo('/charts');
    }
}

function statusToLabel(status) {
    if (status === 'stable') return 'Estable';
    if (status === 'observation') return 'En Observación';
    if (status === 'improving') return 'Mejorando';
    return 'Estable';
}

function statusToClass(status) {
    if (status === 'stable') return 'stable';
    if (status === 'observation') return 'observation';
    if (status === 'improving') return 'improving';
    return 'stable';
}

function renderCharts() {
    if (typeof Chart === 'undefined') return;

    const patients = getPatients();
    const counts = { stable: 0, observation: 0, improving: 0 };
    patients.forEach(p => {
        if (p.status && counts[p.status] !== undefined) counts[p.status] += 1;
        else counts.stable += 1;
    });

    const ageBuckets = { '6-8': 0, '9-11': 0, '12-14': 0, '15+': 0 };
    patients.forEach(p => {
        if (!p.birthDate) return;
        const age = calculateAge(p.birthDate);
        if (age <= 8) ageBuckets['6-8'] += 1;
        else if (age <= 11) ageBuckets['9-11'] += 1;
        else if (age <= 14) ageBuckets['12-14'] += 1;
        else ageBuckets['15+'] += 1;
    });

    const ctxStatus = document.getElementById('chartByStatus');
    const ctxAge = document.getElementById('chartByAge');
    const ctxWeekly = document.getElementById('chartWeeklyAttention');
    if (!ctxStatus || !ctxAge) return;

    // Destroy previous charts
    if (charts.byStatus) charts.byStatus.destroy();
    if (charts.byAge) charts.byAge.destroy();
    if (charts.weeklyAttention) charts.weeklyAttention.destroy();

    charts.byStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Estable', 'En Observación', 'Mejorando'],
            datasets: [{
                data: [counts.stable, counts.observation, counts.improving],
                backgroundColor: ['#16a34a', '#f59e0b', '#2563eb'],
                borderColor: ['#ffffff', '#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    charts.byAge = new Chart(ctxAge, {
        type: 'bar',
        data: {
            labels: Object.keys(ageBuckets),
            datasets: [{
                label: 'Estudiantes',
                data: Object.values(ageBuckets),
                backgroundColor: '#7c3aed'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    if (ctxWeekly) {
        const chartsStudent = document.getElementById('chartsStudent');
        const selectedId = chartsStudent && chartsStudent.value ? chartsStudent.value : (patients[0] ? patients[0].id : '');
        const student = patients.find(p => p.id === selectedId) || patients[0];

        const weekEndEl = document.getElementById('chartsWeekEnd');
        const weekEnd = weekEndEl && weekEndEl.value ? weekEndEl.value : isoToYmd(new Date().toISOString());

        const points = student ? getWeeklyAttentionPoints(student, weekEnd) : [];

        charts.weeklyAttention = new Chart(ctxWeekly, {
            type: 'line',
            data: {
                labels: points.map(p => p.label),
                datasets: [{
                    label: 'Atención (1-5)',
                    data: points.map(p => p.attention),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    fill: true,
                    tension: 0.25,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, min: 0, max: 5, ticks: { stepSize: 1 } }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function isToday(isoDate) {
    if (!isoDate) return false;
    const d = new Date(isoDate);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function daysAgoIso(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function isoToYmd(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function hydrateStudentSelects() {
    const patients = getPatients();
    const selects = [
        document.getElementById('drStudent'),
        document.getElementById('chartsStudent')
    ].filter(Boolean);

    selects.forEach(sel => {
        const current = sel.value;
        sel.innerHTML = patients
            .map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.id)})</option>`)
            .join('');
        if (current && patients.some(p => p.id === current)) sel.value = current;
    });

    const weekEndEl = document.getElementById('chartsWeekEnd');
    if (weekEndEl && !weekEndEl.value) weekEndEl.value = isoToYmd(new Date().toISOString());
}

function presetDailyRecordDate() {
    const drDate = document.getElementById('drDate');
    if (drDate && !drDate.value) drDate.value = isoToYmd(new Date().toISOString());
}

function getDailyRecordFromForm(form) {
    const fd = new FormData(form);
    const studentId = String(fd.get('studentId') || '').trim();
    const date = String(fd.get('date') || '').trim(); // YYYY-MM-DD
    const attention = Number(fd.get('attention') || 0);
    const tasksCompleted = String(fd.get('tasksCompleted') || 'no') === 'yes';
    const interruptions = String(fd.get('interruptions') || 'few');
    const comment = String(fd.get('comment') || '').trim();

    if (!studentId || !date || !Number.isFinite(attention) || attention < 1 || attention > 5) {
        showNotification('Completa estudiante, fecha y atención (1-5)', 'warning');
        return null;
    }

    return { studentId, date, attention, tasksCompleted, interruptions, comment };
}

function upsertDailyRecord(studentId, record) {
    const patients = getPatients();
    const idx = patients.findIndex(p => p.id === studentId);
    if (idx < 0) return;

    const patient = patients[idx];
    if (!Array.isArray(patient.dailyRecords)) patient.dailyRecords = [];

    const existingIdx = patient.dailyRecords.findIndex(r => r.date === record.date);
    if (existingIdx >= 0) patient.dailyRecords[existingIdx] = record;
    else patient.dailyRecords.push(record);

    const points = getWeeklyAttentionPoints(patient, isoToYmd(new Date().toISOString()));
    const avg = points.length ? points.reduce((a, p) => a + p.attention, 0) / points.length : 0;
    patient.progress = Math.round(avg * 20);

    setPatients(patients);
}

function getWeeklyAttentionPoints(patient, weekEndYmd) {
    // Semana escolar estricta: Lunes–Viernes
    const end = new Date(`${weekEndYmd}T12:00:00`);
    const monday = getMondayOfWeek(end);
    const days = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }

    const records = Array.isArray(patient.dailyRecords) ? patient.dailyRecords : [];
    return days.map(d => {
        const ymd = isoToYmd(d.toISOString());
        const rec = records.find(r => r.date === ymd);
        const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
        return { date: ymd, label, attention: rec ? Number(rec.attention) : 0, record: rec || null };
    });
}

function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 domingo, 1 lunes...
    const diff = day === 0 ? -6 : 1 - day; // si es domingo, ir al lunes anterior
    d.setDate(d.getDate() + diff);
    d.setHours(12, 0, 0, 0);
    return d;
}

function exportWeeklyTxt() {
    const patients = getPatients();
    const chartsStudent = document.getElementById('chartsStudent');
    const studentId = chartsStudent && chartsStudent.value ? chartsStudent.value : (patients[0] ? patients[0].id : '');
    const student = patients.find(p => p.id === studentId);
    if (!student) {
        showNotification('No hay estudiantes para exportar', 'warning');
        return;
    }

    const weekEndEl = document.getElementById('chartsWeekEnd');
    const weekEnd = weekEndEl && weekEndEl.value ? weekEndEl.value : isoToYmd(new Date().toISOString());
    const points = getWeeklyAttentionPoints(student, weekEnd);

    const lines = [];
    lines.push('SISTEMA DE SEGUIMIENTO TDAH - REPORTE SEMANAL');
    lines.push(`Estudiante: ${student.name} (${student.id})`);
    lines.push(`Semana (fin): ${weekEnd}`);
    lines.push('--------------------------------------------');
    lines.push('Fecha | Atención(1-5) | Tareas | Interrupciones | Comentario');
    points.forEach(p => {
        const r = p.record;
        if (!r) {
            lines.push(`${p.date} | - | - | - | (sin registro)`);
            return;
        }
        const tareas = r.tasksCompleted ? 'Sí' : 'No';
        const inter = r.interruptions === 'many' ? 'Muchas' : 'Pocas';
        const comm = (r.comment || '').replaceAll('\n', ' ').trim();
        lines.push(`${r.date} | ${r.attention} | ${tareas} | ${inter} | ${comm}`);
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-semanal-${student.id}-${weekEnd}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showNotification('Reporte TXT descargado', 'success');
}

function exportWeeklyPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        showNotification('No se pudo cargar la librería PDF', 'error');
        return;
    }

    const patients = getPatients();
    const chartsStudent = document.getElementById('chartsStudent');
    const studentId = chartsStudent && chartsStudent.value ? chartsStudent.value : (patients[0] ? patients[0].id : '');
    const student = patients.find(p => p.id === studentId);
    if (!student) {
        showNotification('No hay estudiantes para exportar', 'warning');
        return;
    }

    const weekEndEl = document.getElementById('chartsWeekEnd');
    const weekEnd = weekEndEl && weekEndEl.value ? weekEndEl.value : isoToYmd(new Date().toISOString());
    const points = getWeeklyAttentionPoints(student, weekEnd);
    const monday = getMondayOfWeek(new Date(`${weekEnd}T12:00:00`));
    const mondayYmd = isoToYmd(monday.toISOString());
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fridayYmd = isoToYmd(friday.toISOString());

    const lines = [];
    lines.push('SISTEMA DE SEGUIMIENTO TDAH - REPORTE SEMANAL');
    lines.push(`Institución: Nivel Primario`);
    lines.push(`Estudiante: ${student.name} (${student.id})`);
    lines.push(`Semana escolar: ${mondayYmd} a ${fridayYmd}`);
    lines.push('');
    lines.push('Fecha | Atención(1-5) | Tareas | Interrupciones | Comentario');
    lines.push('-----------------------------------------------------------');
    points.forEach(p => {
        const r = p.record;
        if (!r) {
            lines.push(`${p.date} | - | - | - | (sin registro)`);
            return;
        }
        const tareas = r.tasksCompleted ? 'Sí' : 'No';
        const inter = r.interruptions === 'many' ? 'Muchas' : 'Pocas';
        const comm = (r.comment || '').replaceAll('\n', ' ').trim();
        lines.push(`${r.date} | ${r.attention} | ${tareas} | ${inter} | ${comm}`);
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const maxWidth = 595 - margin * 2;
    const fontSize = 11;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(fontSize);

    const text = lines.join('\n');
    const split = doc.splitTextToSize(text, maxWidth);
    doc.text(split, margin, 60);
    doc.save(`reporte-semanal-${student.id}-${mondayYmd}-a-${fridayYmd}.pdf`);

    showNotification('Reporte PDF descargado', 'success');
}

function humanizeDate(isoDate) {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return formatDate(d);
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

console.log('Sistema de Seguimiento TDAH cargado 🚀');
