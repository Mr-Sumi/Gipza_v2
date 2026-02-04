const ticketService = require('../services/ticketService');

/**
 * Create ticket (authenticated user)
 * POST /api/v1/tickets
 */
exports.createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const ticket = await ticketService.createTicket(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Create ticket failed:', error);
    const statusCode = error.message?.includes('Invalid') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create ticket',
    });
  }
};

/**
 * Get current user's tickets
 * GET /api/v1/tickets/user
 */
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, hasOrder } = req.query;

    const tickets = await ticketService.getUserTickets(userId, {
      status,
      category,
      hasOrder,
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('Get user tickets failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tickets',
    });
  }
};

/**
 * Get ticket details by ID (owner or admin)
 * GET /api/v1/tickets/:id
 */
exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = ['admin'].includes(req.user.role);

    const ticket = await ticketService.getTicketById(id, userId, isAdmin);

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get ticket details failed:', error);
    let statusCode = 500;
    if (error.message === 'Ticket not found') statusCode = 404;
    if (error.message === 'Not authorized to view this ticket') statusCode = 403;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch ticket',
    });
  }
};

/**
 * Add comment to ticket (owner or admin)
 * POST /api/v1/tickets/:id/comment
 */
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = ['admin'].includes(req.user.role);

    const ticket = await ticketService.addComment(id, userId, req.body, isAdmin);

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Add comment failed:', error);
    let statusCode = 500;
    if (error.message === 'Ticket not found') statusCode = 404;
    if (error.message === 'Not authorized to comment on this ticket') statusCode = 403;
    if (error.message === 'Comment text is required') statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add comment',
    });
  }
};

/**
 * Get all tickets (admin)
 * GET /api/v1/tickets (admin only)
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, hasOrder } = req.query;

    const tickets = await ticketService.getAllTickets({
      status,
      category,
      priority,
      hasOrder,
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('Get all tickets failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tickets',
    });
  }
};

/**
 * Update ticket status (admin)
 * PUT /api/v1/tickets/:id/status
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await ticketService.updateTicketStatus(id, status);

    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Update ticket status failed:', error);
    let statusCode = 500;
    if (error.message === 'Ticket not found') statusCode = 404;
    if (error.message?.includes('Invalid status')) statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update status',
    });
  }
};

/**
 * Assign ticket to admin (admin)
 * PUT /api/v1/tickets/:id/assign
 */
exports.assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const ticket = await ticketService.assignTicket(id, assignedTo);

    return res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Assign ticket failed:', error);
    let statusCode = 500;
    if (error.message === 'Ticket not found') statusCode = 404;
    if (error.message?.includes('Valid admin') || error.message?.includes('Assignee')) statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to assign ticket',
    });
  }
};
