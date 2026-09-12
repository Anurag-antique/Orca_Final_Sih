const express = require("express");
const router = express.Router();
const geocodeController = require("../controllers/geocode.controller");

router.get("/search", geocodeController.search);
router.get("/reverse", geocodeController.reverse);

module.exports = router;
