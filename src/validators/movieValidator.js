const Joi = require('joi');

const searchSchema = Joi.object({
  keyword: Joi.string().required().min(1),
  page: Joi.number().integer().min(1).default(1),
});

const idSchema = Joi.object({
  id: Joi.number().integer().required(),
});

module.exports = {
  searchSchema,
  idSchema,
};
