import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import fetch from "node-fetch";

// Funciones para obtener datos desde la API
async function obtenerServicios() {
  const res = await fetch("https://solvy-app-api.vercel.app/ser/servicios");
  if (!res.ok) throw new Error("Error obteniendo servicios");
  return await res.json();
}

async function obtenerSubservicios(idServicio) {
  const res = await fetch(`https://solvy-app-api.vercel.app/ser/${idServicio}/subservicios`);
  if (!res.ok) throw new Error("Error obteniendo subservicios");
  return await res.json();
}

async function obtenerPreciosSubservicio(idSubservicio) {
  const res = await fetch(`https://solvy-app-api.vercel.app/ser/subservicio/${idSubservicio}/precios`);
  if (!res.ok) throw new Error("Error obteniendo precios");
  return await res.json();
}

// Tool principal
const recomendarServicioTool = tool({
  name: "recomendarServicio",
  description: "Recomienda el servicio y subservicio adecuado según la problemática del usuario",
  parameters: z.object({
    problema: z.string().describe("Descripción del problema del usuario")
  }),
  execute: async ({ problema }) => {
    const texto = problema.toLowerCase();
    const servicios = await obtenerServicios();

    for (const servicio of servicios) {
      if (texto.includes(servicio.nombre.toLowerCase())) {
        const subservicios = await obtenerSubservicios(servicio.idservicio);
        if (subservicios.length > 0) {
          const precios = await obtenerPreciosSubservicio(subservicios[0].idsubservicio);
          return `Servicio recomendado: ${servicio.nombre} - Subservicio: ${subservicios[0].nombre}
Tarifa base: $${precios.tarifa_base} | Precio por tiempo: $${precios.precio_por_tiempo}`;
        }
        return `Servicio recomendado: ${servicio.nombre}, pero no se encontraron subservicios.`;
      }
    }
    return "No se encontró un servicio adecuado. Por favor, describa el problema con más detalle.";
  }
});

const systemPrompt = `
Sos Solvy, un asistente que ayuda a los usuarios a encontrar el servicio y subservicio adecuado para resolver su problema en el hogar.
Pedile al usuario que describa el problema y recomendá el servicio y subservicio más adecuado.
Respondé de forma clara y breve.
`;

const ollamaLLM = new Ollama({
  model: "qwen3:1.7b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

const elAgente = agent({
  tools: [recomendarServicioTool],
  llm: ollamaLLM,
  verbose: false,
  systemPrompt,
});

export { elAgente };