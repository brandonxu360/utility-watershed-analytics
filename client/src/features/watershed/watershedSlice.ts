import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../app/store'

// Define a type for the slice state
export interface WatershedState {
    value: string
}

// Define the initial state using that type
const initialState: WatershedState = {
    value: ""
}

export const watershedSlice = createSlice({
    name: 'watershed',
    initialState,
    reducers: {
        setWatershedID(state, action: PayloadAction<string>) {
            state.value = action.payload
        },
        clearWatershedID(state) {
            state.value = ""
        }
    }
})

// Export the actions
export const { setWatershedID, clearWatershedID } = watershedSlice.actions

// Watershed selector
export const selectWatershedID = (state: RootState) => state.watershed.value

export default watershedSlice.reducer