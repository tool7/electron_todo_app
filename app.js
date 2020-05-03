const electron = require("electron");
const url = require("url");
const path = require("path");
const store = require("./store.js");
const { app, BrowserWindow, Menu, ipcMain } = electron;

let menu = null;
let mainWindow = null;

const isMac = process.platform === "darwin";

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    icon: "./favicon.ico",
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    frame: false
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, "main-window.html"),
    protocol: "file:",
    slashes: true
  }));
};

const createMenu = () => {
  const menuTemplate = [{
    label: "Options",
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
      label: "Font family",
      submenu: [{
        label: "Calibri",
        click: () => onFontFamilySelect("Calibri")
      }, {
        label: "Verdana",
        click: () => onFontFamilySelect("Verdana")
      }, {
        label: "Georgia",
        click: () => onFontFamilySelect("Georgia")
      }, {
        label: "Segoe UI",
        click: () => onFontFamilySelect("Segoe UI")
      }, {
        label: "Impact",
        click: () => onFontFamilySelect("Impact")
      }, {
        label: "Cursive",
        click: () => onFontFamilySelect("cursive")
      }]
    }, {
      label: "Font size",
      submenu: [{
        label: "Extra small",
        click: () => onFontSizeSelect("1.5rem")
      }, {
        label: "Small",
        click: () => onFontSizeSelect("1.8rem")
      }, {
        label: "Medium",
        click: () => onFontSizeSelect("2rem")
      }, {
        label: "Large",
        click: () => onFontSizeSelect("2.5rem")
      }, {
        label: "Extra large",
        click: () => onFontSizeSelect("3rem")
      }]
    }, {
      label: "Quit",
      accelerator: isMac ? "Command+W" : "Ctrl+W",
      click() {
        app.quit();
      }
    }]
  }];
  
  if (process.env.NODE_ENV !== "production") {
    menuTemplate[0].submenu.unshift({
      label: "Developer Tools",
      accelerator: isMac ? "Command+I" : "F12",
      click(_, focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    });
  }

  menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
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

  ipcMain.on("menu:show", (e, coords) => {
    if (isMac) { return; }

    menu.popup({
      window: mainWindow,
      x: coords.x,
      y: coords.y
    });
  });
};

const onColorThemeSelect = themeClass => {
  mainWindow.webContents.send("color-theme", themeClass);
};

const onFontFamilySelect = fontFamily => {
  mainWindow.webContents.send("font-family", fontFamily);
};

const onFontSizeSelect = fontSize => {
  mainWindow.webContents.send("font-size", fontSize);
};

app.on("ready", () => {
  createMenu();
  createMainWindow();
  setupIpcEventHandlers();
});
