export const selectServiceState = (state) => state.service;
export const selectAllServices = (state) => state.service.services;
export const selectServiceById = (state, id) =>
  state.service.services.find((service) => service._id === id);
export const selectServiceLoading = (state) => state.service.loading;
export const selectServiceError = (state) => state.service.error;
