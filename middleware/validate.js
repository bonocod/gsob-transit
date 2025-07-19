const Joi = require('joi');

// Schemas
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
    })
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

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true // ✅ allow _csrf and other hidden fields
    });

    if (error) {
      const msg = error.details.map(d => d.message).join(' ');
      const view =
        req.path.includes('register') ? 'register' :
        req.path.includes('login')    ? 'login' :
        'error';
      return res.status(400).render(view, {
        errorMessage: msg
      });
    }

    next();
  };
}


module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema
  }
};
