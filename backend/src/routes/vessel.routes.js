const express = require("express");
const router = express.Router();
const vesselController = require("../controllers/vessel.controller");

router.get("/", vesselController.listVessels);
router.get("/status", vesselController.getStatus);

module.exports = router;
