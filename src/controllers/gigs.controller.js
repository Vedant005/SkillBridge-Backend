import { Gigs } from "../models/gigs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getGigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  try {
    const gigs = await Gigs.find()
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const totalGigs = await Gigs.countDocuments();

    return res.status(200).json(
      new ApiResponse(200, gigs, {
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalGigs / pageSize),
          totalGigs,
        },
      })
    );
  } catch (error) {
    throw new ApiError(500, "Could not fetch gigs");
  }
});

const getSingleGig = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.params;

    const ifExists = await Gigs.findById(_id);
    if (!ifExists) {
      throw new ApiError(401, "GIg does not exist");
    }

    return res.status(200).json(new ApiResponse(200, ifExists, "Gig fetched"));
  } catch (error) {
    throw new ApiError(500, "Could not get the gig");
  }
});
// Create Gig
const createGigs = asyncHandler(async (req, res) => {
  const gigData = req.body;

  try {
    const newGig = await Gigs.create(gigData);
    res
      .status(201)
      .json(new ApiResponse(201, newGig, "Gig created successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to create gig");
  }
});

// Update Gig
const updateGigs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedGig = await Gigs.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedGig) {
      throw new ApiError(404, "Gig not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedGig, "Gig updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to update gig");
  }
});

// Delete Gig
const deleteGigs = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedGig = await Gigs.findByIdAndDelete(id);

    if (!deletedGig) {
      throw new ApiError(404, "Gig not found");
    }

    res.status(200).json(new ApiResponse(200, {}, "Gig deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete gig");
  }
});

export { getGigs, getSingleGig, createGigs, updateGigs, deleteGigs };
