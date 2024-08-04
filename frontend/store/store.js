import { configureStore } from "@reduxjs/toolkit";
import serviceReducer from "../slices/serviceSlice";

const store = configureStore({
  reducer: {
    service: serviceReducer,
  },
});

export default store;
