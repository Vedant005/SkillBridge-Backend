import { Client } from "../models/client.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Generate tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await Client.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Token generation failed");
  }
};

// Register Client
export const registerClient = asyncHandler(async (req, res) => {
  const { email, password, location, total_spent } = req.body;

  if ([email, password, location].some((field) => !field?.trim())) {
    throw new ApiError(400, "All required fields must be filled");
  }

  const existingClient = await Client.findOne({ email });
  if (existingClient) {
    throw new ApiError(409, "Client with this email already exists");
  }

  const client = await Client.create({
    email,
    password,
    location,
    total_spent,
    gigs: [],
  });

  const createdClient = await Client.findById(client._id).select(
    "-password -refreshToken"
  );

  if (!createdClient) {
    throw new ApiError(500, "Client creation failed");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, createdClient, "Client registered successfully")
    );
});

// Login Client
export const loginClient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const client = await Client.findOne({ email });
  if (!client || !(await client.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    client._id
  );

  client.refreshToken = refreshToken;
  await client.save();

  res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .json(new ApiResponse(200, { client }, "Login successful"));
});

// Logout Client
export const logoutClient = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const client = await Client.findById(_id);
  if (!client) throw new ApiError(404, "Client not found");

  client.refreshToken = null;
  await client.save();

  res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// Update Client
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedClient = await Client.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedClient) throw new ApiError(404, "Client not found");

  res.status(200).json(new ApiResponse(200, updatedClient, "Client updated"));
});

// Get Client by ID
export const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate("gigs");

  if (!client) throw new ApiError(404, "Client not found");

  res.status(200).json(new ApiResponse(200, client, "Client retrieved"));
});

// Get All Clients
export const getAllClients = asyncHandler(async (_req, res) => {
  const clients = await Client.find().populate("gigs");
  res.status(200).json(new ApiResponse(200, clients));
});

// Add Gig to Client
export const addGigToClient = asyncHandler(async (req, res) => {
  const { gigId } = req.body;
  const client = await Client.findById(req.params.id);

  if (!client) throw new ApiError(404, "Client not found");

  client.gigs.push(gigId);
  await client.save();

  res.status(200).json(new ApiResponse(200, client, "Gig added to client"));
});

// Remove Gig from Client
export const removeGigFromClient = asyncHandler(async (req, res) => {
  const { gigId } = req.body;
  const client = await Client.findById(req.params.id);

  if (!client) throw new ApiError(404, "Client not found");

  client.gigs = client.gigs.filter((id) => id.toString() !== gigId);
  await client.save();

  res.status(200).json(new ApiResponse(200, client, "Gig removed from client"));
});

// Delete Client
export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);

  if (!client) throw new ApiError(404, "Client not found");

  res.status(200).json(new ApiResponse(200, {}, "Client deleted successfully"));
});

// Refresh Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await Client.findById(decoded._id);

    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res
      .status(200)
      .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
});
