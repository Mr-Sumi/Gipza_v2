const ListStore = require('../models/ListStore');

/**
 * Save a new list
 * @param {Object} listData - List data (name, description, type, content)
 * @param {String} userId - User ID who created the list (optional)
 * @returns {Promise<Object>} Saved list
 */
const saveList = async (listData, userId = null) => {
  const { name, description, type, content } = listData;

  if (!name || !type || !content) {
    throw new Error('Name, type, and content are required');
  }

  const newList = new ListStore({
    name,
    description,
    type,
    content,
    createdBy: userId || undefined,
  });

  const savedList = await newList.save();
  return savedList;
};

/**
 * Get all lists with optional type filter
 * @param {Object} filters - Query filters (type)
 * @returns {Promise<Array>} List of lists
 */
const getLists = async (filters = {}) => {
  const { type } = filters;
  
  let query = {};
  
  if (type) {
    query.type = type;
  }
  
  const lists = await ListStore.find(query).sort({ createdAt: -1 });
  return lists;
};

/**
 * Get a specific list by ID
 * @param {String} id - List ID
 * @returns {Promise<Object>} List object
 */
const getListById = async (id) => {
  const list = await ListStore.findById(id);
  
  if (!list) {
    throw new Error('List not found');
  }
  
  return list;
};

/**
 * Update a list
 * @param {String} id - List ID
 * @param {Object} updateData - Data to update (name, description, content)
 * @returns {Promise<Object>} Updated list
 */
const updateList = async (id, updateData) => {
  const { name, description, content } = updateData;
  
  const updatedList = await ListStore.findByIdAndUpdate(
    id,
    { 
      name, 
      description, 
      content,
      updatedAt: Date.now()
    },
    { new: true, runValidators: true }
  );
  
  if (!updatedList) {
    throw new Error('List not found');
  }
  
  return updatedList;
};

/**
 * Delete a list
 * @param {String} id - List ID
 * @returns {Promise<Object>} Deleted list
 */
const deleteList = async (id) => {
  const deletedList = await ListStore.findByIdAndDelete(id);
  
  if (!deletedList) {
    throw new Error('List not found');
  }
  
  return deletedList;
};

module.exports = {
  saveList,
  getLists,
  getListById,
  updateList,
  deleteList,
};
