/**
 * Order financial calculations utility
 */

interface OrderCosts {
  rawMaterialsCost: number;
  packagingCost: number;
  subtotal: number;
  additionalFees: number;
  totalCost: number;
  sellingPrice: number;
  taxAmount: number;
  revenue: number;
  profit: number;
}

const DEFAULT_PROFIT_MARGIN = 20;
const TAX_RATE = 0.14;

/**
 * Calculate comprehensive order costs and financials
 */
export function calculateOrderFinancials(
  rawMaterialsCost: number,
  packagingCost: number,
  additionalFees: number = 0,
  profitMarginPercentage: number = DEFAULT_PROFIT_MARGIN
): OrderCosts {
  const subtotal = rawMaterialsCost + packagingCost;
  const totalCost = subtotal + additionalFees;
  const sellingPrice = totalCost * (1 + profitMarginPercentage / 100);
  const taxAmount = sellingPrice * TAX_RATE;
  const revenue = sellingPrice + taxAmount;
  const profit = sellingPrice - totalCost;

  return {
    rawMaterialsCost: Number(rawMaterialsCost.toFixed(2)),
    packagingCost: Number(packagingCost.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    additionalFees: Number(additionalFees.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    sellingPrice: Number(sellingPrice.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    revenue: Number(revenue.toFixed(2)),
    profit: Number(profit.toFixed(2))
  };
}