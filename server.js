import express from "express";
import cors from "cors";
import { elAgente } from "./src/main.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await elAgente.chat({ message: prompt });
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor Solvy escuchando en http://localhost:3000");
});