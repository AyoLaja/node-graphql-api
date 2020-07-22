const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;

  try {
    // jwt.verify will decode and verify the token
    // jwt.decode will only decode the token
    decodedToken = jwt.verify(token, "somesupersecretsecret");
    console.log(decodedToken);
  } catch (err) {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
