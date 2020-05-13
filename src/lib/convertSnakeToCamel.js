function convertSnakeToCamel(obj) {
  let newO = {};
  for (let key in obj) {
    let newKey = key.slice();
    // console.log("old key:", key);
    let index = newKey.indexOf("_");
    while (index > 0) {
      // console.log("index", index);
      newKey =
        newKey.substring(0, index) +
        newKey.substr(index + 1, 1).toUpperCase() +
        newKey.substring(index + 2);
      // console.log("newKey progress", newKey);

      index = newKey.indexOf("_");
    }
    newO[newKey] = obj[key];
    // console.log("newKey", newKey);
  }
  return newO;
}
function snakeArrToCamelArr(arr) {
  return arr.map((e) => convertSnakeToCamel(e));
}
module.exports = {
  convertSnakeToCamel,
  snakeArrToCamelArr,
  default: convertSnakeToCamel,
};
