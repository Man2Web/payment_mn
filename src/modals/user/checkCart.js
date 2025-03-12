const axios = require("axios");

const checkUserCart = async (products) => {
  if (products.length === 0) {
    const error = new Error("No products in cart");
    error.statusCode = 400;
    throw error;
  }

  let totalPrice = 0;
  const productDetails = [];

  try {
    for (const data of products) {
      const response = await axios.get(
        `${process.env.STRAPI_URL}/products/${data.documentId}?populate=*`
      );

      if (response.data.data.stock_Quantity < data.quantity) {
        const error = new Error(
          `Quantity of one or more product is more than available stock`
        );
        error.statusCode = 400;
        throw error;
      }

      const price = Number(response.data.data.calculatedPrice) || 0;
      totalPrice += price * Number(data.quantity);

      productDetails.push({
        product: response.data.data.id,
        categoryId: response.data.data.category.id,
        quantity: data.quantity,
        documentId: data.documentId,
        productPrice: price,
      });
    }

    return { totalPrice, productDetails };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = checkUserCart;
