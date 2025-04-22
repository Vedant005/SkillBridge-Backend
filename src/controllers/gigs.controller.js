import axios from "axios";
import { Client } from "../models/client.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const chatWithAI = async (query) => {
  const freelancingKeywords = [
    "freelance",
    "freelancer",
    "freelancing",
    "gig",
    "project",
    "hire",
    "client",
    "developer",
    "designer",
    "writer",
    "remote work",
    "contract",
    "job",
    "upwork",
    "fiverr",
    "toptal",
  ];

  const isFreelancingQuery = freelancingKeywords.some((kw) =>
    query.toLowerCase().includes(kw.toLowerCase())
  );

  if (!isFreelancingQuery) {
    return "I specialize in freelancing topics only. Please ask me about freelancing, gigs, or hiring professionals.";
  }

  const prompt = `
    [INST] <<SYS>>
    You are a helpful freelancing assistant. Answer concisely. 
    ONLY answer questions related to freelancing, gigs, hiring professionals, learning skills, or remote work.
    If the question is unrelated, respond: "I specialize in freelancing topics only."
    If the question is a hi hello then respond appropriate answers
    <</SYS>>

    User Question: ${query}

    Provide a clear, actionable response. [/INST]
  `;

  const response = await hf.textGeneration({
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    inputs: prompt,
  });

  console.log("AI Response:", response);
  return response.generated_text.trim();
};

const chatbotHandler = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Query parameter is required"));
  }

  console.log(`Processing AI response for: ${query}`);

  try {
    const aiResponse = await chatWithAI(query);

    res
      .status(200)
      .json(
        new ApiResponse(200, { ai_response: aiResponse }, "Chatbot response")
      );
  } catch (error) {
    console.error("Error processing AI response:", error);
    res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to process request"));
  }
});

const getAllGigs = asyncHandler(async (req, res) => {
  const { gigId } = req.query;
  const { page = 1, limit = 20 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  let recommendedGigs = [];
  let regularGigs = [];

  try {
    // Fetch regular gigs (paginated)
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

    //  Sentiment Analysis Logic
    regularGigs = clientsWithGigs.map((client) => {
      const { gigs, ...clientData } = client;

      // Extract reviews and feedback score
      const reviews = gigs.client_total_reviews || 0;
      const feedback = gigs.client_total_feedback || 0;

      // Determine sentiment based on feedback
      let sentiment = "Neutral";
      if (feedback >= 4.0) {
        sentiment = "Positive";
      } else if (feedback >= 2.5 && feedback < 4.0) {
        sentiment = "Neutral";
      } else if (feedback > 0) {
        sentiment = "Negative";
      }

      return {
        ...clientData,
        gigs: {
          ...gigs,
          sentiment,
          total_reviews: reviews,
          feedback_score: feedback,
        },
      };
    });

    //  Fetch recommended gigs if gigId exists
    if (gigId) {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/recommend?gig_id=${gigId}`
        );

        recommendedGigs = response.data.map((gig) => ({
          ...gig,
          gigs: {
            ...gig.gigs,
            sentiment: "Recommended",
          },
        }));
      } catch (error) {
        console.error("Failed to fetch recommended gigs:", error);
        recommendedGigs = [];
      }
    }

    const combinedGigs = [...recommendedGigs, ...regularGigs];

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

  const gigs = await Client.aggregate([
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

  if (!gigs || gigs.length === 0) {
    throw new ApiError(404, "Gig not found");
  }

  //  Extract the gig details
  const gig = gigs[0];

  // Add Sentiment Analysis
  const feedback = gig.gig.client_total_feedback || 0;

  let sentiment = "Neutral"; // Default sentiment

  if (feedback >= 4.0) {
    sentiment = "Positive";
  } else if (feedback >= 2.5 && feedback < 4.0) {
    sentiment = "Neutral";
  } else {
    sentiment = "Negative";
  }

  //  Add sentiment to the gig response
  gig.gig.sentiment = sentiment;

  //  Send the updated response
  res
    .status(200)
    .json(new ApiResponse(200, gig, "Gig fetched successfully with sentiment"));
});

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

const predictPrice = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data) {
    throw new ApiError(401, "Content needed!");
  }

  const response = await axios.post(
    "http://127.0.0.1:5000/predict_price",
    data
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        response.data,
        "Predicted Price for the gig has been calculated"
      )
    );
});

export {
  chatbotHandler,
  getAllGigs,
  getSingleGig,
  createGigs,
  getGigsByClient,
  updateGigs,
  deleteGigs,
  predictPrice,
};
