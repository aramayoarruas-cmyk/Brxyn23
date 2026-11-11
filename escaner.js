// =====================================================================
// escaner.js — Lee una foto de una tabla de ejercicios y la pasa a digital.
// Usa Tesseract.js (reconocimiento de texto) dentro del propio navegador:
// la foto NO se sube a ningún servidor. Los archivos están en la carpeta ocr/
// y solo se descargan la primera vez que alguien escanea.
// =====================================================================

// ----- 1. Interpretar el texto leído y convertirlo en días y ejercicios -----
const RE_DIA = /^(?:d[ií1l]a\s*\d+|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|day\s*\d+|sesi[oó]n\s*\d+|entreno\s*\d+|rutina\s+[a-z0-9])/i;
const RE_SERIES_X = /(\d{1,2})\s*[x×X*]\s*(\d{1,3}(?:\s*[-–/]\s*\d{1,3})?|al\s+fallo|fallo)/i;
const RE_SERIES_DE = /(\d{1,2})\s*(?:series|serie|sets?|s\b)\s*(?:de|x)?\s*(\d{1,3}(?:\s*[-–]\s*\d{1,3})?)/i;
const RE_PESO = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|kgs|kilos?)\b/i;
const RE_COLUMNAS = /^(.*?[a-záéíóúüñ)])\s+(\d{1,2})\s+(\d{1,3}(?:\s*[-–]\s*\d{1,3})?)(?:\s+(\d{1,3}(?:[.,]\d{1,2})?))?\s*$/i;
const RE_PALABRAS_CABECERA = /\b(ejercicios?|series|reps|repeticiones|peso|carga|descanso)\b/gi;

function capitalizar(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

function limpiarNombre(t) {
  return capitalizar(t
    .replace(/\b(reps?|repeticiones|series|kg)\b/gi, " ")
    .replace(/^\s*(?:\d{1,2}\s*[.)\-–]\s*)?[-–•·*>|~_=]*\s*/, "")   // "1." "-" "•" al principio
    .replace(/[\s\-–:|,.;_~=()]+$/, "")                              // restos al final
    .replace(/\s+/g, " ")
    .trim());
}

function interpretarTexto(texto) {
  const lineas = texto.split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const dias = [];
  let actual = null;
  const nuevoDia = (titulo) => { actual = { titulo, ejercicios: [] }; dias.push(actual); };

  for (const linea of lineas) {
    const letras = (linea.match(/[a-záéíóúüñ]/gi) || []).length;
    if (letras < 3) continue; // ruido de la foto

    const tieneNumeros = /\d/.test(linea);
    const tieneSeries = RE_SERIES_X.test(linea) || RE_SERIES_DE.test(linea);
    const corta = linea.length <= 40;

    // ¿Es el título de un día? ("Día 1", "Lunes - Pecho", "PIERNA", "Espalda:")
    const esMayusculas = linea === linea.toUpperCase() && linea.split(" ").length <= 4;
    if (corta && !tieneSeries && (RE_DIA.test(linea) || (!tieneNumeros && (/:\s*$/.test(linea) || esMayusculas)))) {
      // Cabecera de una tabla ("EJERCICIO SERIES REPS"): se ignora
      if (!tieneNumeros && (linea.match(RE_PALABRAS_CABECERA) || []).length >= 2) continue;
      nuevoDia(capitalizar(linea.replace(/[\s:\-–]+$/, "")));
      continue;
    }
    if (!tieneNumeros && (linea.match(RE_PALABRAS_CABECERA) || []).length >= 2) continue;

    // Es un ejercicio: separamos nombre, series, repeticiones y peso
    let resto = linea, series = "", reps = "", peso = "";
    let m = resto.match(RE_PESO);
    if (m) { peso = m[1].replace(",", "."); resto = resto.replace(m[0], " "); }

    m = resto.match(RE_SERIES_X) || resto.match(RE_SERIES_DE);
    if (m) {
      series = m[1];
      reps = m[2].replace(/\s+/g, " ").replace(/\s*[–]\s*|\s*-\s*/g, "-").toLowerCase();
      resto = resto.replace(m[0], " ");
      const pesoSuelto = resto.match(/\s(\d{1,3}(?:[.,]\d{1,2})?)\s*$/); // "Press 4x10 60"
      if (pesoSuelto && !peso) { peso = pesoSuelto[1].replace(",", "."); resto = resto.replace(pesoSuelto[0], " "); }
    } else if ((m = resto.match(RE_COLUMNAS))) { // tabla en columnas: "Press banca 4 10 60"
      resto = m[1]; series = m[2]; reps = m[3].replace(/\s+/g, "");
      if (m[4] && !peso) peso = m[4].replace(",", ".");
    }

    const nombre = limpiarNombre(resto);
    if (nombre.replace(/[^a-záéíóúüñ]/gi, "").length < 3) continue;
    if (!actual) nuevoDia("Día 1");
    actual.ejercicios.push({ nombre, series, reps, peso });
  }
  return dias.filter(d => d.ejercicios.length);
}

// ----- 2. Preparar la imagen para que se lea mejor -----
function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen"));
    img.src = URL.createObjectURL(archivo);
  });
}

function prepararImagen(img) {
  // Tamaño razonable: ni enorme (lento) ni pequeña (ilegible)
  const lado = Math.max(img.naturalWidth, img.naturalHeight);
  const escala = lado > 2000 ? 2000 / lado : lado < 1000 ? 1000 / lado : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * escala);
  canvas.height = Math.round(img.naturalHeight * escala);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Escala de grises + estirar el contraste (el papel más blanco, la tinta más oscura)
  const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = datos.data;
  const histograma = new Array(256).fill(0);
  for (let i = 0; i < p.length; i += 4) {
    const gris = Math.round(0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]);
    p[i] = gris;
    histograma[gris]++;
  }
  const total = p.length / 4;
  let acumulado = 0, bajo = 0, alto = 255;
  for (let v = 0; v < 256; v++) { acumulado += histograma[v]; if (acumulado > total * 0.01) { bajo = v; break; } }
  acumulado = 0;
  for (let v = 255; v >= 0; v--) { acumulado += histograma[v]; if (acumulado > total * 0.10) { alto = v; break; } }
  const rango = Math.max(1, alto - bajo);
  for (let i = 0; i < p.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((p[i] - bajo) / rango) * 255));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  ctx.putImageData(datos, 0, 0);
  return canvas;
}

// ----- 3. Lector de texto (Tesseract.js), cargado solo cuando hace falta -----
let lector = null;
let alProgresar = () => {};

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("script"));
    document.head.appendChild(s);
  });
}

async function obtenerLector() {
  if (lector) return lector;
  if (!window.Tesseract) await cargarScript("ocr/tesseract.min.js");
  lector = await Tesseract.createWorker("spa", 1, {
    workerPath: "ocr/worker.min.js",
    corePath: "ocr/core",
    langPath: "ocr/lang",
    workerBlobURL: false,
    logger: (m) => alProgresar(m)
  });
  await lector.setParameters({ preserve_interword_spaces: "1" });
  return lector;
}

// ----- 4. Interfaz -----
(() => {
  const inputFoto = document.getElementById("foto");
  const zonaFoto = document.getElementById("zona-foto");
  const previa = document.getElementById("foto-previa");
  const textoZona = document.getElementById("zona-foto-texto");
  const botonLeer = document.getElementById("leer-foto");
  const progreso = document.getElementById("progreso");
  const relleno = document.getElementById("progreso-relleno");
  const textoProgreso = document.getElementById("progreso-texto");
  const detalles = document.getElementById("texto-detectado");
  let archivo = null;

  function elegirArchivo(f) {
    if (!f || !f.type.startsWith("image/")) {
      avisar("Elige una imagen (JPG, PNG…).");
      return;
    }
    archivo = f;
    previa.src = URL.createObjectURL(f);
    previa.hidden = false;
    textoZona.innerHTML = "<small>¿No es esta? Toca para elegir otra foto.</small>";
    botonLeer.disabled = false;
  }

  inputFoto.addEventListener("change", () => elegirArchivo(inputFoto.files[0]));

  // Arrastrar y soltar (en ordenador)
  ["dragenter", "dragover"].forEach(ev => zonaFoto.addEventListener(ev, (e) => { e.preventDefault(); zonaFoto.classList.add("arrastrando"); }));
  ["dragleave", "drop"].forEach(ev => zonaFoto.addEventListener(ev, () => zonaFoto.classList.remove("arrastrando")));
  zonaFoto.addEventListener("drop", (e) => { e.preventDefault(); elegirArchivo(e.dataTransfer.files[0]); });

  function mostrarProgreso(texto, fraccion) {
    progreso.hidden = false;
    textoProgreso.textContent = texto;
    relleno.style.width = `${Math.round(fraccion * 100)}%`;
  }

  alProgresar = (m) => {
    if (m.status === "recognizing text") mostrarProgreso(`Leyendo tu tabla… ${Math.round(m.progress * 100)}%`, 0.3 + m.progress * 0.7);
    else mostrarProgreso("Preparando el lector (solo tarda la primera vez)…", 0.05 + (m.progress || 0) * 0.25);
  };

  botonLeer.addEventListener("click", async () => {
    if (!archivo) return;
    botonLeer.disabled = true;
    mostrarProgreso("Preparando la foto…", 0.02);
    try {
      const img = await cargarImagen(archivo);
      const canvas = prepararImagen(img);
      const motor = await obtenerLector();
      const { data } = await motor.recognize(canvas);
      const texto = data.text || "";
      const dias = interpretarTexto(texto);
      const total = dias.reduce((s, d) => s + d.ejercicios.length, 0);

      document.getElementById("texto-ocr").textContent = texto.trim() || "(no se ha detectado texto)";
      detalles.hidden = false;
      progreso.hidden = true;

      abrirEditor({ nombre: "", origen: "escaneada", dias }, total
        ? { titulo: "Revisa tu tabla",
            mensaje: `Hemos encontrado ${total} ${total === 1 ? "ejercicio" : "ejercicios"} en ${dias.length} ${dias.length === 1 ? "día" : "días"}. Revisa que todo esté bien y corrige lo que haga falta antes de guardar.`,
            tipoMensaje: "ok" }
        : { titulo: "No hemos podido leer tu tabla",
            mensaje: "No hemos reconocido ejercicios en la foto. Prueba con más luz, la hoja recta y letra más clara, o escríbela tú aquí abajo.",
            tipoMensaje: "" });
    } catch (err) {
      console.error(err);
      progreso.hidden = true;
      avisar("Ha habido un problema al leer la foto. Inténtalo de nuevo.");
    } finally {
      botonLeer.disabled = false;
    }
  });

  document.getElementById("crear-manual").addEventListener("click", () => {
    detalles.hidden = true;
    abrirEditor({ nombre: "", origen: "manual", dias: [] }, { titulo: "Escribe tu tabla" });
  });
})();
