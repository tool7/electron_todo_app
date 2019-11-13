const getMouseOffset = e => {
  const targetRect = e.target.getBoundingClientRect();
  const offset = {
    x: e.pageX - targetRect.left,
    y: e.pageY - targetRect.top
  };
  return offset;
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

function Sortable(rootEl, callback, ghostClass) {
  let dragEl = null;

  const toggleDraggableAttribute = (el, flag) => {
    flag ? el.setAttribute("draggable", true) : el.removeAttribute("draggable");
  };

  const toggleDraggableAttributeOnChildren = flag => {
    Array.from(rootEl.children).forEach(el => {
      toggleDraggableAttribute(el, flag);
    });
  };

  const toggleGhostClassOnOtherItems = (itemToExclude, flag) => {
    Array.from(rootEl.children).forEach(el => {
      if (el === itemToExclude) { return; }

      if (flag) {
        el.classList.add(ghostClass);
      } else {
        el.classList.remove(ghostClass);
      }
    });
  };

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

    ghostClass && toggleGhostClassOnOtherItems(dragEl, false);

    rootEl.removeEventListener("dragover", _onDragOver, false);
    rootEl.removeEventListener("dragend", _onDragEnd, false);

    const idOrderMap = getElementIdOrderMap(rootEl.children);
    callback(idOrderMap);
  }

  function _onDragStart(e) {
    e.dataTransfer.effectAllowed = "move";

    dragEl = e.target;
    ghostClass && toggleGhostClassOnOtherItems(dragEl, true);

    rootEl.addEventListener("dragover", _onDragOver, false);
    rootEl.addEventListener("dragend", _onDragEnd, false);
  }

  rootEl.addEventListener("dragstart", _onDragStart, false);
  toggleDraggableAttributeOnChildren(true);

  return {
    disable: () => {
      rootEl.removeEventListener("dragstart", _onDragStart, false);
      toggleDraggableAttributeOnChildren(false);
    },
    enable: () => {
      rootEl.addEventListener("dragstart", _onDragStart, false);
      toggleDraggableAttributeOnChildren(true);
    },
    onElementAdded: el => {
      toggleDraggableAttribute(el, true)
    }
  };
}
