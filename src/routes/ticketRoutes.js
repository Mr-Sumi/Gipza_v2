const express = require('express');
const router = express.Router();
const ticketControllers = require('../controllers/ticketControllers');
const { validate } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');
const {
  createTicketValidation,
  getUserTicketsValidation,
  getTicketByIdValidation,
  addCommentValidation,
} = require('../validations/ticket.validation');

router.use(authenticate);

/**
 * @route   POST /api/v1/tickets
 * @desc    Create a support ticket
 * @access  Authenticated user
 */
router.post('/', validate(createTicketValidation), ticketControllers.createTicket);

/**
 * @route   GET /api/v1/tickets/user
 * @desc    Get current user's tickets (optional: status, category, hasOrder)
 * @access  Authenticated user
 */
router.get('/user', validate(getUserTicketsValidation), ticketControllers.getUserTickets);

/**
 * @route   GET /api/v1/tickets/:id
 * @desc    Get ticket details (owner or admin)
 * @access  Authenticated user (owner) or admin/manager
 */
router.get('/:id', validate(getTicketByIdValidation), ticketControllers.getTicketDetails);

/**
 * @route   POST /api/v1/tickets/:id/comment
 * @desc    Add comment to ticket (owner or admin)
 * @access  Authenticated user (owner) or admin/manager
 */
router.post('/:id/comment', validate(addCommentValidation), ticketControllers.addComment);

module.exports = router;
