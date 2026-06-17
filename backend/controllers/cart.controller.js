import Product from "../models/product.model.js";


function getProductId(cartItem) {
  if (cartItem.product) return cartItem.product.toString();
  if (cartItem.id)      return cartItem.id.toString();
  return null;
}


export const getCartProducts = async (req, res) => {
  try {
    const cartItems = req.user.cartItems || [];
    if (cartItems.length === 0) return res.json([]);

    const productIds = cartItems
      .map(i => getProductId(i))
      .filter(Boolean);

    const products = await Product.find({ _id: { $in: productIds } });

    const result = cartItems
      .map(cartItem => {
        const pid     = getProductId(cartItem);
        if (!pid) return null;
        const product = products.find(p => p._id.toString() === pid);
        if (!product) return null;
        return {
          ...product.toJSON(),
          _id:       product._id.toString(),
          quantity:  cartItem.quantity || 1,
          stockLeft: product.quantity,
          isInStock: product.isInStock,
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (e) {
    console.error("getCartProducts:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const product = await Product.findById(productId).select("name quantity isInStock");
    if (!product)
      return res.status(404).json({ message: "Product not found" });
    if (!product.isInStock || product.quantity === 0)
      return res.status(400).json({ message: `"${product.name}" is out of stock` });
    const existing = user.cartItems.find(i => getProductId(i) === productId.toString());

    if (existing) {
      if (existing.quantity >= product.quantity)
        return res.status(400).json({
          message: `Only ${product.quantity} unit(s) of "${product.name}" available`,
        });
      existing.quantity += 1;
    } else {
      user.cartItems.push({ product: productId, quantity: 1 });
    }

    await user.save();
    res.json({ message: "Added to cart", cartCount: user.cartItems.length });
  } catch (e) {
    console.error("addToCart:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};


export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter(
        i => getProductId(i) !== productId.toString()
      );
    }

    await user.save();
    res.json({ message: "Removed", cartCount: user.cartItems.length });
  } catch (e) {
    console.error("removeAllFromCart:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};


export const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;
    const user = req.user;

    const existing = user.cartItems.find(
      i => getProductId(i) === productId.toString()
    );

    if (!existing)
      return res.status(404).json({ message: "Item not in cart" });

    if (quantity === 0) {
      user.cartItems = user.cartItems.filter(
        i => getProductId(i) !== productId.toString()
      );
      await user.save();
      return res.json({ message: "Removed", cartCount: user.cartItems.length });
    }

    const product = await Product.findById(productId).select("name quantity isInStock");
    if (!product)
      return res.status(404).json({ message: "Product not found" });
    if (!product.isInStock || product.quantity === 0)
      return res.status(400).json({ message: `"${product.name}" is now out of stock` });
    if (quantity > product.quantity)
      return res.status(400).json({
        message: `Only ${product.quantity} unit(s) available for "${product.name}"`,
      });

    existing.quantity = quantity;
    await user.save();
    res.json({ message: "Updated", cartCount: user.cartItems.length });
  } catch (e) {
    console.error("updateQuantity:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
