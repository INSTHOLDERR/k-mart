import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";


async function updateFeaturedProductsCache() {
  try {
    const featured = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featured));
  } catch (e) { console.log("cache update error:", e.message); }
}

async function notifyCartHolders(productId, type, title, message) {
  try {
    const users = await User.find({ "cartItems.product": productId }).select("_id");
    const notes = users.map(u => ({
      userId: u._id, type, title, message,
      productId, isAdminNotification: false,
    }));
    if (notes.length) await Notification.insertMany(notes);
  } catch (e) { console.error("notifyCartHolders error:", e.message); }
}


async function notifyAdmin(type, title, message, productId = null, orderId = null) {
  try {
    await Notification.create({ userId: null, type, title, message, productId, orderId, isAdminNotification: true });
  } catch (e) { console.error("notifyAdmin error:", e.message); }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featured = await redis.get("featured_products");
    if (featured) return res.json(JSON.parse(featured));
    featured = await Product.find({ isFeatured: true }).lean();
    if (!featured) return res.status(404).json({ message: "No featured products found" });
    await redis.set("featured_products", JSON.stringify(featured));
    res.json(featured);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, image, images, category, unit, quantity = 0 } = req.body;

    let primaryUrl = "";
    if (image) {
      const r = await cloudinary.uploader.upload(image, { folder: "products" });
      primaryUrl = r.secure_url;
    }

    let additionalUrls = [];
    if (Array.isArray(images) && images.length > 0) {
      const toUpload = images.filter(img => img && img !== image);
      const results = await Promise.all(toUpload.map(img => cloudinary.uploader.upload(img, { folder: "products" })));
      additionalUrls = results.map(r => r.secure_url);
    }

    const allImages = primaryUrl ? [primaryUrl, ...additionalUrls] : additionalUrls;
    const stockQty  = parseInt(quantity) || 0;

    const product = await Product.create({
      name, description, price,
      originalPrice: originalPrice || null,
      image: primaryUrl || additionalUrls[0] || "",
      images: allImages,
      category,
      unit: unit || "",
      quantity: stockQty,
      isInStock: stockQty > 0,
    });

    
    if (stockQty === 0) {
      await notifyAdmin("out_of_stock", "New Product — Out of Stock",
        `"${name}" was added with 0 stock. Set quantity to make it available.`, product._id);
    } else {
      await notifyAdmin("stock_updated", "New Product Added",
        `"${name}" added with ${stockQty} units in stock.`, product._id);
    }

    res.status(201).json(product);
  } catch (e) {
    console.error("createProduct error:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name, description, price, originalPrice, category, unit,
      isFeatured, quantity, image, images,
    } = req.body;

    const wasInStock = product.isInStock;
    const oldQty     = product.quantity;

    if (name        !== undefined) product.name        = name;
    if (description !== undefined) product.description = description;
    if (price       !== undefined) product.price       = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice || null;
    if (category    !== undefined) product.category    = category;
    if (unit        !== undefined) product.unit        = unit;
    if (isFeatured  !== undefined) product.isFeatured  = isFeatured;

   
    if (image && image.startsWith("data:")) {
      const r = await cloudinary.uploader.upload(image, { folder: "products" });
      product.image = r.secure_url;
    }
    if (Array.isArray(images)) {
      const uploaded = await Promise.all(
        images.filter(img => img && img.startsWith("data:"))
              .map(img => cloudinary.uploader.upload(img, { folder: "products" }))
      );
      if (uploaded.length) product.images = [product.image, ...uploaded.map(r => r.secure_url)];
    }


    if (quantity !== undefined) {
      const newQty = parseInt(quantity);
      product.quantity = newQty < 0 ? 0 : newQty;
    }

    const updated = await product.save();  
    await updateFeaturedProductsCache();


    if (quantity !== undefined) {
      const newQty = updated.quantity;

      if (wasInStock && !updated.isInStock) {

        await notifyAdmin("out_of_stock", "Product Out of Stock",
          `"${updated.name}" is now out of stock.`, updated._id);
        await notifyCartHolders(updated._id, "cart_item_oos",
          "Item no longer available",
          `"${updated.name}" in your cart is now out of stock and cannot be purchased.`);
      } else if (!wasInStock && updated.isInStock) {
        await notifyAdmin("back_in_stock", "Product Back in Stock",
          `"${updated.name}" is back in stock (${newQty} units).`, updated._id);
        await notifyCartHolders(updated._id, "back_in_stock",
          "Item back in stock!",
          `"${updated.name}" is back in stock! You can now complete your purchase.`);
      } else if (updated.isInStock && newQty <= updated.lowStockThreshold) {
        await notifyAdmin("low_stock", "Low Stock Warning",
          `"${updated.name}" has only ${newQty} unit(s) left.`, updated._id);
      } else {
        await notifyAdmin("stock_updated", "Stock Updated",
          `"${updated.name}" stock changed from ${oldQty} → ${newQty}.`, updated._id);
      }
    } else {
      await notifyAdmin("product_edited", "Product Edited",
        `"${updated.name}" details were updated.`, updated._id);
    }

    res.json(updated);
  } catch (e) {
    console.error("updateProduct error:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const allImageUrls = product.images?.length ? product.images : product.image ? [product.image] : [];
    for (const url of allImageUrls) {
      if (url) {
        const publicId = url.split("/").pop().split(".")[0];
        try { await cloudinary.uploader.destroy(`products/${publicId}`); } catch {}
      }
    }

    await notifyCartHolders(product._id, "product_deleted",
      "Item removed from store",
      `"${product.name}" has been removed from the store and cannot be purchased.`);

    await notifyAdmin("product_deleted", "Product Deleted",
      `"${product.name}" has been permanently deleted.`, product._id);

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (e) {
    console.error("deleteProduct error:", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { quantity: { $gt: 0 } } },  
      { $sample: { size: 4 } },
      { $project: { _id: 1, name: 1, description: 1, image: 1, images: 1, price: 1, quantity: 1, isInStock: 1 } },
    ]);
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json({ products });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.isFeatured = !product.isFeatured;
    const updated = await product.save();
    await updateFeaturedProductsCache();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};


export const checkStock = async (req, res) => {
  try {
    const { items } = req.body; 
    if (!Array.isArray(items)) return res.status(400).json({ message: "items required" });

    const results = [];
    for (const item of items) {
      const p = await Product.findById(item.productId).select("name quantity isInStock");
      if (!p) {
        results.push({ productId: item.productId, available: false, reason: "Product not found" });
        continue;
      }
      if (!p.isInStock || p.quantity < item.quantity) {
        results.push({
          productId: item.productId, name: p.name,
          available: false,
          stockLeft: p.quantity,
          reason: p.quantity === 0 ? "Out of stock" : `Only ${p.quantity} left`,
        });
      } else {
        results.push({ productId: item.productId, name: p.name, available: true, stockLeft: p.quantity });
      }
    }

    const allAvailable = results.every(r => r.available);
    res.json({ allAvailable, results });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
