import request from "supertest";
import app from "./server.js"; // Exporta tu app de Express en server.js

test("POST /api/chat responde", async () => {
  const res = await request(app)
    .post("/api/chat")
    .send({ prompt: "Hola" });
  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBeDefined();
});