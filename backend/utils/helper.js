import mongoose from "mongoose";

export function toDecimal128(value) {
  // Ensure the value is a number; default to 0 if invalid
  if (value === null || value === undefined || isNaN(value)) {
    value = 0.00;
  }

  // Ensure two decimal places and convert to string
  const formattedValue = parseFloat(value).toFixed(2);

  // Return as Decimal128
  return mongoose.Types.Decimal128.fromString(formattedValue);
}

export function toCamelCase(input) {
  return input
    .toLowerCase() // Convert the entire string to lowercase
    .split(" ")    // Split the string by spaces
    .map((word, index) => 
      index === 0 
        ? word // Keep the first word as is
        : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter of subsequent words
    )
    .join(""); // Join the words together without spaces
}