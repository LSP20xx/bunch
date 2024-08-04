import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchServiceById = createAsyncThunk(
  "service/fetchById",
  async (id) => {
    const response = await axios.get(`/services/${id}`);
    return response.data;
  }
);

export const createService = createAsyncThunk(
  "service/create",
  async (serviceData) => {
    const response = await axios.post("/services", serviceData);
    return response.data;
  }
);

export const updateService = createAsyncThunk(
  "service/update",
  async ({ id, serviceData }) => {
    const response = await axios.put(`/services/${id}`, serviceData);
    return response.data;
  }
);

export const deleteService = createAsyncThunk("service/delete", async (id) => {
  await axios.delete(`/services/${id}`);
  return id;
});

export const listServices = createAsyncThunk("service/list", async () => {
  const response = await axios.get("/services");
  return response.data;
});

const serviceSlice = createSlice({
  name: "service",
  initialState: {
    services: [],
    service: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.service = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createService.pending, (state) => {
        state.loading = true;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.services.push(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateService.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.services.findIndex(
          (service) => service._id === action.payload._id
        );
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        state.services = state.services.filter(
          (service) => service._id !== action.payload
        );
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(listServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(listServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(listServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default serviceSlice.reducer;
