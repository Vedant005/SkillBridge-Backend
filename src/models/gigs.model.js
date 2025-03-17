import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const gigsSchema = new mongoose.Schema(
  {
    connect_price: {
      type: Number,
    },
    created_on: {
      type: Date,
    },
    tz_date: {
      type: Date,
    },
    duration: {
      type: String,
    },
    engagement: {
      type: String,
    },
    freelancers_to_hire: {
      type: Number,
    },
    amount_amount: {
      type: Number,
    },
    hourly_rate: {
      type: Number,
    },
    type: {
      type: String,
    },
    job_ts: {
      type: Number,
    },
    proposals_tier: {
      type: String,
    },
    published_on: { type: Date, default: Date.now },
    tier: {
      type: String,
    },
    title: {
      type: String,
    },
    uid: {
      type: Number,
    },
    total_freelancers_to_hire: {
      type: Number,
    },
    client_company_org_uid: {
      type: Number,
    },
    client_payment_verification_status: {
      type: Number,
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
    client_total_reviews: {
      type: Number,
    },
    client_total_spent: {
      type: Number,
    },
    client_location_country: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

gigsSchema.plugin(mongooseAggregatePaginate);

export const Gigs = mongoose.model("Gigs", gigsSchema);
