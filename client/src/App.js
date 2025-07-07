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

  useEffect(() => {
    const hist = localStorage.getItem("historialSolvy");
    if (hist) setHistorial(JSON.parse(hist));
  }, []);

  useEffect(() => {
    localStorage.setItem("historialSolvy", JSON.stringify(historial));
  }, [historial]);

  const enviarPregunta = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setHistorial((h) => [...h, { tipo: "user", texto: input }]);
    setCargando(true);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
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
      <h2>🛠️ Solvy - Asistente de Servicios</h2>
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
              <span style={{ marginLeft: 8, fontWeight: "bold" }}>Solvy</span>
            )}
          </div>
        ))}
        {cargando && <div style={{ color: "#888" }}>Pensando...</div>}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={enviarPregunta} style={{ marginTop: 16, display: "flex" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describí tu problema en el hogar..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          disabled={cargando}
        />
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