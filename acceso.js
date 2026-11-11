// =====================================================================
// acceso.js — Claves de acceso y panel de propietario.
//
// ⚠️ Esto es una protección SIMPLE: frena a los visitantes normales, pero
// como la web es pública, alguien con conocimientos podría saltársela.
// No guardes aquí nada que deba ser secreto de verdad.
//
// Las claves NO están escritas aquí: solo su "huella" (hash SHA-256).
// Para cambiar una clave, usa la herramienta del Panel de propietario,
// que te da la línea exacta para pegar abajo.
// =====================================================================

const CLAVES = {
  propietario: "67854c883721323335fd44bc42084bdc4fdd7910c18125357020222885502dc2",
  usuario: "afc6df04022c956dd507502da484f6dcb1b1f413ba60b02f87609254ef8a04b5"
};

const SAL = "forja-v1:";
const SESION = "forja.acceso";

async function huella(clave) {
  const datos = new TextEncoder().encode(SAL + clave.trim());
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Comprueba si este dispositivo ya había entrado (y si la clave sigue siendo válida)
function accesoGuardado() {
  for (const almacen of [sessionStorage, localStorage]) {
    try {
      const guardado = JSON.parse(almacen.getItem(SESION));
      if (guardado && CLAVES[guardado.rol] === guardado.huella) return guardado.rol;
    } catch { /* almacenamiento no disponible */ }
  }
  return null;
}

function recordarAcceso(rol, huellaClave, recordar) {
  const valor = JSON.stringify({ rol, huella: huellaClave });
  try { (recordar ? localStorage : sessionStorage).setItem(SESION, valor); } catch { /* sin almacenamiento */ }
}

function olvidarAcceso() {
  try { localStorage.removeItem(SESION); sessionStorage.removeItem(SESION); } catch { /* nada */ }
}

function desbloquear(rol) {
  document.body.dataset.rol = rol;
  document.querySelectorAll("[data-solo-propietario]").forEach(el => { el.hidden = rol !== "propietario"; });
  document.documentElement.classList.remove("bloqueado");
  if (rol === "propietario") pintarPanel();
}

// ----- Pantalla de acceso -----
(() => {
  const form = document.getElementById("form-acceso");
  const campo = document.getElementById("clave");
  const error = document.getElementById("acceso-error");
  let intentos = 0;

  if (!window.crypto || !crypto.subtle) {
    error.textContent = "Abre la web desde su dirección https:// para poder entrar.";
  }

  const rol = accesoGuardado();
  if (rol) desbloquear(rol); else campo.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const boton = form.querySelector("button");
    boton.disabled = true;
    error.textContent = "";
    try {
      const h = await huella(campo.value);
      const rolEncontrado = Object.keys(CLAVES).find(r => CLAVES[r] === h);
      if (rolEncontrado) {
        recordarAcceso(rolEncontrado, h, document.getElementById("recordar").checked);
        campo.value = "";
        desbloquear(rolEncontrado);
        if (rolEncontrado === "propietario") avisar("👋 Hola, has entrado como propietario");
        return;
      }
      intentos++;
      // Cada fallo hace esperar un poco más antes de poder volver a probar
      await new Promise(r => setTimeout(r, Math.min(intentos, 5) * 600));
      error.textContent = "Clave incorrecta. Inténtalo de nuevo.";
      form.classList.remove("temblar"); void form.offsetWidth; form.classList.add("temblar");
      campo.select();
    } catch {
      error.textContent = "No se ha podido comprobar la clave en este navegador.";
    } finally {
      boton.disabled = false;
    }
  });

  document.getElementById("salir").addEventListener("click", () => {
    olvidarAcceso();
    location.hash = "";
    location.reload();
  });
})();

// ----- Panel de propietario -----
function pintarPanel() {
  if (document.body.dataset.rol !== "propietario") return;
  const rutinas = leerRutinas();
  const contar = origen => rutinas.filter(r => r.origen === origen).length;
  const ejercicios = rutinas.flatMap(r => r.dias.flatMap(d => d.ejercicios));

  document.getElementById("panel-datos").innerHTML = [
    ["Rutinas guardadas", rutinas.length],
    ["Escaneadas de papel", contar("escaneada")],
    ["Generadas", contar("generada")],
    ["Escritas a mano", contar("manual")],
    ["Ejercicios en total", ejercicios.length]
  ].map(([texto, n]) => `<div class="clave"><span>${texto}</span><strong>${n}</strong></div>`).join("");

  const veces = {};
  ejercicios.forEach(ej => {
    const nombre = ej.nombre.trim();
    if (nombre) veces[nombre] = (veces[nombre] || 0) + 1;
  });
  const top = Object.entries(veces).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById("panel-top").innerHTML = top.length
    ? top.map(([nombre, n]) => `<li><span>${escapar(nombre)}</span><strong>${n}</strong></li>`).join("")
    : "<li class='panel-vacio'>Todavía no hay rutinas guardadas.</li>";
}

(() => {
  // Descargar copia de seguridad
  document.getElementById("exportar").addEventListener("click", () => {
    const rutinas = leerRutinas();
    if (!rutinas.length) { avisar("No hay rutinas que descargar."); return; }
    const blob = new Blob([JSON.stringify({ app: "forja", version: 1, rutinas }, null, 2)], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `forja-rutinas-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  });

  // Cargar copia de seguridad (se añaden a las que ya hay, sin duplicar)
  document.getElementById("importar").addEventListener("change", async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      const nuevas = (datos.rutinas || []).filter(r => r && r.id && Array.isArray(r.dias));
      if (!nuevas.length) throw new Error("vacío");
      const actuales = leerRutinas();
      const ids = new Set(actuales.map(r => r.id));
      const añadidas = nuevas.filter(r => !ids.has(r.id));
      escribirRutinas([...añadidas, ...actuales]);
      pintarLista();
      avisar(`✅ ${añadidas.length} rutinas cargadas`);
    } catch {
      avisar("Ese archivo no es una copia de FORJA válida.");
    }
  });

  document.getElementById("borrar-todo").addEventListener("click", () => {
    if (!leerRutinas().length) return;
    if (confirm("¿Borrar TODAS las rutinas guardadas en este dispositivo? No se puede deshacer.")) {
      escribirRutinas([]);
      pintarLista();
      document.getElementById("vista-rutina").hidden = true;
      document.getElementById("lista-rutinas").hidden = false;
      avisar("Se han borrado todas las rutinas");
    }
  });

  // Crear el código de una nueva clave
  document.getElementById("crear-codigo").addEventListener("click", async () => {
    const clave = document.getElementById("nueva-clave").value.trim();
    const rol = document.getElementById("nueva-clave-rol").value;
    if (clave.length < 10) { avisar("Usa una clave de al menos 10 caracteres."); return; }
    const otra = rol === "propietario" ? "usuario" : "propietario";
    const h = await huella(clave);
    if (h === CLAVES[otra]) { avisar("Esa clave ya es la del otro tipo de acceso. Elige otra."); return; }
    const codigo = document.getElementById("codigo-clave");
    codigo.textContent = `  ${rol}: "${h}"${rol === "propietario" ? "," : ""}`;
    codigo.hidden = false;
  });
})();
