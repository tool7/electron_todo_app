const electron = require("electron");
const url = require("url");
const path = require("path");
const store = require("./store.js");
const { app, BrowserWindow, Menu, ipcMain } = electron;

let menu = null;
let appWindow = null;

const isMac = process.platform === "darwin";

const createAppWindow = () => {
  appWindow = new BrowserWindow({
    icon: "./favicon.ico",
    width: 800,
    height: 600,
    minWidth: 250,
    minHeight: 250,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    frame: false
  });

  appWindow.loadURL(url.format({
    pathname: path.join(__dirname, "app-window.html"),
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
  appWindow.webContents.once("dom-ready", () => {
    appWindow.webContents.send("list:init", store.getData());
  });

  ipcMain.on("item:add", (e, text) => {
    const newItem = store.add(text);
    appWindow.webContents.send("list:add-item", newItem);
  });

  ipcMain.on("item:edit", (e, item) => {
    store.edit(item.id, item.text);
    appWindow.webContents.send("list:edit-item", item);
  });

  ipcMain.on("item:remove", (e, id) => {
    store.remove(id);
    appWindow.webContents.send("list:remove-item", id);
  });

  ipcMain.on("list:order-change", (e, idOrderMap) => {
    store.reorder(idOrderMap);
  });

  ipcMain.on("menu:show", (e, coords) => {
    if (isMac) { return; }

    menu.popup({
      window: appWindow,
      x: coords.x,
      y: coords.y
    });
  });
};

const onColorThemeSelect = themeClass => {
  appWindow.webContents.send("color-theme", themeClass);
};

const onFontFamilySelect = fontFamily => {
  appWindow.webContents.send("font-family", fontFamily);
};

const onFontSizeSelect = fontSize => {
  appWindow.webContents.send("font-size", fontSize);
};

app.on("ready", () => {
  createMenu();
  createAppWindow();
  setupIpcEventHandlers();
});
