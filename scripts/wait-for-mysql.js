/**
 * Espera a que MySQL en Docker acepte conexiones.
 * Uso: npm run db:wait
 */
const net = require("net");

const host = process.env.DATABASE_HOST || "localhost";
const port = Number(process.env.DATABASE_PORT || 3306);
const maxAttempts = 30;
const delayMs = 2000;

function tryConnect() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", reject);
    socket.setTimeout(3000, () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function wait() {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await tryConnect();
      console.log(`✅ MySQL disponible en ${host}:${port}`);
      return;
    } catch {
      console.log(`⏳ Esperando MySQL... (${i}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error("❌ MySQL no respondió a tiempo. ¿Está Docker corriendo?");
  process.exit(1);
}

wait();
