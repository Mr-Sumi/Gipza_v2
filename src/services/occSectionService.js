const OccSection = require('../models/OccSection');
const { deleteFromS3 } = require('../config/s3Config');

/**
 * Get all occasion sections with optional active filter
 * @param {Object} filters - Query filters (active)
 * @returns {Promise<Array>} List of occasion sections
 */
const getAllOccSections = async (filters = {}) => {
  const { active } = filters;
  const filter = {};

  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;

  const items = await OccSection.find(filter).sort({ order: 1, name: 1 });
  return items;
};

/**
 * Get occasion section by ID
 * @param {String} id - Occasion section ID
 * @returns {Promise<Object>} Occasion section object
 */
const getOccSectionById = async (id) => {
  const item = await OccSection.findById(id);

  if (!item) {
    throw new Error('Occasion section not found');
  }

  return item;
};

/**
 * Create occasion section using image URL (and optional image_key) from upload route
 * Client: POST /upload/image → get { url, key } → POST /occ-sections with { name, description?, image, image_key?, ... }
 * @param {Object} occSectionData - { name, description?, image?, image_key?, isActive?, order? }
 */
const createOccSection = async (occSectionData) => {
  const { name, description, image, image_key, isActive, order } = occSectionData;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Name is required');
  }

  const defaultImage =
    'https://th.bing.com/th/id/OIP.J2Ii3CuiN8Hg43HWTSYDRAHaHa?rs=1&pid=ImgDetMain';

  const created = await OccSection.create({
    name: name.trim(),
    description: description != null ? String(description) : '',
    image: image && String(image).trim() ? image.trim() : defaultImage,
    image_key: image_key && String(image_key).trim() ? image_key.trim() : null,
    isActive: typeof isActive === 'boolean' ? isActive : undefined,
    order: order !== undefined ? Number(order) : undefined,
  });

  return created;
};

/**
 * Update occasion section; optionally replace image (send image + image_key from POST /upload/image, old key deleted from S3)
 * @param {String} id - Occasion section ID
 * @param {Object} updateData - { name?, description?, image?, image_key?, isActive?, order? }
 */
const updateOccSection = async (id, updateData) => {
  const existing = await OccSection.findById(id).lean();

  if (!existing) {
    throw new Error('Occasion section not found');
  }

  const updateFields = {};

  if (updateData.name !== undefined) updateFields.name = String(updateData.name).trim();
  if (updateData.description !== undefined) updateFields.description = String(updateData.description);
  if (typeof updateData.isActive === 'boolean') updateFields.isActive = updateData.isActive;
  if (updateData.order !== undefined) updateFields.order = Number(updateData.order);

  if (updateData.image !== undefined && updateData.image_key !== undefined) {
    if (existing.image_key) {
      try {
        await deleteFromS3(existing.image_key);
      } catch (err) {
        console.error('Failed to delete old occasion section image from S3:', err);
      }
    }
    updateFields.image =
      updateData.image && String(updateData.image).trim()
        ? updateData.image.trim()
        : existing.image;
    updateFields.image_key =
      updateData.image_key && String(updateData.image_key).trim()
        ? updateData.image_key.trim()
        : null;
  } else if (updateData.image !== undefined) {
    updateFields.image =
      updateData.image && String(updateData.image).trim()
        ? updateData.image.trim()
        : existing.image;
    if (updateData.image_key !== undefined)
      updateFields.image_key =
        updateData.image_key && String(updateData.image_key).trim()
          ? updateData.image_key.trim()
          : null;
  }

  const updated = await OccSection.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new Error('Occasion section not found');
  }

  return updated;
};

/**
 * Delete occasion section and remove image from S3 if image_key exists
 * @param {String} id - Occasion section ID
 */
const deleteOccSection = async (id) => {
  const deleted = await OccSection.findById(id).lean();

  if (!deleted) {
    throw new Error('Occasion section not found');
  }

  if (deleted.image_key) {
    try {
      await deleteFromS3(deleted.image_key);
    } catch (err) {
      console.error('Failed to delete occasion section image from S3:', err);
    }
  }

  await OccSection.findByIdAndDelete(id);

  return deleted;
};

module.exports = {
  getAllOccSections,
  getOccSectionById,
  createOccSection,
  updateOccSection,
  deleteOccSection,
};
