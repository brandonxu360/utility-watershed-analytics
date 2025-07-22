import { configureStore } from '@reduxjs/toolkit'
import watershedReducer from "../features/watershed/watershedSlice"

export const store = configureStore({
  reducer: {
    watershed: watershedReducer
  }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
