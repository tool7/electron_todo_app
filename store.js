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
  add(itemName) {
    const item = { id: uuidv4(), text: itemName };
    data.push(item);

    saveDataToFileAsync();
  },
  edit(itemId, text) {
    const item = data.find(i => i.id === itemId);
    item.text = text;

    saveDataToFileAsync();
  },
  remove(itemId) {
    data = data.filter(i => i.id !== itemId);

    saveDataToFileAsync();
  }
};
