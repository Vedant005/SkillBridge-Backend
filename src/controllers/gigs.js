import { Gigs } from "../models/gigs";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

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

export { getGigs };
