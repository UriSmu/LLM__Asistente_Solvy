import readline from "readline";
import { agentePromise } from "../main.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("¡Hola! Soy Solvy. Contame tu problema y te recomiendo el servicio adecuado.");

rl.on("line", async (input) => {
  try {
    const agente = await agentePromise;
    
    if (!agente || typeof agente.chat !== 'function') {
      console.error('El agente no está disponible');
      return;
    }
    
    const result = await agente.chat(input);
    console.log(result);
  } catch (error) {
    console.error('Error en el chat:', error);
  }
});