import express from "express";
import {
  registerClient,
  loginClient,
  logoutClient,
  refreshAccessToken,
  getAllClients,
  getClientById,
  updateClient,
  addGigToClient,
  removeGigFromClient,
  deleteClient,
} from "../controllers/client.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // assuming you have this

const router = express.Router();

// Auth routes
router.post("/register", registerClient);
router.post("/login", loginClient);
router.post("/logout", verifyJWT, logoutClient);
router.post("/refresh-token", refreshAccessToken);

// Client CRUD & gig management
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.put("/:id/add-gig", addGigToClient);
router.put("/:id/remove-gig", removeGigFromClient);
router.delete("/:id", deleteClient);

export default router;
