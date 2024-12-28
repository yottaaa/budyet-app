import mongoose from "mongoose";

const expenseSchema = mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    tag: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
  }
);
expenseSchema.index({ tag: 'text' });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;