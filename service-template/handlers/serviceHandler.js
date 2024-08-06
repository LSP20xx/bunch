const Service = require("../models/serviceModel");
const redisClient = require("../common-utils/redisClient");

exports.createService = async (data) => {
  const service = new Service(data);
  return await service.save();
};

exports.getServiceById = async (id) => {
  const cachedService = await redisClient.get(id);
  if (cachedService) {
    return JSON.parse(cachedService);
  }
  const service = await Service.findById(id);
  if (service) {
    await redisClient.set(id, JSON.stringify(service));
  }
  return service;
};

exports.deleteService = async (id) => {
  await redisClient.del(id);
  return await Service.findByIdAndDelete(id);
};

exports.updateService = async (id, data) => {
  const service = await Service.findByIdAndUpdate(id, data, { new: true });
  if (service) {
    await redisClient.set(id, JSON.stringify(service));
  }
  return service;
};

exports.listServices = async () => {
  return await Service.find({});
};
