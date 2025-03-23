import { Router } from "express";
import {
  createGigs,
  deleteGigs,
  getAllGigs,
  getRecommendedGigs,
  getSingleGig,
  updateGigs,
} from "../controllers/gigs.controller.js";

const router = Router();

router.route("/").get(getAllGigs);

router.route("/:gigId").get(getSingleGig);

router.route("/create").post(createGigs);

router.route("/update").patch(updateGigs);

router.route("/delete").delete(deleteGigs);

router.route("/recommend/:gigId").get(getRecommendedGigs);

export default router;
