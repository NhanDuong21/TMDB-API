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

module.exports = validate;
