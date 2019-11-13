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

  editButtonElement.addEventListener("click", onEditButtonClick);
  removeButtonElement.addEventListener("click", onRemoveButtonClick);

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
