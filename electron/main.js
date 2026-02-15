const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;
let nextServer;

const isDev = !app.isPackaged;
const PORT = 3000;

function getResourcePath(...paths) {
  if (isDev) {
    return path.join(__dirname, "..", ...paths);
  }
  return path.join(process.resourcesPath, ...paths);
}

// Load .env file and return parsed environment variables
function loadEnvFile() {
  const envPath = getResourcePath(".next", "standalone", ".env");
  const envVars = {};
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      envVars[key] = value;
    }
    console.log("Loaded .env from:", envPath);
  } catch (err) {
    console.warn("Could not load .env file:", err.message);
  }
  return envVars;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: getResourcePath("public", "logoJC.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    title: "JC Contabilidade",
  });

  const url = `http://localhost:${PORT}`;

  // Show a loading page while waiting for the server
  mainWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
        <div style="text-align:center">
          <h2>JC Contabilidade</h2>
          <p>Carregando...</p>
        </div>
      </body>
    </html>
  `);

  // Wait for server to be ready (accept any HTTP response, not just 200)
  let attempts = 0;
  const maxAttempts = 60; // 30 seconds max

  const checkServer = () => {
    attempts++;
    require("http")
      .get(url, (res) => {
        // Any HTTP response means server is running
        res.resume(); // Consume response to free memory
        mainWindow.loadURL(url);
      })
      .on("error", () => {
        if (attempts >= maxAttempts) {
          mainWindow.loadURL(`data:text/html;charset=utf-8,
            <html>
              <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
                <div style="text-align:center">
                  <h2>Erro ao iniciar</h2>
                  <p>Nao foi possivel iniciar o servidor. Tente reiniciar o aplicativo.</p>
                </div>
              </body>
            </html>
          `);
          return;
        }
        setTimeout(checkServer, 500);
      });
  };

  checkServer();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startNextServer() {
  return new Promise((resolve) => {
    if (isDev) {
      resolve();
      return;
    }

    const serverPath = getResourcePath(".next", "standalone", "server.js");
    const cwd = getResourcePath(".next", "standalone");

    console.log("Starting Next.js server from:", serverPath);
    console.log("Working directory:", cwd);

    const envVars = loadEnvFile();

    // Use Electron as Node.js with ELECTRON_RUN_AS_NODE
    nextServer = spawn(process.execPath, [serverPath], {
      cwd: cwd,
      env: {
        ...process.env,
        ...envVars,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: PORT.toString(),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
    });

    nextServer.stdout.on("data", (data) => {
      console.log(`Next.js: ${data}`);
    });

    nextServer.stderr.on("data", (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    nextServer.on("error", (err) => {
      console.error("Failed to start Next.js server:", err);
    });

    // Give server time to start
    setTimeout(resolve, 3000);
  });
}

app.whenReady().then(async () => {
  await startNextServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }
});
