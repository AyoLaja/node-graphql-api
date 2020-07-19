const express = require("express");
const router = express.Router();
// const cors = require("cors");
const { check } = require("express-validator");

const feedController = require("../controllers/feedController");
const isAuth = require("../middleware/is-auth");

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    check("title").trim().isLength({
      min: 5,
    }),
    check("content").trim().isLength({
      min: 5,
    }),
  ],
  feedController.createPost
);

// GET /post/:postId
router.get("/post/:postId", isAuth, feedController.getPost);

// PUT /post/:postId - TO update posts
router.put(
  "/post/:postId",
  isAuth,
  [
    check("title").trim().isLength({
      min: 5,
    }),
    check("content").trim().isLength({
      min: 5,
    }),
  ],
  // cors(),
  feedController.updatePost
);

// DELETE /post/:postId
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
