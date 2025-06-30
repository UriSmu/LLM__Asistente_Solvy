import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { elAgente } from "./src/main.js"; // Asegúrate de exportar elAgente desde main.js

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

  try {
    const respuesta = await elAgente.run(prompt);
    res.json({ result: respuesta.data.result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando el mensaje" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});


export default app;