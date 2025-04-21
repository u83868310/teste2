import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";
import MemoryStore from "memorystore";

// Obtém a porta do ambiente do Glitch ou usa 3000 como padrão
const PORT = process.env.PORT || 3000;

// Inicializa o app Express
const app = express();

// Configurações do Express
app.use(cors());
app.use(express.json());

// Configuração de sessão com MemoryStore
const MemoryStoreSession = MemoryStore(session);
app.use(
  session({
    secret: "iptv-streaming-platform-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 horas
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // limpa sessões expiradas a cada 24 horas
    }),
  })
);

// Handler de erro global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error handler:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json({ error: message });
});

// Inicializa as rotas e inicia o servidor
async function main() {
  try {
    // Registra as rotas da API e obtém o servidor HTTP
    const server = await registerRoutes(app);

    // No ambiente de desenvolvimento, configura o Vite
    if (process.env.NODE_ENV === "development") {
      log(`setting up Vite in development mode...`);
      await setupVite(app, server);
    } else {
      // Em produção, serve os arquivos estáticos compilados
      log(`serving static files in production mode...`);
      serveStatic(app);
    }

    // Inicia o servidor HTTP na porta especificada
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Inicia o aplicativo
main();
