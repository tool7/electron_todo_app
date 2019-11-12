const getMouseOffset = e => {
  const targetRect = e.target.getBoundingClientRect();
  const offset = {
    x: e.pageX - targetRect.left,
    y: e.pageY - targetRect.top
  };
  return offset
};

const getElementVerticalCenter = el => {
  const rect = el.getBoundingClientRect();
  return (rect.bottom - rect.top) / 2;
};

const getElementIdOrderMap = children => {
  let idOrderMap = {};
  for (let i = 0; i < children.length; i++) {
    idOrderMap[children[i].id] = i + 1;
  }
  return idOrderMap;
};

function sortable(rootEl, callback) {
  let dragEl = null;

  function _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!e.target || e.target === dragEl || e.target.nodeName !== "LI") {
      return;
    }

    const offset = getMouseOffset(e);
    const middleY = getElementVerticalCenter(e.target);

    // Instead of using insertBefore method, other way of visually reflecting
    // order of the items would be to recalculate 'order' property of all items
    // depending on this conditional statement and then sending that data on
    // 'dragend' event. After that, main window component would listen to
    // 'list:update' event so that it can update list order accordingly.
    if (offset.y > middleY) {
      rootEl.insertBefore(dragEl, e.target.nextSibling);
    } else {
      rootEl.insertBefore(dragEl, e.target);
    }
  }

  function _onDragEnd(e) {
    e.preventDefault();

    dragEl.classList.remove("todo-item--ghost");

    rootEl.removeEventListener("dragover", _onDragOver, false);
    rootEl.removeEventListener("dragend", _onDragEnd, false);

    const idOrderMap = getElementIdOrderMap(rootEl.children);
    callback(idOrderMap);
  }

  rootEl.addEventListener("dragstart", e => {
    e.dataTransfer.effectAllowed = "move";

    dragEl = e.target;
    dragEl.classList.add("todo-item--ghost");

    rootEl.addEventListener("dragover", _onDragOver, false);
    rootEl.addEventListener("dragend", _onDragEnd, false);
  }, false);
}
