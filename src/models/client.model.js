import mongoose, { Schema } from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Gig Schema as an embedded subdocument
const gigSchema = new mongoose.Schema(
  {
    gigId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    amount_amount: {
      type: Number,
    },
    hourly_rate: {
      type: Number,
    },
    duration: {
      type: String,
    },
    type: {
      type: String,
    },
    Description: {
      type: String,
    },
    Status: {
      type: String,
    },
    created_on: {
      type: Date,
      default: Date.now,
    },
    engagement: {
      type: String,
    },
    freelancers_to_hire: {
      type: Number,
    },
    proposals_tier: {
      type: String,
    },
    published_on: {
      type: Date,
      default: Date.now,
    },
    tier: {
      type: String,
    },
    client_total_reviews: {
      type: Number,
    },
    client_total_spent: {
      type: Number,
    },
    client_location_country: {
      type: String,
    },
    client_total_feedback: {
      type: Number,
    },
    occupations_category_pref_label: {
      type: String,
    },
    occupations_oservice_pref_label: {
      type: String,
    },
  },
  { timestamps: true }
);

// Client Schema with embedded gigs
const clientSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    total_spent: {
      type: Number,
      default: 0,
    },
    gigs: [gigSchema], // Array of gigs subdocuments
  },
  { timestamps: true }
);

clientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

clientSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

clientSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      location: this.location,
      total_spent: this.total_spent,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

clientSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

clientSchema.plugin(mongooseAggregatePaginate);

export const Client = mongoose.model("Client", clientSchema);
