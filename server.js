import express from "express";
import cors from "cors";
import { elAgente, agentePromise } from "./src/main.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    console.log("Recibido prompt:", prompt);
    
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt vacío" });
    }
    
    // Usar el agente directamente
    const result = await elAgente.chat(prompt);
    console.log("Resultado:", result);
    
    res.json({ result });
  } catch (e) {
    console.error("Error en el chat:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor Solvy escuchando en http://localhost:3000");
  console.log("Agente está disponible");
});

export default app;