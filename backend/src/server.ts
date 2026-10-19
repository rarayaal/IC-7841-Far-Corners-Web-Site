import express from "express";
import { pool } from "./db.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { usersRouter } from './routes/users.routes.js';
import donationsRouter from "./routes/donations.routes.js";
import cookieParser from 'cookie-parser';
import ticketsRouter from "./routes/tickets.routes.js";
import { contactMessagesRouter } from './routes/contactMessages.routes.js';
import {
  contactChannelsRouter,
} from './routes/contactChannels.routes.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/auth", usersRouter);
app.use("/api/v1/donations", donationsRouter);
app.use("/api/v1", ticketsRouter);
app.use('/api/v1/contact-messages', contactMessagesRouter);
app.use('/api/v1/contact-channels', contactChannelsRouter);

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Far Corners API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/api/health",
      database_health: "/api/health/db",
      projects: "/api/v1/projects",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de Far Corners funcionando",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      message: "Conexión con PostgreSQL funcionando",
    });
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error);

    res.status(503).json({
      status: "error",
      message: "No se pudo conectar con la base de datos",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API disponible en http://localhost:${port}`);
});