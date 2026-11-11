// ===== Base de ejercicios por grupo muscular y material =====
const EJERCICIOS = {
  cuadriceps: {
    gimnasio: ["Sentadilla con barra", "Prensa de piernas", "Sentadilla búlgara", "Extensión de cuádriceps", "Sentadilla hack", "Zancadas con mancuernas"],
    mancuernas: ["Sentadilla goblet", "Sentadilla búlgara con mancuernas", "Zancadas con mancuernas", "Step-up con mancuernas", "Sentadilla con mancuernas"],
    corporal: ["Sentadilla", "Zancadas alternas", "Sentadilla búlgara", "Sentadilla con salto", "Sentadilla en pared (isométrico)"]
  },
  posterior: {
    gimnasio: ["Peso muerto rumano", "Hip thrust con barra", "Curl femoral en máquina", "Peso muerto convencional", "Buenos días con barra"],
    mancuernas: ["Peso muerto rumano con mancuernas", "Hip thrust con mancuerna", "Peso muerto a una pierna", "Puente de glúteo con mancuerna"],
    corporal: ["Puente de glúteo", "Puente de glúteo a una pierna", "Peso muerto a una pierna", "Curl nórdico asistido"]
  },
  pecho: {
    gimnasio: ["Press de banca con barra", "Press inclinado con mancuernas", "Aperturas en polea", "Press en máquina", "Fondos en paralelas"],
    mancuernas: ["Press de banca con mancuernas", "Press inclinado con mancuernas", "Aperturas con mancuernas", "Flexiones con agarre en mancuernas"],
    corporal: ["Flexiones", "Flexiones con pies elevados", "Flexiones diamante", "Flexiones abiertas"]
  },
  espalda: {
    gimnasio: ["Dominadas o jalón al pecho", "Remo con barra", "Remo en polea baja", "Remo con mancuerna a una mano", "Jalón con agarre estrecho"],
    mancuernas: ["Remo con mancuerna a una mano", "Remo inclinado con mancuernas", "Pullover con mancuerna", "Remo renegado"],
    corporal: ["Remo invertido bajo mesa", "Dominadas (si tienes barra)", "Superman", "Remo con toalla en puerta"]
  },
  hombro: {
    gimnasio: ["Press militar con barra", "Elevaciones laterales", "Face pull en polea", "Press de hombro con mancuernas", "Pájaros en máquina"],
    mancuernas: ["Press de hombro con mancuernas", "Elevaciones laterales", "Pájaros con mancuernas", "Press Arnold"],
    corporal: ["Flexiones pica", "Elevaciones en Y tumbado", "Flexiones pica con pies elevados", "Paseo de oso"]
  },
  biceps: {
    gimnasio: ["Curl con barra", "Curl martillo", "Curl en polea", "Curl inclinado con mancuernas"],
    mancuernas: ["Curl con mancuernas", "Curl martillo", "Curl concentrado"],
    corporal: ["Curl con toalla (isométrico)", "Dominadas supinas (si tienes barra)", "Remo invertido supino"]
  },
  triceps: {
    gimnasio: ["Extensión de tríceps en polea", "Press francés", "Fondos en banco", "Extensión sobre la cabeza en polea"],
    mancuernas: ["Extensión sobre la cabeza con mancuerna", "Patada de tríceps", "Press francés con mancuernas"],
    corporal: ["Fondos en silla", "Flexiones diamante", "Extensión de tríceps en el suelo"]
  },
  core: {
    gimnasio: ["Plancha", "Elevación de piernas colgado", "Rueda abdominal", "Pallof press en polea", "Crunch en polea"],
    mancuernas: ["Plancha", "Paseo del granjero", "Russian twist con mancuerna", "Dead bug"],
    corporal: ["Plancha", "Dead bug", "Plancha lateral", "Escaladores", "Hollow hold"]
  }
};

// ===== Plantillas de días (grupos musculares en orden de prioridad) =====
const PLANTILLAS = {
  fullA:  { nombre: "Cuerpo completo A", grupos: ["cuadriceps", "pecho", "espalda", "posterior", "hombro", "core", "biceps", "triceps"] },
  fullB:  { nombre: "Cuerpo completo B", grupos: ["posterior", "espalda", "pecho", "cuadriceps", "hombro", "core", "triceps", "biceps"] },
  fullC:  { nombre: "Cuerpo completo C", grupos: ["cuadriceps", "espalda", "hombro", "pecho", "posterior", "core", "biceps", "triceps"] },
  torso:  { nombre: "Torso", grupos: ["pecho", "espalda", "hombro", "espalda", "pecho", "triceps", "biceps", "hombro"] },
  pierna: { nombre: "Pierna", grupos: ["cuadriceps", "posterior", "cuadriceps", "posterior", "core", "core", "cuadriceps", "posterior"] },
  empuje: { nombre: "Empuje (pecho, hombro, tríceps)", grupos: ["pecho", "hombro", "pecho", "hombro", "triceps", "triceps", "core", "pecho"] },
  tiron:  { nombre: "Tirón (espalda, bíceps)", grupos: ["espalda", "espalda", "posterior", "espalda", "biceps", "biceps", "core", "hombro"] }
};

const DIVISIONES = {
  2: ["fullA", "fullB"],
  3: ["fullA", "fullB", "fullC"],
  4: ["torso", "pierna", "torso", "pierna"],
  5: ["torso", "pierna", "empuje", "tiron", "pierna"],
  6: ["empuje", "tiron", "pierna", "empuje", "tiron", "pierna"]
};

const NOMBRES_DIVISION = {
  2: "Cuerpo completo", 3: "Cuerpo completo", 4: "Torso / Pierna",
  5: "Torso / Pierna + Empuje / Tirón", 6: "Empuje / Tirón / Pierna"
};

// ===== Parámetros según objetivo =====
const OBJETIVOS = {
  musculo: { nombre: "Ganar músculo", series: 3, reps: "8-12", descanso: "60-90 s", extra: null },
  fuerza:  { nombre: "Ganar fuerza", series: 4, reps: "4-6", repsAccesorio: "8-10", descanso: "2-3 min", extra: null },
  grasa:   { nombre: "Perder grasa", series: 3, reps: "12-15", descanso: "30-45 s", extra: "Final: 10-15 min de cardio por intervalos (30 s intenso / 60 s suave)" },
  salud:   { nombre: "Salud y forma", series: 2, reps: "10-12", descanso: "60 s", extra: "Final: 15-20 min de caminata rápida, bici o elíptica" }
};

const AJUSTE_NIVEL = { principiante: -1, intermedio: 0, avanzado: 1 };
const EJERCICIOS_POR_DURACION = { 30: 4, 45: 5, 60: 6, 75: 7 };

const CONSEJOS = {
  musculo: "Cuando completes todas las series en el máximo de repeticiones, sube un poco el peso la semana siguiente.",
  fuerza: "Prioriza la técnica en los ejercicios principales y sube el peso poco a poco (2,5 kg cuando completes todas las series).",
  grasa: "Combina esta rutina con un ligero déficit calórico y camina 8.000-10.000 pasos al día.",
  salud: "La constancia es lo más importante: es mejor entrenar un poco cada semana que mucho de vez en cuando."
};

// ===== Generación =====
function generarRutina({ objetivo, nivel, dias, duracion, material }) {
  const obj = OBJETIVOS[objetivo];
  const numEjercicios = EJERCICIOS_POR_DURACION[duracion] - (obj.extra && duracion <= 45 ? 1 : 0);
  const series = Math.max(2, obj.series + AJUSTE_NIVEL[nivel]);

  return DIVISIONES[dias].map((clave, indiceDia) => {
    const plantilla = PLANTILLAS[clave];
    const usados = new Set();
    const contador = {};
    const ejercicios = [];

    for (const grupo of plantilla.grupos.slice(0, numEjercicios)) {
      const lista = EJERCICIOS[grupo][material];
      contador[grupo] = (contador[grupo] || 0);
      // Rotamos según el día para que los días repetidos tengan variedad
      let i = (indiceDia + contador[grupo]) % lista.length;
      let intentos = 0;
      while (usados.has(lista[i]) && intentos < lista.length) {
        i = (i + 1) % lista.length;
        intentos++;
      }
      contador[grupo]++;
      usados.add(lista[i]);

      const esPrincipal = ejercicios.length < 2;
      let reps = obj.reps;
      if (objetivo === "fuerza" && !esPrincipal) reps = obj.repsAccesorio;
      if (grupo === "core" && lista[i].match(/Plancha|hold|isométrico/i)) reps = "30-45 s";
      const seriesEj = esPrincipal ? series : Math.max(2, series - (objetivo === "fuerza" ? 1 : 0));

      ejercicios.push({ nombre: lista[i], pauta: `${seriesEj} × ${reps}` });
    }

    return { titulo: `Día ${indiceDia + 1}`, enfoque: plantilla.nombre, ejercicios, extra: obj.extra };
  });
}

// ===== Pintar en la página =====
const formulario = document.getElementById("formulario");
const resultado = document.getElementById("resultado");

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

formulario.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = {
    objetivo: formulario.querySelector('input[name="objetivo"]:checked').value,
    nivel: formulario.querySelector('input[name="nivel"]:checked').value,
    dias: Number(document.getElementById("dias").value),
    duracion: Number(document.getElementById("duracion").value),
    material: document.getElementById("material").value
  };
  const nombre = document.getElementById("nombre").value.trim();
  const obj = OBJETIVOS[datos.objetivo];
  const rutina = generarRutina(datos);
  const nivelTexto = datos.nivel.charAt(0).toUpperCase() + datos.nivel.slice(1);

  resultado.innerHTML = `
    <div class="resultado-cabecera">
      <div>
        <h3>${nombre ? `Rutina de ${escapar(nombre)}` : "Tu rutina"}</h3>
        <p class="resumen">${obj.nombre} · ${nivelTexto} · ${datos.dias} días · ${datos.duracion} min</p>
      </div>
      <div class="acciones">
        <button class="btn btn-secundario btn-pequeno" onclick="window.print()">Imprimir / PDF</button>
        <a href="#generador" class="btn btn-pequeno">Cambiar datos</a>
      </div>
    </div>

    <div class="claves">
      <div class="clave"><span>División</span><strong>${NOMBRES_DIVISION[datos.dias]}</strong></div>
      <div class="clave"><span>Repeticiones</span><strong>${obj.reps}</strong></div>
      <div class="clave"><span>Descanso entre series</span><strong>${obj.descanso}</strong></div>
      <div class="clave"><span>Calentamiento</span><strong>5-10 min</strong></div>
    </div>

    <div class="dias">
      ${rutina.map(dia => `
        <article class="dia">
          <div class="dia-titulo"><h4>${dia.titulo}</h4><p>${dia.enfoque}</p></div>
          <table>
            ${dia.ejercicios.map(ej => `<tr><td>${ej.nombre}</td><td>${ej.pauta}</td></tr>`).join("")}
          </table>
          ${dia.extra ? `<div class="dia-extra">${dia.extra}</div>` : ""}
        </article>`).join("")}
    </div>

    <div class="consejos">
      <h4>Consejos para progresar</h4>
      <ul>
        <li>${CONSEJOS[datos.objetivo]}</li>
        <li>Deja al menos un día de descanso entre sesiones que trabajen los mismos músculos.</li>
        <li>Termina cada serie con 1-3 repeticiones en reserva: cansado, pero con buena técnica.</li>
        ${datos.nivel === "principiante" ? "<li>Las primeras 2 semanas usa pesos ligeros para aprender bien cada movimiento.</li>" : ""}
      </ul>
    </div>
  `;
  resultado.hidden = false;
  resultado.scrollIntoView({ behavior: "smooth", block: "start" });
});
