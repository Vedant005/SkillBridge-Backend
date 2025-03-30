import { Router } from "express";
import {
  chatbotHandler,
  createGigs,
  deleteGigs,
  getAllGigs,
  getSingleGig,
  updateGigs,
} from "../controllers/gigs.controller.js";

const router = Router();

router.route("/chat").get(chatbotHandler);

router.route("/").get(getAllGigs);

router.route("/:gigId").get(getSingleGig);

router.route("/create").post(createGigs);

router.route("/update").patch(updateGigs);

router.route("/delete").delete(deleteGigs);

export default router;
