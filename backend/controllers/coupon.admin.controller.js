import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";


export const getAllCoupons = async (req, res) => {
	try {
		const coupons = await Coupon.find({}).sort({ createdAt: -1 }).populate("userId", "name email");
		res.json({ coupons });
	} catch (error) {
		console.log("Error in getAllCoupons controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const createCoupon = async (req, res) => {
	try {
		const { code, discountPercentage, expirationDate, userId } = req.body;

		if (!code || !discountPercentage || !expirationDate) {
			return res.status(400).json({ message: "Code, discount percentage, and expiration date are required" });
		}

		if (discountPercentage < 1 || discountPercentage > 100) {
			return res.status(400).json({ message: "Discount must be between 1 and 100" });
		}

		const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
		if (existing) {
			return res.status(400).json({ message: "Coupon code already exists" });
		}

		const coupon = await Coupon.create({
			code: code.toUpperCase().trim(),
			discountPercentage: Number(discountPercentage),
			expirationDate: new Date(expirationDate),
			isActive: true,
			userId: userId || null,
		});

		res.status(201).json(coupon);
	} catch (error) {
		console.log("Error in createCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const toggleCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findById(req.params.id);
		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}
		coupon.isActive = !coupon.isActive;
		await coupon.save();
		res.json(coupon);
	} catch (error) {
		console.log("Error in toggleCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const deleteCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findById(req.params.id);
		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}
		await Coupon.findByIdAndDelete(req.params.id);
		res.json({ message: "Coupon deleted successfully" });
	} catch (error) {
		console.log("Error in deleteCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const getCouponAnalytics = async (req, res) => {
	try {
		const totalCoupons = await Coupon.countDocuments();
		const activeCoupons = await Coupon.countDocuments({ isActive: true });
		const expiredCoupons = await Coupon.countDocuments({ expirationDate: { $lt: new Date() } });
		const usedCoupons = totalCoupons - activeCoupons;
		const discountTiers = await Coupon.aggregate([
			{
				$group: {
					_id: {
						$switch: {
							branches: [
								{ case: { $lte: ["$discountPercentage", 10] }, then: "≤10%" },
								{ case: { $lte: ["$discountPercentage", 25] }, then: "11–25%" },
								{ case: { $lte: ["$discountPercentage", 50] }, then: "26–50%" },
							],
							default: ">50%",
						},
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		res.json({
			totalCoupons,
			activeCoupons,
			expiredCoupons,
			inactiveCoupons: totalCoupons - activeCoupons - expiredCoupons < 0 ? 0 : totalCoupons - activeCoupons,
			discountTiers,
		});
	} catch (error) {
		console.log("Error in getCouponAnalytics controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};