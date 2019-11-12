// ========== Variables and function declarations ==========

const electron = require("electron");
const { ipcRenderer } = electron;

const todoList = document.getElementById("todo-list");
const addButton = document.getElementById("add-btn");
const addInput = document.getElementById("add-input");

let isEditMode = false;

const onAddButtonClick = () => {
  if (!addInput.value) { return; }
  
  ipcRenderer.send("item:add", addInput.value);

  addInput.value = "";
  addButton.setAttribute("disabled", true);
};

const onEditButtonClick = e => {
  const clickedListItem = e.target.parentElement.parentElement;
  if (isEditMode) { return; }

  const textElement = clickedListItem.querySelector(".todo-item__text");
  const controlsDivElement = clickedListItem.querySelector(".todo-item__controls");
  const editDivElement = clickedListItem.querySelector(".todo-item__edit-container");
  const editInputElement = clickedListItem.querySelector(".edit-input");

  textElement.classList.add("display-none");
  controlsDivElement.classList.add("display-none");
  editDivElement.classList.remove("display-none");
  editInputElement.focus();

  isEditMode = true;

  editInputElement.addEventListener("keydown", e => {
    if (e.keyCode === 13 || e.keyCode === 27) {
      textElement.classList.remove("display-none");
      controlsDivElement.classList.remove("display-none");
      editDivElement.classList.add("display-none");
      
      isEditMode = false;
    }

    if (e.keyCode === 13 && editInputElement.value !== "") {
      ipcRenderer.send("item:edit", {
        id: clickedListItem.id,
        text: editInputElement.value
      });
    }
  });
};

const onRemoveButtonClick = e => {
  const clickedListItem = e.target.parentElement.parentElement;
  ipcRenderer.send("item:remove", clickedListItem.id);
};

const clearList = () => {
  todoList.innerHTML = null;
};

const createAndAddItemToList = item => {
  const todoItemElement = document.createElement("li");
  const editButtonTemplate = document.getElementById("edit-btn-template");
  const removeButtonTemplate = document.getElementById("remove-btn-template");
  const editButtonFragment = document.importNode(editButtonTemplate.content, true);
  const removeButtonFragment = document.importNode(removeButtonTemplate.content, true);
  const editButtonElement = editButtonFragment.querySelector("button");
  const removeButtonElement = removeButtonFragment.querySelector("button");
  const textElement = document.createElement("span");
  const controlsDivElement = document.createElement("div");
  const editDivElement = document.createElement("div");
  const editInputElement = document.createElement("input");
  const editMessageElement = document.createElement("span");

  todoItemElement.id = item.id;
  todoItemElement.classList.add("todo-item");
  todoItemElement.setAttribute("draggable", "true");

  textElement.classList.add("todo-item__text");
  textElement.innerHTML = item.text;

  controlsDivElement.classList.add("todo-item__controls");
  editButtonElement.addEventListener("click", onEditButtonClick);
  removeButtonElement.addEventListener("click", onRemoveButtonClick);

  editDivElement.classList.add("todo-item__edit-container", "display-none");
  editInputElement.type = "text";
  editInputElement.value = item.text;
  editInputElement.classList.add("edit-input");
  editMessageElement.innerHTML = "Press Enter to confirm or Esc. to cancel edit mode";
  editMessageElement.classList.add("edit-message");

  controlsDivElement.appendChild(editButtonElement);
  controlsDivElement.appendChild(removeButtonElement);
  todoItemElement.appendChild(textElement);
  todoItemElement.appendChild(controlsDivElement);
  editDivElement.appendChild(editInputElement);
  editDivElement.appendChild(editMessageElement);
  todoItemElement.appendChild(editDivElement);
  todoList.appendChild(todoItemElement);
};

const setColorTheme = (value, persist = true) => {
  document.body.classList.add(value);
  persist && localStorage.setItem("color-theme", value);
};


// ========== Window initialization ==========

const storedColorTheme = localStorage.getItem("color-theme");
if (storedColorTheme) {
  setColorTheme(storedColorTheme, false);
}

sortable(todoList, elementIdOrderMap => {
  ipcRenderer.send("list:order-change", elementIdOrderMap);
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

ipcRenderer.on("list:update", (e, items) => {
  clearList();

  items.sort((a, b) => a.order - b.order);
  items.forEach(item => {
    createAndAddItemToList(item);
  });
});

ipcRenderer.on("color-theme", (e, themeClass) => {
  const { classList } = document.body;
  while (classList.length > 0) {
    classList.remove(classList.item(0));
  }

  setColorTheme(themeClass);
});
