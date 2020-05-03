// ========== Variables and function declarations ==========

const electron = require("electron");
const { remote, ipcRenderer } = electron;
const browserWindow = remote.getCurrentWindow();

const todoList = document.getElementById("todo-list");
const addButton = document.getElementById("add-btn");
const addInput = document.getElementById("add-input");
const hamburgerButton = document.getElementById("hamburger-btn");
const minimizeButton = document.getElementById("minimize-btn");
const closeButton = document.getElementById("close-btn");

let isEditMode = false;
let sortableList = null;

const initSortableList = () => {
  sortableList = new Sortable(todoList, elementIdOrderMap => {
    ipcRenderer.send("list:order-change", elementIdOrderMap);
  }, "todo-item--ghost");
};

const onAddButtonClick = () => {
  if (!addInput.value) { return; }
  
  ipcRenderer.send("item:add", addInput.value);

  addInput.value = "";
  addButton.setAttribute("disabled", true);
};

const createAndAddItemToList = item => {
  const todoItemTemplate = document.getElementById("todo-item-template");
  const todoItemFragment = document.importNode(todoItemTemplate.content, true);
  const todoItemElement = todoItemFragment.querySelector(".todo-item");
  const textElement = todoItemFragment.querySelector(".todo-item__text");
  const controlsDivElement = todoItemFragment.querySelector(".todo-item__controls");
  const editDivElement = todoItemFragment.querySelector(".todo-item__edit-container");
  const editInputElement = todoItemFragment.querySelector(".todo-item__edit-input");
  const editMessageElement = todoItemFragment.querySelector(".todo-item__edit-message");
  const editButtonElement = todoItemFragment.querySelector(".todo-item__edit-btn");
  const removeButtonElement = todoItemFragment.querySelector(".todo-item__remove-btn");

  todoItemElement.id = item.id;
  textElement.innerHTML = item.text;
  editInputElement.value = item.text;

  editButtonElement.addEventListener("click", e => {
    if (isEditMode) { return; }
    
    textElement.classList.add("display-none");
    controlsDivElement.classList.add("display-none");
    editDivElement.classList.remove("display-none");
    editInputElement.focus();
  
    isEditMode = true;
    sortableList.disable();
  });

  removeButtonElement.addEventListener("click", e => {
    ipcRenderer.send("item:remove", todoItemElement.id);
  });

  editInputElement.addEventListener("keydown", e => {
    if (e.keyCode === 13 || e.keyCode === 27) {
      textElement.classList.remove("display-none");
      controlsDivElement.classList.remove("display-none");
      editDivElement.classList.add("display-none");

      isEditMode = false;
      sortableList.enable();
    }

    if (e.keyCode === 13 && editInputElement.value !== "") {
      ipcRenderer.send("item:edit", {
        id: todoItemElement.id,
        text: editInputElement.value
      });
    }
  });

  controlsDivElement.appendChild(editButtonElement);
  controlsDivElement.appendChild(removeButtonElement);
  todoItemElement.appendChild(textElement);
  todoItemElement.appendChild(controlsDivElement);
  editDivElement.appendChild(editInputElement);
  editDivElement.appendChild(editMessageElement);
  todoItemElement.appendChild(editDivElement);
  todoList.prepend(todoItemElement);

  return todoItemElement;
};

const setColorTheme = (value, persist = true) => {
  document.body.classList.add(value);
  persist && localStorage.setItem("color-theme", value);
};

const setFontFamily = (value, persist = true) => {
  document.body.style.fontFamily = value;
  persist && localStorage.setItem("font-family", value);
};


// ========== Window initialization ==========

const storedColorTheme = localStorage.getItem("color-theme");
if (storedColorTheme) {
  setColorTheme(storedColorTheme, false);
}

const storedFontFamily = localStorage.getItem("font-family");
if (storedFontFamily) {
  setFontFamily(storedFontFamily, false);
}

addInput.addEventListener("keydown", e => {
  if (!addInput.value || e.keyCode === 8) { return; }

  const textLength = addInput.value.length;
  if (textLength + 1 > 80) {
    e.preventDefault();
  }
});

addInput.addEventListener("keyup", () => {
  if (addInput.value) {
    addButton.removeAttribute("disabled");
  } else {
    addButton.setAttribute("disabled", true);
  }
});

addInput.addEventListener("keydown", e => {
  if (e.keyCode !== 13) { return; }
  onAddButtonClick();
});

addButton.addEventListener("click", onAddButtonClick);

ipcRenderer.on("list:init", (e, items) => {
  items.sort((a, b) => a.order - b.order);
  items.forEach(item => {
    createAndAddItemToList(item);
  });

  initSortableList();
});

ipcRenderer.on("list:add-item", (e, item) => {
  const element = createAndAddItemToList(item);
  sortableList.onElementAdded(element);
});

ipcRenderer.on("list:edit-item", (e, item) => {
  const todoItem = Array.from(todoList.children).find(el => el.id === item.id);
  const textElement = todoItem.querySelector(".todo-item__text");
  textElement.innerHTML = item.text;
});

ipcRenderer.on("list:remove-item", (e, itemId) => {
  const todoItem = Array.from(todoList.children).find(el => el.id === itemId);
  todoList.removeChild(todoItem);
});

ipcRenderer.on("color-theme", (e, themeClass) => {
  const { classList } = document.body;
  while (classList.length > 0) {
    classList.remove(classList.item(0));
  }

  setColorTheme(themeClass);
});

ipcRenderer.on("font-family", (e, fontFamily) => {
  setFontFamily(fontFamily);
});

// ========== Menu-bar initialization ==========
hamburgerButton.addEventListener("click", e => {
  const { x, y } = e;
  ipcRenderer.send("menu:show", { x, y });
});

minimizeButton.addEventListener("click", e => {
  browserWindow.minimize();
});

closeButton.addEventListener("click", e => {
  browserWindow.close();
});
