import readline from "readline";
import { elAgente } from "../main.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("¡Hola! Soy Solvy. Contame tu problema y te recomiendo el servicio adecuado.");

rl.on("line", async (input) => {
  const result = await elAgente.chat({ message: input });
  console.log(result);
});