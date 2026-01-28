const { app, BrowserWindow } = require("electron");
const path = require("path");
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

  // Wait for server to be ready
  const checkServer = () => {
    require("http")
      .get(url, (res) => {
        if (res.statusCode === 200) {
          mainWindow.loadURL(url);
        } else {
          setTimeout(checkServer, 500);
        }
      })
      .on("error", () => {
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

    // Use Electron as Node.js with ELECTRON_RUN_AS_NODE
    nextServer = spawn(process.execPath, [serverPath], {
      cwd: cwd,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: PORT.toString(),
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
