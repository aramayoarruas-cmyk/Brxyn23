// =====================================================================
// rutinas.js — Guardado de rutinas, editor, "Mis rutinas" e impresión.
// Formato de una rutina:
// { id, nombre, origen: "generada" | "escaneada" | "manual",
//   dias: [{ titulo, enfoque?, extra?, ejercicios: [{ nombre, series, reps, peso }] }],
//   hechos?: { "dia-ejercicio": true } }
// =====================================================================

// ----- Utilidades -----
function escapar(texto) {
  return String(texto == null ? "" : texto).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function pauta(ej) {
  if (ej.series && ej.reps) return `${ej.series} × ${ej.reps}`;
  if (ej.series) return `${ej.series} series`;
  return ej.reps ? `${ej.reps} reps` : "";
}

function avisar(mensaje) {
  const el = document.getElementById("aviso");
  el.textContent = mensaje;
  el.classList.add("visible");
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => el.classList.remove("visible"), 3200);
}

function imprimir(html) {
  document.getElementById("impresion").innerHTML = html;
  window.print();
}
window.addEventListener("afterprint", () => { document.getElementById("impresion").innerHTML = ""; });

// Pinta los días de una rutina como tarjetas (las mismas del generador)
function htmlDias(rutina, conMarcas) {
  return `<div class="dias">${rutina.dias.map((dia, d) => `
    <article class="dia">
      <div class="dia-titulo"><h4>${escapar(dia.titulo)}</h4>${dia.enfoque ? `<p>${escapar(dia.enfoque)}</p>` : ""}</div>
      <table>${dia.ejercicios.map((ej, e) => {
        const hecho = conMarcas && rutina.hechos && rutina.hechos[`${d}-${e}`];
        return `<tr class="${hecho ? "hecho" : ""}">
          ${conMarcas ? `<td class="celda-check"><input type="checkbox" data-d="${d}" data-e="${e}" ${hecho ? "checked" : ""} aria-label="Hecho: ${escapar(ej.nombre)}"></td>` : ""}
          <td>${escapar(ej.nombre)}${ej.peso ? `<small class="peso">${escapar(ej.peso)} kg</small>` : ""}</td>
          <td>${escapar(pauta(ej))}</td>
        </tr>`;
      }).join("")}</table>
      ${dia.extra ? `<div class="dia-extra">${escapar(dia.extra)}</div>` : ""}
    </article>`).join("")}</div>`;
}

// ----- Almacenamiento en el navegador -----
const ALMACEN = "forja.rutinas";

function leerRutinas() {
  try { return JSON.parse(localStorage.getItem(ALMACEN)) || []; } catch { return []; }
}
function escribirRutinas(lista) {
  try { localStorage.setItem(ALMACEN, JSON.stringify(lista)); return true; } catch { return false; }
}
function obtenerRutina(id) { return leerRutinas().find(r => r.id === id); }

function guardarRutina(rutina, { silencioso = false } = {}) {
  const lista = leerRutinas();
  const copia = JSON.parse(JSON.stringify(rutina));
  copia.id = copia.id || "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  copia.actualizada = new Date().toISOString();
  const i = lista.findIndex(r => r.id === copia.id);
  if (i >= 0) lista[i] = copia; else lista.unshift(copia);
  if (!escribirRutinas(lista)) {
    avisar("No se ha podido guardar: tu navegador no permite guardar datos (¿modo privado?).");
    return null;
  }
  pintarLista();
  if (!silencioso) avisar("✅ Rutina guardada en Mis rutinas");
  return copia.id;
}

function borrarRutina(id) {
  escribirRutinas(leerRutinas().filter(r => r.id !== id));
  pintarLista();
}

// ----- Mis rutinas: lista -----
const listaRutinas = document.getElementById("lista-rutinas");
const vistaRutina = document.getElementById("vista-rutina");
const ORIGEN = { generada: "Generada con FORJA", escaneada: "📷 Escaneada de papel", manual: "Escrita a mano" };

function pintarLista() {
  const rutinas = leerRutinas();
  if (!rutinas.length) {
    if (window.pintarPanel) window.pintarPanel();
    listaRutinas.innerHTML = `<div class="vacio">
      <p>Aún no tienes rutinas guardadas.</p>
      <p><a href="#generador">Genera una</a> o <a href="#escanear">escanea tu tabla de papel</a>.</p>
    </div>`;
    return;
  }
  if (window.pintarPanel) window.pintarPanel();
  listaRutinas.innerHTML = rutinas.map(r => {
    const total = r.dias.reduce((s, d) => s + d.ejercicios.length, 0);
    return `<article class="tarjeta-rutina">
      <span class="insignia insignia-${escapar(r.origen)}">${ORIGEN[r.origen] || ""}</span>
      <h3>${escapar(r.nombre || "Mi rutina")}</h3>
      <p>${r.dias.length} ${r.dias.length === 1 ? "día" : "días"} · ${total} ejercicios</p>
      <div class="acciones">
        <button class="btn btn-pequeno" data-accion="abrir" data-id="${escapar(r.id)}">Abrir</button>
        <button class="btn btn-secundario btn-pequeno" data-accion="editar" data-id="${escapar(r.id)}">Editar</button>
        <button class="btn-texto" data-accion="borrar" data-id="${escapar(r.id)}">Eliminar</button>
      </div>
    </article>`;
  }).join("");
}

listaRutinas.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const { accion, id } = boton.dataset;
  if (accion === "abrir") abrirVista(id);
  if (accion === "editar") editarRutina(id);
  if (accion === "borrar") {
    const r = obtenerRutina(id);
    if (r && confirm(`¿Eliminar "${r.nombre}"? No se puede deshacer.`)) {
      borrarRutina(id);
      if (vistaRutina.dataset.id === id) cerrarVista();
      avisar("Rutina eliminada");
    }
  }
});

// ----- Mis rutinas: vista con modo entreno -----
function abrirVista(id) {
  const r = obtenerRutina(id);
  if (!r) return;
  vistaRutina.dataset.id = id;
  vistaRutina.innerHTML = `
    <div class="resultado-cabecera">
      <div>
        <h3>${escapar(r.nombre || "Mi rutina")}</h3>
        <p class="resumen" id="texto-entreno"></p>
      </div>
      <div class="acciones">
        <button class="btn btn-secundario btn-pequeno" data-accion="reiniciar">Empezar de nuevo</button>
        <button class="btn btn-secundario btn-pequeno" data-accion="imprimir">Imprimir / PDF</button>
        <button class="btn btn-secundario btn-pequeno" data-accion="editar">Editar</button>
        <button class="btn btn-pequeno" data-accion="cerrar">Volver a la lista</button>
      </div>
    </div>
    <div class="barra-entreno"><span id="barra-entreno"></span></div>
    <p class="ayuda">Modo entreno: marca cada ejercicio al terminarlo. Se guarda solo, así puedes seguir otro día donde lo dejaste.</p>
    ${htmlDias(r, true)}`;
  actualizarProgreso(r);
  listaRutinas.hidden = true;
  vistaRutina.hidden = false;
  document.getElementById("mis-rutinas").scrollIntoView({ behavior: "smooth" });
}

function cerrarVista() {
  vistaRutina.hidden = true;
  vistaRutina.dataset.id = "";
  listaRutinas.hidden = false;
}

function actualizarProgreso(r) {
  const total = r.dias.reduce((s, d) => s + d.ejercicios.length, 0);
  const hechos = Object.values(r.hechos || {}).filter(Boolean).length;
  document.getElementById("texto-entreno").textContent = `${hechos} de ${total} ejercicios hechos`;
  document.getElementById("barra-entreno").style.width = total ? `${(hechos / total) * 100}%` : "0";
}

vistaRutina.addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  const r = obtenerRutina(vistaRutina.dataset.id);
  if (!r) return;
  r.hechos = r.hechos || {};
  r.hechos[`${e.target.dataset.d}-${e.target.dataset.e}`] = e.target.checked;
  e.target.closest("tr").classList.toggle("hecho", e.target.checked);
  guardarRutina(r, { silencioso: true });
  actualizarProgreso(r);
});

vistaRutina.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = vistaRutina.dataset.id;
  const r = obtenerRutina(id);
  if (!r) return;
  switch (boton.dataset.accion) {
    case "cerrar": cerrarVista(); break;
    case "editar": editarRutina(id); break;
    case "imprimir": imprimir(`<h1>${escapar(r.nombre)}</h1>${htmlDias(r, false)}`); break;
    case "reiniciar":
      r.hechos = {};
      guardarRutina(r, { silencioso: true });
      abrirVista(id);
      break;
  }
});

// ----- Editor (para tablas escaneadas, escritas a mano o guardadas) -----
const editor = document.getElementById("editor");
const editorDias = document.getElementById("editor-dias");
const editorNombre = document.getElementById("editor-nombre");
const editorMensaje = document.getElementById("editor-mensaje");
let enEdicion = null;

const ejercicioVacio = () => ({ nombre: "", series: "", reps: "", peso: "" });
const diaVacio = (n) => ({ titulo: `Día ${n}`, ejercicios: [ejercicioVacio()] });

function abrirEditor(rutina, { titulo = "Revisa tu tabla", mensaje = "", tipoMensaje = "" } = {}) {
  enEdicion = JSON.parse(JSON.stringify(rutina));
  if (!enEdicion.dias || !enEdicion.dias.length) enEdicion.dias = [diaVacio(1)];
  document.getElementById("editor-titulo").textContent = titulo;
  editorMensaje.textContent = mensaje;
  editorMensaje.className = "editor-mensaje" + (tipoMensaje ? " " + tipoMensaje : "");
  editorMensaje.hidden = !mensaje;
  editorNombre.value = enEdicion.nombre || "";
  pintarEditor();
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editarRutina(id) {
  const r = obtenerRutina(id);
  if (!r) return;
  document.getElementById("texto-detectado").hidden = true;
  abrirEditor(r, { titulo: "Editar rutina" });
}

function pintarEditor() {
  editorDias.innerHTML = enEdicion.dias.map((dia, d) => `
    <div class="editor-dia">
      <div class="editor-dia-cabecera">
        <input class="editor-dia-titulo" data-d="${d}" data-campo="titulo" value="${escapar(dia.titulo)}" placeholder="Nombre del día" aria-label="Nombre del día">
        <button type="button" class="btn-texto" data-accion="borrar-dia" data-d="${d}">Quitar</button>
      </div>
      <div class="editor-fila editor-fila-cabecera"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Peso (kg)</span><span></span></div>
      ${dia.ejercicios.map((ej, e) => `
        <div class="editor-fila">
          <input data-d="${d}" data-e="${e}" data-campo="nombre" value="${escapar(ej.nombre)}" placeholder="Ejercicio" aria-label="Ejercicio">
          <input data-d="${d}" data-e="${e}" data-campo="series" value="${escapar(ej.series)}" placeholder="Series" inputmode="numeric" aria-label="Series">
          <input data-d="${d}" data-e="${e}" data-campo="reps" value="${escapar(ej.reps)}" placeholder="Reps" aria-label="Repeticiones">
          <input data-d="${d}" data-e="${e}" data-campo="peso" value="${escapar(ej.peso)}" placeholder="kg" inputmode="decimal" aria-label="Peso en kg">
          <button type="button" class="borrar-fila" data-accion="borrar-ej" data-d="${d}" data-e="${e}" title="Quitar ejercicio" aria-label="Quitar ejercicio">×</button>
        </div>`).join("")}
      <button type="button" class="btn-texto" data-accion="anadir-ej" data-d="${d}">+ Añadir ejercicio</button>
    </div>`).join("");
}

editorDias.addEventListener("input", (e) => {
  const { d, e: i, campo } = e.target.dataset;
  if (!campo) return;
  if (campo === "titulo") enEdicion.dias[d].titulo = e.target.value;
  else enEdicion.dias[d].ejercicios[i][campo] = e.target.value;
});

editorDias.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const d = Number(boton.dataset.d);
  const dia = enEdicion.dias[d];
  if (boton.dataset.accion === "anadir-ej") {
    dia.ejercicios.push(ejercicioVacio());
    pintarEditor();
    editorDias.querySelectorAll(`input[data-d="${d}"][data-campo="nombre"]`)[dia.ejercicios.length - 1].focus();
  }
  if (boton.dataset.accion === "borrar-ej") {
    dia.ejercicios.splice(Number(boton.dataset.e), 1);
    if (!dia.ejercicios.length) dia.ejercicios.push(ejercicioVacio());
    pintarEditor();
  }
  if (boton.dataset.accion === "borrar-dia") {
    enEdicion.dias.splice(d, 1);
    if (!enEdicion.dias.length) enEdicion.dias.push(diaVacio(1));
    pintarEditor();
  }
});

document.getElementById("anadir-dia").addEventListener("click", () => {
  enEdicion.dias.push(diaVacio(enEdicion.dias.length + 1));
  pintarEditor();
});

document.getElementById("cancelar-editor").addEventListener("click", () => {
  editor.hidden = true;
  enEdicion = null;
});

document.getElementById("guardar-editor").addEventListener("click", () => {
  const limpio = s => String(s || "").trim();
  const dias = enEdicion.dias
    .map(dia => ({
      ...dia,
      titulo: limpio(dia.titulo) || "Día",
      ejercicios: dia.ejercicios
        .map(ej => ({ nombre: limpio(ej.nombre), series: limpio(ej.series), reps: limpio(ej.reps), peso: limpio(ej.peso).replace(",", ".") }))
        .filter(ej => ej.nombre)
    }))
    .filter(dia => dia.ejercicios.length);

  if (!dias.length) {
    avisar("Añade al menos un ejercicio antes de guardar.");
    return;
  }
  const rutina = { ...enEdicion, nombre: limpio(editorNombre.value) || "Mi rutina", dias, hechos: {} };
  const id = guardarRutina(rutina);
  if (!id) return;
  editor.hidden = true;
  enEdicion = null;
  abrirVista(id);
});

pintarLista();

