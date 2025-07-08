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
async function procesarMensaje(prompt) {
  try {
    const servicios = await obtenerServicios();
    
    // Lógica simple de recomendación basada en palabras clave
    let servicioRecomendado = null;
    
    // Mapeo de palabras clave a servicios
    const palabrasClave = {
      "plomería": ["agua", "caño", "canilla", "inodoro", "ducha", "pérdida", "filtración", "gotea", "gotera"],
      "electricidad": ["luz", "electricidad", "cable", "enchufe", "interruptor", "corte"],
      "gas": ["gas", "estufa", "calefón", "horno", "olor a gas"],
      "limpieza": ["limpieza", "limpiar", "suciedad", "manchas", "desinfectar"],
      "pintura": ["pintura", "pintar", "pared", "color", "barniz"],
      "jardinería": ["jardín", "plantas", "césped", "poda", "riego"],
      "carpintería": ["madera", "puerta", "ventana", "mueble", "cajón"],
      "albañilería": ["pared", "ladrillo", "cemento", "construcción", "rajadura", "rompió"]
    };
    
    // Buscar servicio basado en palabras clave
    for (const [categoria, keywords] of Object.entries(palabrasClave)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        servicioRecomendado = servicios.find(s => 
          s.name.toLowerCase().includes(categoria) || 
          (s.description && s.description.toLowerCase().includes(categoria))
        );
        break;
      }
    }
    
    if (!servicioRecomendado) {
      servicioRecomendado = servicios[0]; // Servicio por defecto
    }
    
    if (servicioRecomendado) {
      const subservicios = await obtenerSubservicios(servicioRecomendado.id);
      const subservicioRecomendado = subservicios[0] || null;
      
      let resultado = `Para tu problema: "${prompt}"\n\n`;
      resultado += `Te recomiendo el servicio: **${servicioRecomendado.name}**\n`;
      resultado += `Descripción: ${servicioRecomendado.description}\n\n`;
      
      if (subservicioRecomendado) {
        resultado += `Subservicio recomendado: **${subservicioRecomendado.name}**\n`;
        resultado += `Descripción: ${subservicioRecomendado.description}\n`;
      }
      
      return resultado;
    }
    
    return "No pude encontrar un servicio adecuado para tu problema. ¿Podrías describir más detalles?";
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