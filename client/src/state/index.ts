import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface initialStateTypes {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
}

const initialState: initialStateTypes = {
  isSidebarCollapsed: false,
  isDarkMode: true, // Default to dark mode
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    // Keep the toggle but you just won't use it in your UI for now
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
  },
});

export const { setIsSidebarCollapsed, setIsDarkMode } = globalSlice.actions;
export default globalSlice.reducer;


// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// export interface initialStateTypes {
//   isSidebarCollapsed: boolean;
//   isDarkMode: boolean; // We'll keep this but set default to true
// }

// const initialState: initialStateTypes = {
//   isSidebarCollapsed: false,
//   isDarkMode: true, // Default to dark mode
// };

// export const globalSlice = createSlice({
//   name: "global",
//   initialState,
//   reducers: {
//     setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
//       state.isSidebarCollapsed = action.payload;
//     },
//     // Comment out or remove the dark mode toggle for now
//     // setIsDarkMode: (state, action: PayloadAction<boolean>) => {
//     //   state.isDarkMode = action.payload;
//     // },
//   },
// });

// export const { setIsSidebarCollapsed /*, setIsDarkMode */ } = globalSlice.actions;
// export default globalSlice.reducer;