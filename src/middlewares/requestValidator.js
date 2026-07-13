const Joi = require('joi');

const schemas = {
  searchSchema: Joi.object({
    keyword: Joi.string().required().min(1),
    page: Joi.number().integer().min(1).default(1),
  }),
  idSchema: Joi.object({
    id: Joi.number().integer().required(),
  }),
  listSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1)
  })
};

const validate = (schema, source = 'query') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source]);
    if (error) {
      const err = new Error(error.details[0].message);
      err.code = 400;
      return next(err);
    }
    // Update req with validated/default values
    req[source] = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
