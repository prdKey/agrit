import Address from "../models/Address.js";

/* GET all addresses of logged-in user */
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
    });
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET single address */
export const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* POST create new address */
export const createAddress = async (req, res) => {
    
  try {
    const { name, phone, label, houseNumber, street, barangay, city, zipCode, isDefault } = req.body;
    
    // If new address is default, unset all others first
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }
    console.log(req.user)
    // If this is the user's first address, auto-set as default
    const count = await Address.count({ where: { userId: req.user.id } });
    const shouldBeDefault = isDefault || count === 0;
    
    const address = await Address.create({
      userId: req.user.id,
      name,
      phone,
      label: label || "Home",
      houseNumber,
      street,
      barangay,
      city,
      zipCode,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT update address */
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });

    const { name, phone, label, houseNumber, street, barangay, city, zipCode, isDefault } = req.body;

    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    await address.update({ name, phone, label, houseNumber, street, barangay, city, zipCode, isDefault });
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PATCH set as default */
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });

    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    await address.update({ isDefault: true });
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE address */
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });

    const wasDefault = address.isDefault;
    await address.destroy();

    // If deleted address was default, set the latest one as default
    if (wasDefault) {
      const next = await Address.findOne({
        where: { userId: req.user.id },
        order: [["createdAt", "DESC"]],
      });
      if (next) await next.update({ isDefault: true });
    }

    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};