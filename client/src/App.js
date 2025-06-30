import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function limpiarPensamientos(respuesta) {
  return respuesta.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function App() {
  const [historial, setHistorial] = useState([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const chatEndRef = useRef(null);
  const [tool, setTool] = useState("auto");
  const [temperatura, setTemperatura] = useState(0.75);
  const [modelo, setModelo] = useState("qwen3:1.7b");


  useEffect(() => {
    const hist = localStorage.getItem("historialChat");
    if (hist) setHistorial(JSON.parse(hist));
  }, []);

  useEffect(() => {
    localStorage.setItem("historialChat", JSON.stringify(historial));
  }, [historial]);

  const enviarPregunta = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setHistorial((h) => [...h, { tipo: "user", texto: input }]);
    setCargando(true);

    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          tool, // <-- agrega esto
          modelo,
          temperatura,
        }),
      });
      const data = await res.json();
      setHistorial((h) => [
        ...h,
        {
          tipo: "bot",
          texto: limpiarPensamientos(data.result || data.error || "Error"),
        },
      ]);
    } catch {
      setHistorial((h) => [
        ...h,
        { tipo: "bot", texto: "Error de conexión con el backend" },
      ]);
    }
    setCargando(false);
    setInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>🎓 Chat de Estudiantes</h2>
      <div style={{
        border: "1px solid #ccc", borderRadius: 8, padding: 16, minHeight: 300, background: "#fafbfc", overflowY: "auto"
      }}>
        {historial.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.tipo === "user" ? "right" : "left", margin: "8px 0" }}>
            {msg.tipo === "bot" && (
              <span style={{ marginRight: 8, verticalAlign: "middle" }}>🤖</span>
            )}
            <span style={{
              display: "inline-block",
              background: msg.tipo === "user" ? "#d1e7dd" : "#e2e3e5",
              padding: "8px 12px",
              borderRadius: 16,
              maxWidth: "80%",
              wordBreak: "break-word",
              whiteSpace: "pre-line"
            }}>
              {msg.tipo === "bot"
                ? <ReactMarkdown>{msg.texto}</ReactMarkdown>
                : msg.texto}
            </span>
            {msg.tipo === "bot" && (
              <span style={{ marginLeft: 8, fontWeight: "bold" }}>Estudiantly</span>
            )}
          </div>
        ))}
        {cargando && <div style={{ color: "#888" }}>Pensando...</div>}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={enviarPregunta} style={{ marginTop: 16, display: "flex" }}>
        <select value={tool} onChange={e => setTool(e.target.value)}>
          <option value="auto">Automático</option>
          <option value="listarEstudiantes">Listar estudiantes</option>
          <option value="buscarPorNombre">Buscar por nombre</option>
          <option value="buscarPorApellido">Buscar por apellido</option>
          <option value="agregarEstudiante">Agregar estudiante</option>
        </select>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribí tu pregunta..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          disabled={cargando}
        />
        <select value={modelo} onChange={e => setModelo(e.target.value)}>
          <option value="qwen3:1.7b">qwen3:1.7b</option>
          <option value="ollama">otro-modelo</option>
        </select>
        <input type="range" min="0" max="1" step="0.01" value={temperatura} onChange={e => setTemperatura(Number(e.target.value))} />
        <button type="submit" disabled={cargando || !input.trim()} style={{
          marginLeft: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: "#0d6efd", color: "#fff"
        }}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default App;