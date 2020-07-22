const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const app = express();
const { graphqlHTTP } = require("express-graphql");
require("dotenv").config();

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolver");
const auth = require("./middleware/is-auth");
// Configuring where files get stored on multer
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    callback(null, new Date().toISOString() + "-" + file.originalname);
  },
});
// ddd
const fileFilter = (req, file, callback) => {
  if (
    (file.mimeType =
      "image/png" ||
      file.mimeType === "image/jpg" ||
      file.mimeType === "image/jpeg")
  ) {
    callback(null, true);
  }
};

// Parses incoming JSON data. Type: application/json
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Register multer
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
// Serving static images folder
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  // Set Access-Control-Allow-Origin to all the URLs permitted to access the server
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Allow origins to use certain methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  // Allow headers the client may set in it's req eg extra auth info
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // express-graphql declines all requests that isnt a GET or POST request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  if (!req.file) {
    return res.status(200).json({ message: "No file provided" });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  return res
    .status(200)
    .json({ message: "File stored", filePath: req.filePath });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) return err;

      const data = err.originalError.data;
      const message = err.message || "Error occured";
      const code = err.originalError.code || 500;

      return {
        message,
        status: code,
        data,
      };
    },
  })
);

// Error handling middleware
// Will execute anytime an error is forwarded with next()
app.use((error, req, res, next) => {
  // console.log(error, req, res, next);
  const status = error.statusCode || 500;
  const message = error.message;
  const errorData = error.data;

  res.status(status).json({ message, data: errorData });
});

const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const { MONGODB_USERNAME, MONGODB_PASSWORD, APPLICATION_PORT } = process.env;

mongoose
  .connect(
    `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0-wlgys.mongodb.net/messages?retryWrites=true&w=majority`,
    mongooseConfig
  )
  .then(() => {
    const port = APPLICATION_PORT || 8080;
    app.listen(port);
    console.log(`listening at ${port}`);
  })
  .catch((err) => {
    console.log(err);
  });

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);

  // Delete file by passing file path to it
  fs.unlink(filePath, (err) => console.log(err));
};