import express from "express";
import { pool } from "./db.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { communitiesRouter } from "./routes/communities.routes.js";
import { volunteersRouter } from "./routes/volunteers.routes.js";
import { studentsRouter } from "./routes/students.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import ticketsRouter from "./routes/tickets.routes.js";
import donationsRouter from "./routes/donations.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { authRouter, usersRouter as authUsersRouter } from "./routes/auth.routes.js";
import { adminUsersRouter } from "./routes/admin-users.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { contactMessagesRouter } from "./routes/contactMessages.routes.js";
import { contactChannelsRouter } from "./routes/contactChannels.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

// Rutas de contenido y modulos publicos
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/communities", communitiesRouter);
app.use("/api/v1/students", studentsRouter);
app.use("/api/v1/volunteers", volunteersRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/donations", donationsRouter);
app.use("/api/v1/contact-messages", contactMessagesRouter);
app.use("/api/v1/contact-channels", contactChannelsRouter);

// Rutas de registro publico de usuarios
app.use("/api/v1/users", usersRouter);

// Rutas de seguridad, administracion y auditoria
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/me", authUsersRouter);
app.use("/api/v1/admin", adminUsersRouter);
app.use("/api/v1/audit", auditRouter);

app.get("/", (_req, res) => {
	res.status(200).json({
		name: "Far Corners API",
		version: "1.0.0",
		status: "online",
		endpoints: {
			health: "/api/health",
			database_health: "/api/health/db",
			auth: "/api/v1/auth",
			admin_users: "/api/v1/admin/users",
			audit: "/api/v1/audit/logs",
			projects: "/api/v1/projects",
			tickets: "/api/v1/tickets",
			donations: "/api/v1/donations",
			users: "/api/v1/users",
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
