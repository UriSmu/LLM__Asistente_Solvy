import { Ollama } from "@llamaindex/ollama";
import fetch from "node-fetch";
import https from "https";

// Configurar agente HTTPS para ignorar certificados SSL
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Funciones para obtener datos desde la API
async function obtenerServicios() {
  const res = await fetch("https://solvy-app-api.vercel.app/ser/servicios", {
    agent: agent
  });
  if (!res.ok) throw new Error("Error obteniendo servicios");
  return await res.json();
}

async function obtenerSubservicios(idServicio) {
  const res = await fetch(`https://solvy-app-api.vercel.app/ser/${idServicio}/subservicios`, {
    agent: agent
  });
  if (!res.ok) throw new Error("Error obteniendo subservicios");
  return await res.json();
}

async function obtenerPreciosSubservicio(idSubservicio) {
  const res = await fetch(`https://solvy-app-api.vercel.app/ser/subservicio/${idSubservicio}/precios`, {
    agent: agent
  });
  if (!res.ok) throw new Error("Error obteniendo precios");
  return await res.json();
}

const ollamaLLM = new Ollama({
  model: "qwen2.5:1.5b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

// Función para procesar mensajes directamente
function esMensajeSoloGenerico(prompt) {
  const frasesGenericas = [
    "hola", "buenas", "buenos días", "buenas tardes", "buenas noches",
    "saludos", "hey", "hello", "hi", "gracias", "te puedo preguntar algo", "puedo consultar", "consulta", "cómo estás", "qué tal"
  ];
  const texto = prompt.trim().toLowerCase();
  return frasesGenericas.some(frase => texto === frase || texto === frase + "." || texto === frase + "?" || texto === frase + "!");
}

async function procesarMensaje(prompt) {
  try {
    if (!prompt || esMensajeSoloGenerico(prompt)) {
      return "¡Hola! ¿En qué puedo ayudarte? Por favor, contame tu problema o necesidad.";
    }

    const servicios = await obtenerServicios();
    let coincidenciasSubservicios = [];

    // Buscar coincidencias en subservicios
    for (const servicio of servicios) {
      const subservicios = await obtenerSubservicios(servicio.idservicio);
      for (const sub of subservicios) {
        if (sub.palabrasclave) {
          const palabras = sub.palabrasclave.toLowerCase().split(',').map(p => p.trim());
          const coincidencias = palabras.filter(palabra => prompt.toLowerCase().includes(palabra)).length;
          if (coincidencias > 0) {
            coincidenciasSubservicios.push({
              servicio,
              subservicio: sub,
              coincidencias
            });
          }
        }
      }
    }

    // Ordenar por cantidad de coincidencias (mayor primero)
    coincidenciasSubservicios.sort((a, b) => b.coincidencias - a.coincidencias);

    if (coincidenciasSubservicios.length > 0) {
      // Mostrar hasta 3 opciones relevantes
      let resultado = `Para tu problema: "${prompt}"\n\nTe recomiendo estas opciones:\n`;
      const mostrados = coincidenciasSubservicios.slice(0, 3);
      for (const { servicio, subservicio } of mostrados) {
        resultado += `- Servicio: **${servicio.nombre}** | Subservicio: **${subservicio.nombre}**`;
        if (subservicio.descripcion) {
          resultado += `\n  Descripción: ${subservicio.descripcion}`;
        }
        resultado += `\n`;
      }
      return resultado;
    }

    // Si no encontró en subservicios, buscar en servicios
    let coincidenciasServicios = [];
    for (const servicio of servicios) {
      if (servicio.palabrasclave) {
        const palabras = servicio.palabrasclave.toLowerCase().split(',').map(p => p.trim());
        const coincidencias = palabras.filter(palabra => prompt.toLowerCase().includes(palabra)).length;
        if (coincidencias > 0) {
          coincidenciasServicios.push({
            servicio,
            coincidencias
          });
        }
      }
    }
    coincidenciasServicios.sort((a, b) => b.coincidencias - a.coincidencias);

    if (coincidenciasServicios.length > 0) {
      const mejorServicio = coincidenciasServicios[0].servicio;
      const subservicios = await obtenerSubservicios(mejorServicio.idservicio);
      let resultado = `Para tu problema: "${prompt}"\n\nTe recomiendo el servicio: **${mejorServicio.nombre}**\n`;
      if (subservicios.length > 0) {
        resultado += `Algunos subservicios disponibles:\n`;
        for (const sub of subservicios.slice(0, 3)) {
          resultado += `- ${sub.nombre}`;
          if (sub.descripcion) {
            resultado += `\n  Descripción: ${sub.descripcion}`;
          }
          resultado += `\n`;
        }
      }
      return resultado;
    }

    // Si no hay coincidencias, pedir más información
    return "No pude identificar claramente el servicio que necesitás. ¿Podés darme más detalles?";
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    return "Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.";
  }
}

// Crear objeto agente simple
const elAgente = {
  chat: async function(prompt) {
    try {
      console.log("Procesando mensaje:", prompt);
      const resultado = await procesarMensaje(prompt);
      console.log("Resultado generado:", resultado);
      return resultado;
    } catch (error) {
      console.error("Error en chat:", error);
      throw error;
    }
  }
};

// Promise que se resuelve inmediatamente
const agentePromise = Promise.resolve(elAgente);

console.log("Agente inicializado correctamente");

export { elAgente, agentePromise };