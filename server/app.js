const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const app = express();
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const https = require("https");
const { graphqlHTTP } = require("express-graphql");
require("dotenv").config();

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolver");
const auth = require("./middleware/is-auth");
const { clearImage } = require("./utils/file");

// Read private key
// fs.readfileSync will block execution of code till the file is read
const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");

// Configuring where files get stored on multer
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    callback(null, new Date().toISOString() + "-" + file.originalname);
  },
});
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

// helmet adds headers to our response for security purposes
app.use(helmet());

// compression aids in compressing assets
app.use(compression());

// for request logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

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
    .json({ message: "File stored", filePath: req.file.path });
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

const {
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_DEFAULT_DATABASE,
  APPLICATION_PORT,
} = process.env;

mongoose
  .connect(
    `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0-wlgys.mongodb.net/${MONGODB_DEFAULT_DATABASE}?retryWrites=true&w=majority`,
    mongooseConfig
  )
  .then(() => {
    const port = APPLICATION_PORT || 8080;
    app.listen(port);
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(port);
    console.log(`listening at ${port}`);
  })
  .catch((err) => {
    console.log(err);
  });
