const express = require("express");
const router = express.Router();
const maritimeController = require("../controllers/maritime.controller");

router.post("/route", maritimeController.computeRoute);
router.get("/status", maritimeController.getStatus);

module.exports = router;
