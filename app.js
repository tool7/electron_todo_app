const electron = require("electron");
const url = require("url");
const path = require("path");
const store = require("./store.js");
const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, "main-window.html"),
    protocol: "file:",
    slashes: true
  }));
};

const createMainMenu = () => {
  const mainMenuTemplate = [{
    label: "File",
    submenu: [{
      label: "Themes",
      submenu: [{
        label: "White",
        click: () => onColorThemeSelect("white")
      }, {
        label: "Solarized",
        click: () => onColorThemeSelect("solarized")
      }, {
        label: "Black",
        click: () => onColorThemeSelect("black")
      }]
    }, {
      label: "Quit",
      accelerator: process.platform === "darwin" ? "Command+W" : "Ctrl+W",
      click() {
        app.quit();
      }
    }]
  }];
  
  if (process.env.NODE_ENV !== "production") {
    mainMenuTemplate[0].submenu.unshift({
      label: "Developer Tools",
      accelerator: process.platform === "darwin" ? "Command+I" : "F12",
      click(_, focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    });
  }

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
};

const setupIpcEventHandlers = () => {
  mainWindow.webContents.once("dom-ready", () => {
    mainWindow.webContents.send("list:update", store.getData());
  });

  ipcMain.on("item:add", (e, item) => {
    store.add(item);
    mainWindow.webContents.send("list:update", store.getData());
  });

  ipcMain.on("item:remove", (e, id) => {
    store.remove(id);
    mainWindow.webContents.send("list:update", store.getData());
  });
};

const onColorThemeSelect = theme => {

  console.log(theme);
};

app.on("ready", () => {
  createMainWindow();
  createMainMenu();
  setupIpcEventHandlers();
});
