const calculateDiscount = async (couponData, totalPrice) => {
  try {
    if (!couponData) return totalPrice;
    if (totalPrice < Number(couponData.minCartValue))
      throw new Error("Invalid min cart value");
    const { couponType, couponRate, couponLimit } = couponData;

    let discountAmount = 0;

    if (couponType === "Percentage Discount") {
      discountAmount = Math.min(
        (totalPrice * Number(couponRate)) / 100,
        Number(couponLimit)
      );
    } else if (couponType === "Flat Discount") {
      discountAmount = Math.min(Number(couponRate), totalPrice);
    }

    const discountedPrice = totalPrice - discountAmount;

    return { discountAmount, discountedPrice };
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

module.exports = calculateDiscount;
