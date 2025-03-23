import mongoose from "mongoose";
import { Client } from "../models/client.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";

const getAllGigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  // Aggregation pipeline to get gigs from all clients
  const clientsWithGigs = await Client.aggregate([
    { $unwind: "$gigs" }, // Flatten gigs array
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        _id: 0,
        clientId: "$_id",
        email: 1,
        location: 1,
        "gigs.gigId": 1,
        "gigs.title": 1,
        "gigs.amount_amount": 1,
        "gigs.hourly_rate": 1,
        "gigs.duration": 1,
        "gigs.type": 1,
        "gigs.Description": 1,
        "gigs.Status": 1,
        "gigs.created_on": 1,
        "gigs.engagement": 1,
        "gigs.proposals_tier": 1,
        "gigs.published_on": 1,
        "gigs.client_total_reviews": 1,
        "gigs.occupations_category_pref_label": 1,
        "gigs.occupations_oservice_pref_label": 1,
        "gigs.client_total_spent": 1,
        "gigs.client_location_country": 1,
      },
    },
  ]);

  // Count the total gigs across all clients
  const totalGigs = await Client.aggregate([
    { $unwind: "$gigs" },
    { $count: "totalGigs" },
  ]);

  const total = totalGigs.length > 0 ? totalGigs[0].totalGigs : 0;

  res.status(200).json(
    new ApiResponse(200, clientsWithGigs, {
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / pageSize),
        totalGigs: total,
      },
    })
  );
});

const getSingleGig = asyncHandler(async (req, res) => {
  const { gigId } = req.params;

  // Use aggregation to search through all client gigs by ID
  const gig = await Client.aggregate([
    { $unwind: "$gigs" },
    { $match: { "gigs.gigId": gigId } },
    {
      $project: {
        _id: 0,
        clientId: "$_id",
        email: 1,
        location: 1,
        gig: "$gigs",
      },
    },
  ]);

  if (!gig || gig.length === 0) {
    throw new ApiError(404, "Gig not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, gig[0], "Gig fetched successfully"));
});

// Create Gig
const createGigs = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const gigData = req.body;

  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  client.gigs.push(gigData);
  await client.save();

  res.status(201).json(new ApiResponse(201, client, "Gig added successfully"));
});

const getGigsByClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  const client = await Client.findById(clientId);
  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, client.gigs, "Gigs fetched successfully"));
});

// Update Gig
const updateGigs = asyncHandler(async (req, res) => {
  const { clientId, gigId } = req.params;
  const updatedData = req.body;

  const client = await Client.findById(clientId);
  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  const gig = client.gigs.id(gigId);
  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  Object.assign(gig, updatedData);
  await client.save();

  res.status(200).json(new ApiResponse(200, gig, "Gig updated successfully"));
});

// 🔥 Delete Gig for a Client
const deleteGigs = asyncHandler(async (req, res) => {
  const { clientId, gigId } = req.params;

  const client = await Client.findById(clientId);
  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  client.gigs.id(gigId).remove();
  await client.save();

  res.status(200).json(new ApiResponse(200, {}, "Gig deleted successfully"));
});

const getRecommendedGigs = asyncHandler(async (req, res) => {
  const { gigId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!gigId) {
    throw new ApiError(400, "Gig ID is required");
  }

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  try {
    // ✅ Fetch recommendations from Flask server
    const response = await axios.get(
      `http://127.0.0.1:5000/recommend?gig_id=${gigId}`
    );

    const allRecommendedGigs = response.data;

    if (!Array.isArray(allRecommendedGigs)) {
      throw new ApiError(500, "Invalid response format from Flask server");
    }

    // ✅ Pagination logic
    const totalGigs = allRecommendedGigs.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedGigs = allRecommendedGigs.slice(startIndex, endIndex);

    res.status(200).json(
      new ApiResponse(200, paginatedGigs, {
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalGigs / pageSize),
          totalGigs: totalGigs,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching recommended gigs:", error);
    throw new ApiError(500, "Failed to fetch recommended gigs");
  }
});

export {
  getAllGigs,
  getSingleGig,
  createGigs,
  getGigsByClient,
  updateGigs,
  deleteGigs,
  getRecommendedGigs,
};
