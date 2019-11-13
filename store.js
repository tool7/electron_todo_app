const fs = require("fs");
const uuidv4 = require("uuid/v4");

if (!fs.existsSync("data.json")) {
  fs.writeFileSync("data.json", "[]");
}

const rawData = fs.readFileSync("data.json");
let data = JSON.parse(rawData);

const saveDataToFileAsync = () => {
  fs.writeFile("data.json", JSON.stringify(data), err => {
    if (err) { throw err; }
  });
};

module.exports = {
  getData() {
    return data;
  },
  add(text) {
    const item = {
      id: uuidv4(),
      text,
      order: data.length + 1
    };
    data.push(item);

    saveDataToFileAsync();
    return item;
  },
  edit(itemId, text) {
    const item = data.find(i => i.id === itemId);
    item.text = text;

    saveDataToFileAsync();
  },
  remove(itemId) {
    const itemToRemove = data.find(i => i.id === itemId);
    data.forEach(item => {
      if (item.order > itemToRemove.order) {
        item.order--;
      }
    });
    
    data = data.filter(i => i.id !== itemId);

    saveDataToFileAsync();
  },
  reorder(itemIdOrderMap) {
    data.forEach(item => {
      item.order = itemIdOrderMap[item.id];
    });
    
    saveDataToFileAsync();
  }
};
