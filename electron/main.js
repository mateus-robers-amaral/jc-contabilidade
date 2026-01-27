const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let nextServer;

const isDev = process.env.NODE_ENV === "development";
const PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, "../public/logoJC.png"),
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

    const serverPath = path.join(__dirname, "../.next/standalone/server.js");

    nextServer = spawn("node", [serverPath], {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
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

    // Give server time to start
    setTimeout(resolve, 2000);
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
