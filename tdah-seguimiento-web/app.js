/* global jspdf */
(() => {
  /** @typedef {{id:string,name:string,grade:string,createdAt:number}} Student */
  /** @typedef {{dateISO:string, attention:number, tasksCompleted:boolean, interruptions:'few'|'many', notes:string, createdAt:number}} Entry */
  /** @typedef {{version:1, students: Student[], entriesByStudentId: Record<string, Entry[]>}} Store */

  const STORE_KEY = "tdah_tracker_store_v1";

  /** @returns {Store} */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { version: 1, students: [], entriesByStudentId: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return { version: 1, students: [], entriesByStudentId: {} };
      parsed.students ??= [];
      parsed.entriesByStudentId ??= {};
      return parsed;
    } catch {
      return { version: 1, students: [], entriesByStudentId: {} };
    }
  }

  /** @param {Store} store */
  function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  /** @param {string} iso */
  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map((v) => Number(v));
    if (!y || !m || !d) return iso;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }

  function todayISO() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /** @param {Entry[]} entries */
  function sortEntries(entries) {
    entries.sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : b.createdAt - a.createdAt));
  }

  // Elements
  const studentForm = document.getElementById("studentForm");
  const studentName = document.getElementById("studentName");
  const studentGrade = document.getElementById("studentGrade");
  const studentList = document.getElementById("studentList");
  const selectedPill = document.getElementById("selectedPill");
  const btnDeleteStudent = document.getElementById("btnDeleteStudent");
  const btnDemo = document.getElementById("btnDemo");
  const btnReset = document.getElementById("btnReset");

  const entryForm = document.getElementById("entryForm");
  const entryDate = document.getElementById("entryDate");
  const attention = document.getElementById("attention");
  const tasksCompleted = document.getElementById("tasksCompleted");
  const interruptions = document.getElementById("interruptions");
  const notes = document.getElementById("notes");
  const notesHelp = document.getElementById("notesHelp");
  const btnSaveEntry = document.getElementById("btnSaveEntry");
  const btnClearForm = document.getElementById("btnClearForm");

  const historyBody = document.getElementById("historyBody");
  const weekChart = document.getElementById("weekChart");
  const btnExportTxt = document.getElementById("btnExportTxt");
  const btnExportPdf = document.getElementById("btnExportPdf");
  const exportMeta = document.getElementById("exportMeta");

  /** @type {Store} */
  let store = loadStore();
  /** @type {string|null} */
  let selectedStudentId = store.students[0]?.id ?? null;

  entryDate.value = todayISO();

  // UI helpers
  function setSelectedPill() {
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) {
      selectedPill.textContent = "Ninguno seleccionado";
      return;
    }
    selectedPill.textContent = `${st.name}${st.grade ? ` • ${st.grade}` : ""}`;
  }

  function updateEnabledState() {
    const hasSelection = Boolean(selectedStudentId && store.students.some((s) => s.id === selectedStudentId));
    btnDeleteStudent.disabled = !hasSelection;
    btnSaveEntry.disabled = !hasSelection;
    btnClearForm.disabled = !hasSelection;
    btnExportTxt.disabled = !hasSelection;
    btnExportPdf.disabled = !hasSelection;
    exportMeta.textContent = hasSelection
      ? "Incluye últimos 5 días (o menos si no hay registros)."
      : "Selecciona un estudiante.";
  }

  /** @param {Student} s */
  function studentBadgeText(s) {
    const cnt = (store.entriesByStudentId[s.id] ?? []).length;
    return `${cnt} registro${cnt === 1 ? "" : "s"}`;
  }

  function renderStudentList() {
    studentList.innerHTML = "";
    if (store.students.length === 0) {
      const li = document.createElement("li");
      li.className = "studentItem";
      li.style.cursor = "default";
      li.innerHTML = `<div class="studentMeta"><div class="studentName">Aún no hay estudiantes</div><div class="studentGrade">Agrega uno con el formulario</div></div><div class="badge">0</div>`;
      studentList.appendChild(li);
      return;
    }

    for (const s of store.students) {
      const li = document.createElement("li");
      li.className = "studentItem" + (s.id === selectedStudentId ? " studentItem--active" : "");
      li.dataset.studentId = s.id;
      li.innerHTML = `
        <div class="studentMeta">
          <div class="studentName"></div>
          <div class="studentGrade"></div>
        </div>
        <div class="badge"></div>
      `;
      li.querySelector(".studentName").textContent = s.name;
      li.querySelector(".studentGrade").textContent = s.grade || "—";
      li.querySelector(".badge").textContent = studentBadgeText(s);
      li.addEventListener("click", () => {
        selectedStudentId = s.id;
        refreshAll();
      });
      studentList.appendChild(li);
    }
  }

  function renderHistoryTable() {
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) {
      historyBody.innerHTML = `<tr class="table__empty"><td colspan="6">Selecciona un estudiante para ver su historial.</td></tr>`;
      return;
    }

    const entries = (store.entriesByStudentId[st.id] ?? []).slice();
    sortEntries(entries);

    if (entries.length === 0) {
      historyBody.innerHTML = `<tr class="table__empty"><td colspan="6">Sin registros todavía. Crea el primer registro arriba.</td></tr>`;
      return;
    }

    historyBody.innerHTML = "";
    for (const e of entries.slice(0, 20)) {
      const tr = document.createElement("tr");
      const tasksTxt = e.tasksCompleted ? "Sí" : "No";
      const intrTxt = e.interruptions === "few" ? "Pocas" : "Muchas";
      tr.innerHTML = `
        <td>${fmtDate(e.dateISO)}</td>
        <td>${e.attention}</td>
        <td>${tasksTxt}</td>
        <td>${intrTxt}</td>
        <td>${escapeHtml(e.notes || "—")}</td>
        <td style="text-align:right;">
          <button class="btn btn--danger btn--sm" type="button" data-action="delete">Eliminar</button>
        </td>
      `;
      tr.querySelector('button[data-action="delete"]').addEventListener("click", () => {
        deleteEntry(st.id, e.dateISO);
      });
      historyBody.appendChild(tr);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Data mutations
  /** @param {string} name @param {string} grade */
  function addStudent(name, grade) {
    const s = { id: uid("st"), name: name.trim(), grade: grade.trim(), createdAt: Date.now() };
    store.students.unshift(s);
    store.entriesByStudentId[s.id] ??= [];
    selectedStudentId = s.id;
    saveStore(store);
  }

  /** @param {string} studentId */
  function deleteStudent(studentId) {
    store.students = store.students.filter((s) => s.id !== studentId);
    delete store.entriesByStudentId[studentId];
    if (selectedStudentId === studentId) {
      selectedStudentId = store.students[0]?.id ?? null;
    }
    saveStore(store);
  }

  /** @param {string} studentId @param {Entry} entry */
  function upsertEntry(studentId, entry) {
    const arr = (store.entriesByStudentId[studentId] ??= []);
    const idx = arr.findIndex((e) => e.dateISO === entry.dateISO);
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);
    saveStore(store);
  }

  /** @param {string} studentId @param {string} dateISO */
  function deleteEntry(studentId, dateISO) {
    const arr = (store.entriesByStudentId[studentId] ??= []);
    store.entriesByStudentId[studentId] = arr.filter((e) => e.dateISO !== dateISO);
    saveStore(store);
    refreshAll();
  }

  // Chart + exports (implemented in next step)
  function renderChart() {
    const ctx = weekChart.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, weekChart.width, weekChart.height);

    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) {
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "14px Inter, system-ui, sans-serif";
      ctx.fillText("Selecciona un estudiante para ver la gráfica.", 18, 32);
      return;
    }

    const week = getLastNDaysISO(5);
    const entries = (store.entriesByStudentId[st.id] ?? []).slice();
    const byDate = new Map(entries.map((e) => [e.dateISO, e]));
    const points = week.map((d) => ({ dateISO: d, attention: byDate.get(d)?.attention ?? null }));

    drawSimpleLineChart(ctx, weekChart.width, weekChart.height, points);
  }

  function getLastNDaysISO(n) {
    const out = [];
    const dt = new Date();
    dt.setHours(12, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(dt);
      x.setDate(dt.getDate() - i);
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, "0");
      const d = String(x.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${d}`);
    }
    return out;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {{dateISO:string, attention:number|null}[]} points
   */
  function drawSimpleLineChart(ctx, w, h, points) {
    const padL = 54;
    const padR = 16;
    const padT = 18;
    const padB = 42;

    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    // Background
    ctx.fillStyle = "rgba(10,14,30,0.0)";
    ctx.fillRect(0, 0, w, h);

    // Grid + y labels (1..5)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    for (let y = 1; y <= 5; y++) {
      const t = (y - 1) / 4; // 0..1
      const yy = padT + plotH - t * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + plotW, yy);
      ctx.stroke();
      ctx.fillText(String(y), 18, yy + 4);
    }
    ctx.restore();

    // X labels
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "12px Inter, system-ui, sans-serif";
    points.forEach((p, i) => {
      const x = padL + (points.length === 1 ? 0 : (i / (points.length - 1)) * plotW);
      const label = p.dateISO.slice(5); // MM-DD
      ctx.fillText(label, x - 16, h - 16);
    });
    ctx.restore();

    // Data
    const valid = points.filter((p) => typeof p.attention === "number");
    if (valid.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "14px Inter, system-ui, sans-serif";
      ctx.fillText("Aún no hay registros en los últimos 5 días.", padL, padT + 22);
      return;
    }

    const coords = points.map((p, i) => {
      const x = padL + (points.length === 1 ? 0 : (i / (points.length - 1)) * plotW);
      if (typeof p.attention !== "number") return { x, y: null };
      const t = (p.attention - 1) / 4;
      const y = padT + plotH - t * plotH;
      return { x, y };
    });

    // Line
    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(124,92,255,0.85)";
    ctx.beginPath();
    let started = false;
    for (const c of coords) {
      if (c.y == null) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(c.x, c.y);
        started = true;
      } else {
        ctx.lineTo(c.x, c.y);
      }
    }
    ctx.stroke();

    // Points
    for (const c of coords) {
      if (c.y == null) continue;
      ctx.fillStyle = "rgba(45,212,191,0.92)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function buildWeeklySummary(studentId) {
    const st = store.students.find((s) => s.id === studentId) ?? null;
    if (!st) return null;
    const days = getLastNDaysISO(5);
    const entries = (store.entriesByStudentId[studentId] ?? []).slice();
    const byDate = new Map(entries.map((e) => [e.dateISO, e]));
    const rows = days.map((d) => ({ dateISO: d, entry: byDate.get(d) ?? null }));

    const attVals = rows.map((r) => r.entry?.attention).filter((v) => typeof v === "number");
    const avgAtt = attVals.length ? attVals.reduce((a, b) => a + b, 0) / attVals.length : null;
    const manyIntr = rows.filter((r) => r.entry?.interruptions === "many").length;
    const tasksNo = rows.filter((r) => r.entry && r.entry.tasksCompleted === false).length;

    return { student: st, rows, avgAtt, manyIntr, tasksNo };
  }

  function exportTxt(studentId) {
    const sum = buildWeeklySummary(studentId);
    if (!sum) return;
    const { student, rows, avgAtt, manyIntr, tasksNo } = sum;
    const lines = [];
    lines.push("REPORTE SEMANAL - SEGUIMIENTO TDAH (educativo)");
    lines.push(`Estudiante: ${student.name}`);
    if (student.grade) lines.push(`Grado/Curso: ${student.grade}`);
    lines.push(`Generado: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push("Últimos 5 días:");
    for (const r of rows) {
      if (!r.entry) {
        lines.push(`- ${fmtDate(r.dateISO)}: (sin registro)`);
        continue;
      }
      const e = r.entry;
      lines.push(
        `- ${fmtDate(r.dateISO)} | Atención: ${e.attention} | Tareas: ${e.tasksCompleted ? "Sí" : "No"} | Interrupciones: ${
          e.interruptions === "few" ? "Pocas" : "Muchas"
        }${e.notes ? ` | Notas: ${e.notes}` : ""}`,
      );
    }
    lines.push("");
    lines.push("Resumen:");
    lines.push(`- Promedio atención (días con registro): ${avgAtt == null ? "—" : avgAtt.toFixed(2)}`);
    lines.push(`- Días con interrupciones 'Muchas': ${manyIntr}`);
    lines.push(`- Días con tareas NO completadas: ${tasksNo}`);
    lines.push("");
    lines.push("Nota: Este reporte es de apoyo educativo y no sustituye evaluación clínica.");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const fileNameSafe = student.name.replaceAll(/[^a-z0-9áéíóúñü \-_]/gi, "").trim().replaceAll(/\s+/g, "_");
    downloadBlob(blob, `reporte_tdah_${fileNameSafe || "estudiante"}_${todayISO()}.txt`);
  }

  function exportPdf(studentId) {
    const sum = buildWeeklySummary(studentId);
    if (!sum) return;
    const { student, rows, avgAtt, manyIntr, tasksNo } = sum;
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const margin = 44;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Reporte semanal - Seguimiento TDAH (educativo)", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Estudiante: ${student.name}`, margin, y);
    y += 14;
    if (student.grade) {
      doc.text(`Grado/Curso: ${student.grade}`, margin, y);
      y += 14;
    }
    doc.text(`Generado: ${new Date().toLocaleString()}`, margin, y);
    y += 16;

    doc.setDrawColor(220);
    doc.line(margin, y, 595 - margin, y);
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.text("Últimos 5 días:", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    const width = 595 - margin * 2;
    for (const r of rows) {
      const line = r.entry
        ? `${fmtDate(r.dateISO)}  |  Atención: ${r.entry.attention}  |  Tareas: ${r.entry.tasksCompleted ? "Sí" : "No"}  |  Interrupciones: ${
            r.entry.interruptions === "few" ? "Pocas" : "Muchas"
          }${r.entry.notes ? `  |  Notas: ${r.entry.notes}` : ""}`
        : `${fmtDate(r.dateISO)}  |  (sin registro)`;

      y = writeWrapped(doc, line, margin, y, width, 14);
      if (y > 770) {
        doc.addPage();
        y = margin;
      }
    }

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Resumen:", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    y = writeWrapped(doc, `Promedio atención (días con registro): ${avgAtt == null ? "—" : avgAtt.toFixed(2)}`, margin, y, width, 14);
    y = writeWrapped(doc, `Días con interrupciones 'Muchas': ${manyIntr}`, margin, y, width, 14);
    y = writeWrapped(doc, `Días con tareas NO completadas: ${tasksNo}`, margin, y, width, 14);
    y += 8;
    doc.setTextColor(110);
    y = writeWrapped(doc, "Nota: Este reporte es de apoyo educativo y no sustituye evaluación clínica.", margin, y, width, 14);
    doc.setTextColor(0);

    const fileNameSafe = student.name.replaceAll(/[^a-z0-9áéíóúñü \-_]/gi, "").trim().replaceAll(/\s+/g, "_");
    doc.save(`reporte_tdah_${fileNameSafe || "estudiante"}_${todayISO()}.pdf`);
  }

  function writeWrapped(doc, text, x, y, width, lineHeight) {
    const lines = doc.splitTextToSize(text, width);
    for (const ln of lines) {
      doc.text(ln, x, y);
      y += lineHeight;
    }
    return y;
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function refreshAll() {
    setSelectedPill();
    updateEnabledState();
    renderStudentList();
    renderHistoryTable();
    renderChart();
  }

  // Events
  studentForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = studentName.value.trim();
    if (name.length < 2) return;
    addStudent(name, studentGrade.value);
    studentName.value = "";
    studentGrade.value = "";
    refreshAll();
  });

  btnDeleteStudent.addEventListener("click", () => {
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) return;
    const ok = confirm(`¿Eliminar a "${st.name}" y todos sus registros?`);
    if (!ok) return;
    deleteStudent(st.id);
    refreshAll();
  });

  btnReset.addEventListener("click", () => {
    const ok = confirm("¿Borrar TODO (estudiantes y registros) en este navegador?");
    if (!ok) return;
    localStorage.removeItem(STORE_KEY);
    store = loadStore();
    selectedStudentId = null;
    refreshAll();
  });

  btnDemo.addEventListener("click", () => {
    const ok = confirm("Esto cargará un ejemplo (demo) y reemplazará tus datos actuales. ¿Continuar?");
    if (!ok) return;
    store = buildDemoStore();
    saveStore(store);
    selectedStudentId = store.students[0]?.id ?? null;
    refreshAll();
  });

  notes.addEventListener("input", () => {
    notesHelp.textContent = `${notes.value.length}/280`;
  });

  btnClearForm.addEventListener("click", () => {
    entryDate.value = todayISO();
    attention.value = "3";
    tasksCompleted.value = "yes";
    interruptions.value = "few";
    notes.value = "";
    notesHelp.textContent = "0/280";
  });

  entryForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) return;
    const iso = entryDate.value;
    if (!iso) return;
    const att = Number(attention.value);
    const tc = tasksCompleted.value === "yes";
    const intr = interruptions.value === "few" ? "few" : "many";
    const n = notes.value.trim();

    /** @type {Entry} */
    const entry = { dateISO: iso, attention: clamp(att, 1, 5), tasksCompleted: tc, interruptions: intr, notes: n, createdAt: Date.now() };
    upsertEntry(st.id, entry);
    refreshAll();
  });

  btnExportTxt.addEventListener("click", () => {
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) return;
    exportTxt(st.id);
  });

  btnExportPdf.addEventListener("click", () => {
    const st = store.students.find((s) => s.id === selectedStudentId) ?? null;
    if (!st) return;
    exportPdf(st.id);
  });

  function clamp(n, a, b) {
    if (Number.isNaN(n)) return a;
    return Math.min(b, Math.max(a, n));
  }

  /** @returns {Store} */
  function buildDemoStore() {
    const s1 = { id: uid("st"), name: "Ana Pérez", grade: "4to Primaria", createdAt: Date.now() - 100000 };
    const s2 = { id: uid("st"), name: "Luis Rojas", grade: "5to Primaria", createdAt: Date.now() - 90000 };
    const base = todayISO();
    const dt = new Date(base + "T12:00:00");
    const days = [0, 1, 2, 3, 4].map((d) => {
      const x = new Date(dt);
      x.setDate(dt.getDate() - d);
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, "0");
      const dd = String(x.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    });

    /** @type {Record<string, Entry[]>} */
    const entriesByStudentId = {};
    entriesByStudentId[s1.id] = [
      { dateISO: days[4], attention: 2, tasksCompleted: false, interruptions: "many", notes: "Se recomendó pausa breve y recordatorio visual.", createdAt: Date.now() - 70000 },
      { dateISO: days[3], attention: 3, tasksCompleted: true, interruptions: "many", notes: "Mejor con instrucciones cortas.", createdAt: Date.now() - 60000 },
      { dateISO: days[2], attention: 4, tasksCompleted: true, interruptions: "few", notes: "Buen día. Reforzamiento positivo.", createdAt: Date.now() - 50000 },
      { dateISO: days[1], attention: 3, tasksCompleted: true, interruptions: "few", notes: "Participó cuando se le asignó rol.", createdAt: Date.now() - 40000 },
      { dateISO: days[0], attention: 4, tasksCompleted: true, interruptions: "few", notes: "Mantiene atención con actividades cortas.", createdAt: Date.now() - 30000 },
    ];
    entriesByStudentId[s2.id] = [
      { dateISO: days[4], attention: 3, tasksCompleted: true, interruptions: "few", notes: "", createdAt: Date.now() - 65000 },
      { dateISO: days[2], attention: 2, tasksCompleted: false, interruptions: "many", notes: "Se observó impulsividad al hablar.", createdAt: Date.now() - 52000 },
      { dateISO: days[0], attention: 3, tasksCompleted: true, interruptions: "few", notes: "Mejoró con checklist.", createdAt: Date.now() - 31000 },
    ];

    return { version: 1, students: [s1, s2], entriesByStudentId };
  }

  refreshAll();
})();

