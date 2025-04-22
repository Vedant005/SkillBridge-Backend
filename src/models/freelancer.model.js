import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const freelancerSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    experience_level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    hourly_rate: {
      type: Number,
      required: true,
    },
    occupation: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    resume: {
      type: String, // Store file path or URL
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

freelancerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

freelancerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

freelancerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      experience_level: this.experience_level,
      location: this.location,
      hourly_rate: this.hourly_rate,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

freelancerSchema.methods.generateRefreshToken = function () {
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

export const Freelancer = mongoose.model("Freelancer", freelancerSchema);
