import { getWeeks } from "@/lib/getTime";
import { useDateStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from "dayjs"; // Import Dayjs type
import React, { Fragment } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

export default function SideBarCalendar() {
  const { setMonth, selectedMonthIndex, twoDMonthArray, setDate, userSelectedDate } = useDateStore(); // Access 'userSelectedDate' from store

  const handleDayClick = (day: Dayjs) => {
    setDate(day); // Update the selected date in the store
  };

  console.log("Selected Date: ", userSelectedDate.format("DD-MM-YY")); // Log the selected date

  return (
    <div className="my-6 p-2 ">
      <div className="flex items-center justify-between">
        <h4 className="text-sm dark:text-gray-200">
          {dayjs(new Date(dayjs().year(), selectedMonthIndex)).format("MMMM YYYY")}
        </h4>
        <div className="flex items-center gap-3 dark:text-gray-200">
          <MdKeyboardArrowLeft
            className="size-5 cursor-pointer font-bold"
            onClick={() => setMonth(selectedMonthIndex - 1)}
          />
          <MdKeyboardArrowRight
            className="size-5 cursor-pointer font-bold"
            onClick={() => setMonth(selectedMonthIndex + 1)}
          />
        </div>
      </div>

      {/* Header Row: Days of the Week */}
      <div className="mt-2 grid grid-cols-[auto_1fr]">
        <div className="w-0"></div>
        <div className="grid grid-cols-7 text-xs dark:text-gray-200">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <span key={i} className="py-1 text-center">
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content: Weeks and Days */}
      <div className="mt-2 grid grid-cols-[auto_1fr] text-xs">
        {/* Dates grid */}
        <div className="grid grid-cols-7 grid-rows-5 gap-1 gap-y-3 rounded-sm p-1 text-xs">
          {twoDMonthArray.map((row, i) => (
            <Fragment key={i}>
              {row.map((day: Dayjs, index) => (
                <button
                  key={index}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full dark:text-gray-200",
                    day.format("DD-MM-YY") === dayjs().format("DD-MM-YY") && "bg-blue-600 text-white", // Current date styling
                    day.isSame(userSelectedDate, "day") && "bg-blue-200", // Check if the correct class is applied
                  )}
                  onClick={() => handleDayClick(day)} // Pass 'day' here
                >
                  <span>{day.format("D")}</span>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
