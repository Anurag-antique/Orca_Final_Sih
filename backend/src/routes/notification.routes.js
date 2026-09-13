const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, controller.list);
router.patch("/:id/read", authMiddleware, controller.markRead);
router.post("/read-all", authMiddleware, controller.markAllRead);
router.get("/stream", authMiddleware, controller.stream);

module.exports = router;
