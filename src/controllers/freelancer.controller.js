import { ApiResponse } from "../utils/ApiResponse.js";
import { Freelancer } from "../models/freelancer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt";

// Function to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await Freelancer.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// **Register a new Freelancer**
export const registerFreelancer = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    location,
    experience_level,
    hourly_rate,
    occupation,
    skills,
    description,
    qualification,
  } = req.body;
  console.log(req.body);
  if (
    [
      fullName,
      email,
      password,
      location,
      experience_level,
      hourly_rate,
      occupation,
      skills,
      description,
      qualification,
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if freelancer already exists
  const existingFreelancer = await Freelancer.findOne({ email });
  if (existingFreelancer) {
    throw new ApiError(409, "Freelancer with this email already exists");
  }

  let resumeLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.resume) &&
    req.files.resume.length > 0
  ) {
    resumeLocalPath = req.files.resume[0].path;
  }

  let resumeUrl = "";

  if (resumeLocalPath) {
    const uploadedResume = await uploadOnCloudinary(resumeLocalPath);
    resumeUrl = uploadedResume?.secure_url || "";
  }

  const newFreelancer = await Freelancer.create({
    fullName,
    email,
    password,
    location,
    experience_level,
    hourly_rate,
    occupation,
    skills,
    description,
    qualification,
    resume: resumeUrl,
  });

  const createdFreelancer = await Freelancer.findById(newFreelancer._id).select(
    "-password -refreshToken"
  );

  if (!createdFreelancer) {
    throw new ApiError(
      500,
      "Something went wrong while registering the freelancer"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdFreelancer,
        "Freelancer registered successfully"
      )
    );
});

// **Freelancer Login**
export const loginFreelancer = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const freelancer = await Freelancer.findOne({ email });
  if (!freelancer) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await freelancer.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    freelancer._id
  );

  // Save refresh token in DB
  freelancer.refreshToken = refreshToken;
  await freelancer.save();

  res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .json(new ApiResponse(200, { freelancer }, "Login successful"));
});

// **Logout Freelancer**
export const logoutFreelancer = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const freelancer = await Freelancer.findById(_id);
  if (!freelancer) {
    throw new ApiError(400, "User not found");
  }

  freelancer.refreshToken = null;
  await freelancer.save();

  res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// **Update Freelancer Details**
export const updateFreelancerDetails = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;
  const updates = req.body;

  const freelancer = await Freelancer.findByIdAndUpdate(freelancerId, updates, {
    new: true,
    runValidators: true,
  });
  if (!freelancer) {
    throw new ApiError(404, "Freelancer not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        freelancer,
        "Freelancer details updated successfully"
      )
    );
});

// **Fetch Single Freelancer**
export const fetchSingleFreelancer = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;

  const freelancer = await Freelancer.findById(freelancerId);
  if (!freelancer) {
    throw new ApiError(404, "Freelancer not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, freelancer, "Freelancer retrieved successfully")
    );
});

export const uploadResume = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "Resume file is required");
  }

  const uploadedFile = await uploadOnCloudinary(req.file.path);
  if (!uploadedFile) {
    throw new ApiError(500, "Failed to upload resume");
  }

  const freelancer = await Freelancer.findByIdAndUpdate(
    freelancerId,
    { resume: uploadedFile.secure_url },
    { new: true }
  );

  if (!freelancer) {
    throw new ApiError(404, "Freelancer not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, freelancer, "Resume uploaded successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await Freelancer.findById(decodedToken._id);

    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken; // Update refresh token in DB
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});
