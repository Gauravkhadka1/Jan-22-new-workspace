import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { EventRenderer } from "./event-renderer"; // or your own component
import { useGetTasksByUserQuery } from "@/state/api"; // Assuming you need to fetch tasks
import { useAuth } from "@/context/AuthContext";

export default function MonthViewBox({
  day,
  rowIndex,
}: {
  day: dayjs.Dayjs | null;
  rowIndex: number;
}) {
  const { openPopover, events } = useEventStore();
  const { setDate } = useDateStore();
  const { user } = useAuth();
  const userId = user?.id;

  const [tasks, setTasks] = useState<any[]>([]);

  // Fetch tasks for the specific day if a user is logged in
  const { data: userTasks } = useGetTasksByUserQuery(userId);

  useEffect(() => {
    if (userTasks && day) {
      // Filter tasks that match the current day's date
      const filteredTasks = userTasks.filter((task: any) =>
        dayjs(task.startDate).isSame(day, "day")
      );
      setTasks(filteredTasks);
    }
  }, [userTasks, day]);

  if (!day) {
    return (
      <div className="h-12 w-full border md:h-28 md:w-full lg:h-full"></div>
    );
  }

  const isFirstDayOfMonth = day.date() === 1;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDate(day);
    openPopover();
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-y-2 border",
        "transition-all hover:bg-violet-50"
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center">
        {rowIndex === 0 && (
          <h4 className="text-xs text-gray-700 mt-2 mb-1">
            {day.format("ddd").toUpperCase()}
          </h4>
        )}
        <h4
          className={cn(
            "text-center text-sm",
            isToday &&
              "flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white"
          )}
        >
          {isFirstDayOfMonth ? day.format("MMM D") : day.format("D")}
        </h4>
      </div>

      {/* Render tasks for the day */}
      <div className="absolute bottom-2 left-2 right-2 text-xs">
        {tasks.map((task) => (
          <div key={task.id} className="bg-blue-500 text-white px-2 py-1 rounded-md mb-1">
            {task.title}
          </div>
        ))}
      </div>

      {/* EventRenderer */}
      <EventRenderer date={day} view="month" events={events} />
    </div>
  );
}
