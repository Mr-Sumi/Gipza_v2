const Ticket = require('../models/Ticket');
const User = require('../models/User');
const mongoose = require('mongoose');

const STATUS_ENUM = ['open', 'in-progress', 'resolved', 'closed'];
const PRIORITY_ENUM = ['low', 'medium', 'high'];

/**
 * Create a ticket (authenticated user)
 */
const createTicket = async (userId, data) => {
  const { subject, description, category, priority, imageUrl, orderId } = data;

  const ticketData = {
    user: userId,
    subject: (subject || '').trim(),
    description: (description || '').trim(),
    category: (category || '').trim(),
    priority: priority && PRIORITY_ENUM.includes(priority) ? priority : 'medium',
    imageUrl: imageUrl && String(imageUrl).trim() ? imageUrl.trim() : undefined,
  };

  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    ticketData.orderId = new mongoose.Types.ObjectId(orderId);
  }

  const ticket = await Ticket.create(ticketData);
  return ticket;
};

/**
 * Get tickets for the current user (with optional filters)
 */
const getUserTickets = async (userId, filters = {}) => {
  const { status, category, hasOrder } = filters;
  const query = { user: userId };

  if (status && STATUS_ENUM.includes(status)) query.status = status;
  if (category && String(category).trim()) query.category = { $regex: category.trim(), $options: 'i' };
  if (hasOrder === 'true') query.orderId = { $exists: true, $ne: null };
  if (hasOrder === 'false') query.orderId = null;

  const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 })
    .populate('orderId', 'orderStatus totalAmount products shippingAddress paymentStatus')
    .lean();

  return tickets;
};

/**
 * Get ticket by ID; ensure user owns it or is admin
 */
const getTicketById = async (ticketId, userId, isAdmin = false) => {
  const ticket = await Ticket.findById(ticketId)
    .populate('user', 'name email phoneNumber')
    .populate('assignedTo', 'name email phoneNumber')
    .populate('comments.user', 'name email phoneNumber')
    .populate('orderId', 'orderStatus totalAmount products shippingAddress delivery paymentStatus')
    .lean();

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const userStr = ticket.user?._id?.toString() || ticket.user?.toString();
  if (!isAdmin && userStr !== userId.toString()) {
    throw new Error('Not authorized to view this ticket');
  }

  return ticket;
};

/**
 * Add comment to a ticket (owner or admin)
 */
const addComment = async (ticketId, userId, data, isAdmin = false) => {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) throw new Error('Ticket not found');

  const userStr = ticket.user?.toString();
  if (!isAdmin && userStr !== userId.toString()) {
    throw new Error('Not authorized to comment on this ticket');
  }

  const { text, imageUrl } = data;
  if (!text || !String(text).trim()) {
    throw new Error('Comment text is required');
  }

  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      $push: {
        comments: {
          user: userId,
          text: String(text).trim(),
          imageUrl: imageUrl && String(imageUrl).trim() ? imageUrl.trim() : undefined,
        },
      },
    },
    { new: true }
  )
    .populate('user', 'name email phoneNumber')
    .populate('assignedTo', 'name email phoneNumber')
    .populate('comments.user', 'name email phoneNumber')
    .populate('orderId', 'orderStatus totalAmount products shippingAddress paymentStatus')
    .lean();

  return updated;
};

/**
 * Get all tickets (admin) with optional filters
 */
const getAllTickets = async (filters = {}) => {
  const { status, category, priority, hasOrder } = filters;
  const query = {};

  if (status && STATUS_ENUM.includes(status)) query.status = status;
  if (category && String(category).trim()) query.category = { $regex: category.trim(), $options: 'i' };
  if (priority && PRIORITY_ENUM.includes(priority)) query.priority = priority;
  if (hasOrder === 'true') query.orderId = { $exists: true, $ne: null };
  if (hasOrder === 'false') query.orderId = null;

  const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'name email phoneNumber')
    .populate('orderId', 'orderStatus totalAmount products shippingAddress paymentStatus')
    .lean();

  return tickets;
};

/**
 * Update ticket status (admin)
 */
const updateTicketStatus = async (ticketId, status) => {
  if (!status || !STATUS_ENUM.includes(status)) {
    throw new Error('Invalid status. Must be one of: open, in-progress, resolved, closed');
  }

  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    { status },
    { new: true }
  )
    .populate('user', 'name email phoneNumber')
    .populate('assignedTo', 'name email phoneNumber')
    .populate('orderId', 'orderStatus totalAmount products shippingAddress paymentStatus')
    .lean();

  if (!updated) throw new Error('Ticket not found');
  return updated;
};

/**
 * Assign ticket to an admin user (admin)
 */
const assignTicket = async (ticketId, assignedToUserId) => {
  if (!assignedToUserId || !mongoose.Types.ObjectId.isValid(assignedToUserId)) {
    throw new Error('Valid admin/manager user ID is required');
  }

  const assignee = await User.findById(assignedToUserId).select('role').lean();
  if (!assignee || !['admin', 'manager'].includes(assignee.role)) {
    throw new Error('Assignee must be an admin or manager');
  }

  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    { assignedTo: assignedToUserId, status: 'in-progress' },
    { new: true }
  )
    .populate('user', 'name email phoneNumber')
    .populate('assignedTo', 'name email phoneNumber')
    .populate('orderId', 'orderStatus totalAmount products shippingAddress paymentStatus')
    .lean();

  if (!updated) throw new Error('Ticket not found');
  return updated;
};

module.exports = {
  createTicket,
  getUserTickets,
  getTicketById,
  addComment,
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  STATUS_ENUM,
  PRIORITY_ENUM,
};
