import { Gigs } from "../models/gigs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getGigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

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

const createGigs = asyncHandler(async (req, res) => {});

export { getGigs };
