import express from "express";
import { pool } from "./db.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { communitiesRouter } from "./routes/communities.routes.js";
import { volunteersRouter } from "./routes/volunteers.routes.js";
import { studentsRouter } from "./routes/students.routes.js";
import { campsRouter } from "./routes/camps.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { institutionalRouter } from "./routes/institutional.routes.js";
import { mediaRouter } from "./routes/media.routes.js";
import { retirementRouter } from "./routes/retirement.routes.js";
import ticketsRouter from "./routes/tickets.routes.js";
import donationsRouter from "./routes/donations.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { authRouter, profileRouter } from "./routes/auth.routes.js";
import { adminUsersRouter } from "./routes/admin-users.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { contactMessagesRouter } from "./routes/contactMessages.routes.js";
import { contactChannelsRouter } from "./routes/contactChannels.routes.js";
import { newsletterRouter } from './routes/newsletter.routes.js';
import { formsRouter } from "./routes/forms.routes.js";
import { eventsRouter } from "./routes/events.routes.js";
import { eliminarBorradoresAntiguos } from "./repositories/forms.repository.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rutas de contenido y modulos publicos
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/communities", communitiesRouter);
app.use("/api/v1/students", studentsRouter);
app.use("/api/v1/camps", campsRouter);
app.use("/api/v1/volunteers", volunteersRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/institutional", institutionalRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/content-retirement", retirementRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/purchases", ticketsRouter);
app.use("/api/v1/donations", donationsRouter);
app.use("/api/v1/contact-messages", contactMessagesRouter);
app.use("/api/v1/contact-channels", contactChannelsRouter);

// Rutas de registro publico de usuarios
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/forms", formsRouter);

// Rutas de seguridad, administracion y auditoria
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/me", profileRouter);
app.use("/api/v1/admin", adminUsersRouter);
app.use("/api/v1/audit", auditRouter);

// Ruta Mailchimp
app.use('/api/v1/newsletter', newsletterRouter);

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
			institutional: "/api/v1/institutional/:section",
			media: "/api/v1/media",
			content_retirement: "/api/v1/content-retirement/:type",
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

// Los borradores de formulario se descartan a los 30 días sin editarse.
const DIAS_BORRADOR = 30;
const INTERVALO_LIMPIEZA_MS = 24 * 60 * 60 * 1000;

async function ejecutarLimpiezaBorradores() {
  try {
    const eliminados = await eliminarBorradoresAntiguos(DIAS_BORRADOR);
    if (eliminados > 0) {
      console.log(`Borradores de formulario eliminados: ${eliminados}`);
    }
  } catch (error) {
    console.error("No se pudieron limpiar los borradores de formulario:", error);
  }
}

app.listen(port, "0.0.0.0", () => {
  console.log(`API disponible en http://localhost:${port}`);
  void ejecutarLimpiezaBorradores();
  setInterval(() => void ejecutarLimpiezaBorradores(), INTERVALO_LIMPIEZA_MS);
});
