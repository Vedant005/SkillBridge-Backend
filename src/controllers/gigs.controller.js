import mongoose from "mongoose";
import { Client } from "../models/client.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";

const getAllGigs = asyncHandler(async (req, res) => {
  const { gigId } = req.query;
  const { page = 1, limit = 20 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  let recommendedGigs = [];
  let regularGigs = [];

  try {
    // ✅ Fetch regular gigs (paginated)
    const clientsWithGigs = await Client.aggregate([
      { $unwind: "$gigs" },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          clientId: "$_id",
          email: 1,
          location: 1,
          gigs: "$gigs",
        },
      },
    ]);

    // ✅ Fetch recommended gigs if gigId exists
    if (gigId) {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/recommend?gig_id=${gigId}`
        );
        recommendedGigs = response.data || [];
      } catch (error) {
        console.error("Failed to fetch recommended gigs:", error);
        recommendedGigs = [];
      }
    }

    const combinedGigs = [...recommendedGigs, ...clientsWithGigs];

    const totalGigs = await Client.aggregate([
      { $unwind: "$gigs" },
      { $count: "totalGigs" },
    ]);

    const total = totalGigs.length > 0 ? totalGigs[0].totalGigs : 0;

    res.status(200).json(
      new ApiResponse(200, combinedGigs, {
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / pageSize),
          totalGigs: total,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching gigs:", error);
    throw new ApiError(500, "Failed to fetch gigs");
  }
});

const getSingleGig = asyncHandler(async (req, res) => {
  const { gigId } = req.params;

  // ✅ Search by string `gigId`
  const gigs = await Client.aggregate([
    { $unwind: "$gigs" },
    { $match: { "gigs.gigId": gigId } }, // ✅ Match by string, not ObjectId
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

  if (!gigs || gigs.length === 0) {
    throw new ApiError(404, "Gig not found"); // ✅ Error handling
  }

  res
    .status(200)
    .json(new ApiResponse(200, gigs[0], "Gig fetched successfully"));
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

export {
  getAllGigs,
  getSingleGig,
  createGigs,
  getGigsByClient,
  updateGigs,
  deleteGigs,
};
