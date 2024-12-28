import mongoose from "mongoose";

const incomeSchema = mongoose.Schema(
  {
    source: { type: String, required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
  }
);
incomeSchema.index({ source: 'text' });

const Income = mongoose.model("Income", incomeSchema);

export default Income;
