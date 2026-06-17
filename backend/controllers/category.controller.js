import Category from "../models/category.model.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.json({ categories });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Category name is required" });

    const exists = await Category.findOne({ name: name.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    let imageUrl = "";
    if (image) {
      const r = await cloudinary.uploader.upload(image, { folder: "categories" });
      imageUrl = r.secure_url;
    }

    const category = await Category.create({ name: name.toLowerCase().trim(), description: description || "", image: imageUrl });

    await Notification.create({
      userId: null, isAdminNotification: true, type: "general",
      title: "Category Created",
      message: `Category "${category.name}" was added.`,
    });

    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (name) category.name = name.toLowerCase().trim();
    if (description !== undefined) category.description = description;

    if (image && image.startsWith("data:")) {
      if (category.image) {
        const publicId = category.image.split("/").pop().split(".")[0];
        try { await cloudinary.uploader.destroy(`categories/${publicId}`); } catch {}
      }
      const r = await cloudinary.uploader.upload(image, { folder: "categories" });
      category.image = r.secure_url;
    }

    const updated = await category.save();

    await Notification.create({
      userId: null, isAdminNotification: true, type: "general",
      title: "Category Updated",
      message: `Category "${updated.name}" was updated.`,
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (category.image) {
      const publicId = category.image.split("/").pop().split(".")[0];
      try { await cloudinary.uploader.destroy(`categories/${publicId}`); } catch {}
    }

    await Notification.create({
      userId: null, isAdminNotification: true, type: "category_deleted",
      title: "Category Deleted",
      message: `Category "${category.name}" was permanently deleted.`,
    });

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
