const { Router } = require("express");
const { getGigs } = require("../controllers/gigs");

const router = Router();

router.route("/").get(getGigs);

export default router;
