# FORJA · Rutinas de gimnasio a medida

Web de rutinas de gimnasio personalizadas. Funciona entera en el navegador, sin servidor, publicada con GitHub Pages.

## Qué hace
- **Generador de rutinas**: plan semanal según objetivo, nivel, días, tiempo y material.
- **Escáner de tablas en papel**: haz una foto de tu tabla y se pasa a digital (lector de texto Tesseract.js, la foto no sale del dispositivo).
- **Mis rutinas**: guarda, edita e imprime tus rutinas, y marca los ejercicios hechos en el modo entreno.
- **Claves de acceso**: una para el propietario (con panel propio) y otra para los usuarios.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página |
| `style.css` | El diseño |
| `app.js` | Generador de rutinas |
| `escaner.js` | Lectura de fotos de tablas |
| `rutinas.js` | Guardado, editor y "Mis rutinas" |
| `acceso.js` | Claves de acceso y panel de propietario |
| `ocr/` | Lector de texto (Tesseract.js) e idioma español |

## Cambiar las claves
Entra con la clave de propietario, ve a **Panel → Cambiar las claves de acceso**, genera el código y pégalo en `acceso.js`.

> La clave es una protección simple: frena a los visitantes, pero no es seguridad real. Las rutinas se guardan en el dispositivo de cada usuario.
