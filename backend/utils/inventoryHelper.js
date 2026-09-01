// utils/inventoryHelper.js
// Centralized inventory & stock management ensuring ACID compliance and DRY principles

const Product = require("../models/Product");

/**
 * Deduct stock for all items in an order atomically.
 * Ensures stock does not drop below 0 by checking { stock: { $gte: quantity } }.
 * Throws an error if insufficient stock is available.
 *
 * @param {Array} orderItems - Array of order items with product and quantity
 * @param {Object} [session=null] - Optional Mongoose transaction session
 */
const deductOrderStock = async (orderItems, session = null) => {
  const deducted = [];

  try {
    for (const item of orderItems) {
      const productId = item.product?._id || item.product;
      const quantity = Number(item.quantity);

      const updateQuery = {
        _id: productId,
        stock: { $gte: quantity },
      };

      const options = session ? { session, new: true } : { new: true };

      const updatedProduct = await Product.findOneAndUpdate(
        updateQuery,
        { $inc: { stock: -quantity } },
        options,
      );

      if (!updatedProduct) {
        throw new Error(
          `Insufficient stock available for product "${item.name || productId}". Transaction aborted.`,
        );
      }

      deducted.push({ productId, quantity });
    }
    return true;
  } catch (error) {
    // If not running inside a replica set transaction, rollback manually
    if (!session && deducted.length > 0) {
      for (const d of deducted) {
        await Product.findByIdAndUpdate(d.productId, {
          $inc: { stock: d.quantity },
        }).catch((err) =>
          console.error(`Rollback error for product ${d.productId}:`, err),
        );
      }
    }
    throw error;
  }
};

/**
 * Restore stock for all items in an order atomically.
 * Used upon order cancellation or refund.
 *
 * @param {Array} orderItems - Array of order items with product and quantity
 * @param {Object} [session=null] - Optional Mongoose transaction session
 */
const restoreOrderStock = async (orderItems, session = null) => {
  for (const item of orderItems) {
    const productId = item.product?._id || item.product;
    const quantity = Number(item.quantity);

    const options = session ? { session } : {};

    await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity } },
      options,
    );
  }
  return true;
};

module.exports = {
  deductOrderStock,
  restoreOrderStock,
};
