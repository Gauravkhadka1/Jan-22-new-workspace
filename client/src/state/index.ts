import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface initialStateTypes {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean; // Keep this, but force `true` by default
}

const initialState: initialStateTypes = {
  isSidebarCollapsed: false,
  isDarkMode: true, // Always dark mode (forced)
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    // Comment out the dark mode toggle since we're forcing dark mode

    // setIsDarkMode: (state, action: PayloadAction<boolean>) => {
    //   state.isDarkMode = action.payload; // Disable switching for now
    // },
  },
});

// Only export `setIsSidebarCollapsed` (since dark mode is forced)
export const { setIsSidebarCollapsed /*, setIsDarkMode */  } = globalSlice.actions;
export default globalSlice.reducer;