import { Router } from "express";
import { getGigs } from "../controllers/gigs.controller.js";

const router = Router();

router.route("/").get(getGigs);

export default router;
