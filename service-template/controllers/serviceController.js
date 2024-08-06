const serviceHandler = require("../handlers/serviceHandler");
const { sendMessage } = require("../common-utils/rabbitmq");
const Joi = require("joi");
const { sanitizeInput } = require("../common-utils/sanitizeInput");

exports.createService = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const sanitizedBody = sanitizeInput(req.body, ["name", "value"]);

  try {
    const service = await serviceHandler.createService(sanitizedBody);
    await sendMessage("service_created", {
      id: service._id,
      name: service.name,
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await serviceHandler.getServiceById(req.params.id);
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await serviceHandler.deleteService(req.params.id);
    res.status(204).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateService = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    value: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const sanitizedBody = sanitizeInput(req.body, ["name", "value"]);

  try {
    const service = await serviceHandler.updateService(
      req.params.id,
      sanitizedBody
    );
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listServices = async (req, res) => {
  try {
    const services = await serviceHandler.listServices();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
