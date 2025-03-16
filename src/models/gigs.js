import mongoose from "mongoose";

const GigSchema = new mongoose.Schema({
  title: String,
  type: String,
  amount_amount: Number,
  hourly_rate: Number,
  duration: String,
  engagement: String,
  occupations_category_pref_label: String,
  occupations_oservice_pref_label: String,
  client_total_reviews: Number,
  client_total_spent: Number,
  published_on: { type: Date, default: Date.now },
  tier: String,
  total_freelancers_to_hire: Number,
  client_location_country: String,
});

export default mongoose.model("Gig", GigSchema);
