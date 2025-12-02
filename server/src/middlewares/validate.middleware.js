import { object } from 'yup';

/**
 * Middleware validate request body dựa trên Yup schema.
 * @param {import('yup').ObjectSchema} schema - Yup schema để validate.
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    next();
  } catch (error) {
    const errors = error.inner.map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: errors });
  }
};
