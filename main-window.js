const electron = require("electron");
const { ipcRenderer } = electron;

const todoList = document.getElementById("todo-list");
const addButton = document.getElementById("add-btn");
const addInput = document.getElementById("add-input");

addButton.addEventListener("click", e => {
  if (!addInput.value) { return; }
  
  ipcRenderer.send("item:add", addInput.value);
  addInput.value = "";
});

const onEditButtonClick = e => {

};

const onRemoveButtonClick = e => {
  const clickedListItem = e.target.parentElement.parentElement;
  ipcRenderer.send("item:remove", clickedListItem.id);
};

const clearList = () => {
  todoList.innerHTML = null;
};

const addItemToList = item => {
  const todoItemElement = document.createElement("li");
  const editButtonTemplate = document.getElementById("edit-btn-template");
  const removeButtonTemplate = document.getElementById("remove-btn-template");
  const editButtonFragment = document.importNode(editButtonTemplate.content, true);
  const removeButtonFragment = document.importNode(removeButtonTemplate.content, true);
  const editButtonElement = editButtonFragment.querySelector("button");
  const removeButtonElement = removeButtonFragment.querySelector("button");
  const textElement = document.createElement("span");
  const buttonsElement = document.createElement("div");

  todoItemElement.id = item.id;
  todoItemElement.classList.add("todo-item");

  textElement.classList.add("todo-item__text");
  textElement.innerHTML = item.text;

  buttonsElement.classList.add("todo-item__btns", "hidden");
  editButtonElement.addEventListener("click", onEditButtonClick);
  removeButtonElement.addEventListener("click", onRemoveButtonClick);

  buttonsElement.appendChild(editButtonElement);
  buttonsElement.appendChild(removeButtonElement);
  todoItemElement.appendChild(textElement);
  todoItemElement.appendChild(buttonsElement);
  todoList.appendChild(todoItemElement);
};

ipcRenderer.on("list:update", (e, items) => {
  clearList();

  items.forEach(item => {
    addItemToList(item);
  });
});
