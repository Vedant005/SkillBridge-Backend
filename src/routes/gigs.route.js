import { Router } from "express";
import {
  createGigs,
  deleteGigs,
  getGigs,
  updateGigs,
} from "../controllers/gigs.controller.js";

const router = Router();

router.route("/").get(getGigs);

router.route("/create").post(createGigs);

router.route("/update").patch(updateGigs);

router.route("/delete").delete(deleteGigs);

export default router;
