const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 3 characters.'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Enter a valid email.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.'
  }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match.',
      'string.empty': 'Please confirm your password.'
    }),
  urubutoCode: Joi.string().required().messages({
    'string.empty': 'Urubuto code is required.'
  }),
  promotion: Joi.string().optional(),
  class: Joi.string().optional(),
  combination: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Enter a valid email.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.'
  })
});

const bookingSchema = Joi.object({
  destination: Joi.string().required().messages({
    'string.empty': 'Destination is required.'
  }),
  date: Joi.date().iso().required().messages({
    'date.base': 'Date must be a valid date.',
    'any.required': 'Date is required.'
  })
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true
    });

    if (error) {
      const msg = error.details.map(d => d.message).join(' ');
      const view = req.path.includes('register') ? 'register' :
                  req.path.includes('login') ? 'login' :
                  req.path.includes('booking') ? 'booking' :
                  req.path.includes('confirm-booking') ? 'ticket-confirmation' : 'error';
      return res.status(400).render(view, {
        errorMessage: msg,
        user: req.session.user,
        destinations: req.body.destinations || [],
        destination: req.body.destination,
        csrfToken: req.csrfToken()
      });
    }

    next();
  };
}

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    booking: bookingSchema
  }
};