const path = require("path");
const fs = require("fs");

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);

  // Delete file by passing file path to it
  fs.unlink(filePath, (err) => console.log(err));
};

exports.clearImage = clearImage;
