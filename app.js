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
    },
    autoHideMenuBar: true
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
        label: "Light",
        click: () => onColorThemeSelect("light-theme")
      }, {
        label: "Solarized",
        click: () => onColorThemeSelect("solarized-theme")
      }, {
        label: "Dark",
        click: () => onColorThemeSelect("dark-theme")
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
    mainWindow.webContents.send("list:init", store.getData());
  });

  ipcMain.on("item:add", (e, text) => {
    const newItem = store.add(text);
    mainWindow.webContents.send("list:add-item", newItem);
  });

  ipcMain.on("item:edit", (e, item) => {
    store.edit(item.id, item.text);
    mainWindow.webContents.send("list:edit-item", item);
  });

  ipcMain.on("item:remove", (e, id) => {
    store.remove(id);
    mainWindow.webContents.send("list:remove-item", id);
  });

  ipcMain.on("list:order-change", (e, idOrderMap) => {
    store.reorder(idOrderMap);
  });
};

const onColorThemeSelect = themeClass => {
  mainWindow.webContents.send("color-theme", themeClass);
};

app.on("ready", () => {
  createMainMenu();
  createMainWindow();
  setupIpcEventHandlers();
});
