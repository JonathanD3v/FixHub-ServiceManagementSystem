const Supplier = require("../../models/Supplier");

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const suppliers = await Supplier.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ error: "Error fetching suppliers" });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, products, isActive } = req.body;

    const supplier = new Supplier({
      name,
      email,
      phone,
      address,
      products,
      isActive,
    });

    await supplier.save();

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);
    res.status(500).json({ error: "Error creating supplier" });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, products, isActive } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone, address, products, isActive } },
      { new: true, runValidators: true },
    );

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);
    res.status(500).json({ error: "Error updating supplier" });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({ error: "Error deleting supplier" });
  }
};
