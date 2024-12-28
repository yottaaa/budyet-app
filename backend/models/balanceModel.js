import mongoose from "mongoose";

const balanceSchema = mongoose.Schema(
  {
    start: { type: mongoose.Schema.Types.Decimal128, required: true },
    in: { type: mongoose.Schema.Types.Decimal128, required: false },
    out: { type: mongoose.Schema.Types.Decimal128, required: false },
    end: { type: mongoose.Schema.Types.Decimal128, required: true },
    income: { type: mongoose.Schema.Types.ObjectId, ref: 'Income', required: false },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
  }
);
balanceSchema.index({ "income.source": "text", "expense.tag": "text" });

const Balance = mongoose.model("Balance", balanceSchema);

export default Balance;