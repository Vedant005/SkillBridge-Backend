import { Router } from "express";
import {
  registerFreelancer,
  loginFreelancer,
  logoutFreelancer,
  refreshAccessToken,
  updateFreelancerDetails,
  fetchSingleFreelancer,
  uploadResume,
} from "../controllers/freelancer.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Register a new freelancer with resume upload
router.route("/register").post(
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
  ]),
  registerFreelancer
);

// Freelancer login
router.route("/login").post(loginFreelancer);

// Secured routes
router.route("/logout").post(verifyJWT, logoutFreelancer);

router.route("/refresh-token").post(refreshAccessToken);

// Update freelancer details
router.route("/update-details").patch(verifyJWT, updateFreelancerDetails);

// Fetch a single freelancer profile
router.route("/:id").get(fetchSingleFreelancer);

// Upload/Update freelancer resume
router
  .route("/upload-resume")
  .patch(verifyJWT, upload.single("resume"), uploadResume);

export default router;
