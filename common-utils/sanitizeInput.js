exports.sanitizeInput = (input, fields) => {
  const sanitized = {};
  fields.forEach((field) => {
    if (input[field]) {
      sanitized[field] = input[field].replace(/<[^>]*>?/gm, "");
    }
  });
  return sanitized;
};
