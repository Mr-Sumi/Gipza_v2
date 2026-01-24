const { ZodError } = require('zod');
const { fromZodError } = require('zod-validation-error');

/**
 * Format Zod validation errors into user-friendly format
 */
const formatZodError = (error) => {
  if (!(error instanceof ZodError) || !error.errors) {
    return [{ field: 'unknown', message: 'Validation error occurred' }];
  }

  return error.errors.map((err) => {
    const field = err.path.length > 0 ? err.path.join('.') : 'unknown';
    return {
      field: field,
      message: err.message || 'Invalid value',
      code: err.code,
    };
  });
};


/**
 * Validation middleware for Zod schemas
 */
const validate = (schema) => {
  return async (req, res, next) => {
  try {
      const validatedData = await schema.parseAsync({
        body: req.body || {},
        params: req.params || {},
        query: req.query || {},
    });

      // Replace with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) req.query = validatedData.query;

    next();
  } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodError(error);
        
        // Get enhanced error message from zod-validation-error
        const enhancedMessage = fromZodError(error, {
          prefix: '',
          prefixSeparator: '',
        }).message;

      return res.status(400).json({
          success: false,
          message: enhancedMessage || 'Validation failed',
          errors: formattedErrors,
      });
    }

      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
}; 

module.exports = { validate };