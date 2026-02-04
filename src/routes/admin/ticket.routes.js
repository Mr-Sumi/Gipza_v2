const express = require('express');
const router = express.Router();
const ticketControllers = require('../../controllers/ticketControllers');
const { validate } = require('../../middleware/validator');
const {
  getAllTicketsValidation,
  updateTicketStatusValidation,
  assignTicketValidation,
} = require('../../validations/admin/ticket.validation');

/**
 * @route   GET /api/v1/admin/tickets
 * @desc    List all tickets (optional: status, category, priority, hasOrder)
 * @access  Admin/Manager
 */
router.get('/', validate(getAllTicketsValidation), ticketControllers.getAllTickets);

/**
 * @route   PUT /api/v1/admin/tickets/:id/status
 * @desc    Update ticket status (open | in-progress | resolved | closed)
 * @access  Admin/Manager
 */
router.put(
  '/:id/status',
  validate(updateTicketStatusValidation),
  ticketControllers.updateTicketStatus
);

/**
 * @route   PUT /api/v1/admin/tickets/:id/assign
 * @desc    Assign ticket to an admin/manager user
 * @access  Admin/Manager
 */
router.put(
  '/:id/assign',
  validate(assignTicketValidation),
  ticketControllers.assignTicket
);

module.exports = router;
