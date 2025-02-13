import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { getHours } from "@/lib/getTime";
import { useAuth } from "@/context/AuthContext";
import { useGetTasksByUserQuery } from "@/state/api";

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  // const { openPopover } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch user-specific tasks
  const { data: tasks, isLoading } = useGetTasksByUserQuery(userId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = userSelectedDate.isSame(dayjs(), "day");

  // Filter tasks for the selected date
  const filteredTasks = tasks?.filter(task =>
    dayjs(task.startDate).isSame(userSelectedDate, "day")
  ) || [];

  return (
    <>
      <div className="grid grid-cols-[auto_auto_1fr] px-4">
        <div className="w-16 border-r border-gray-300 text-xs">GMT +2</div>
        <div className="flex w-16 flex-col items-center">
          <div className={cn("text-xs", isToday && "text-blue-600")}>
            {userSelectedDate.format("ddd")}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-full p-2 text-2xl",
            isToday && "bg-blue-600 text-white"
          )}>
            {userSelectedDate.format("DD")}
          </div>
        </div>
        <div></div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] p-4">
          {/* Time Column */}
          <div className="w-16 border-r border-gray-300">
            {getHours
              .filter(hour => hour.hour() >= 10 && hour.hour() <= 18)
              .map((hour, index) => (
                <div key={index} className="relative h-16">
                  <div className="absolute -top-2 text-xs text-gray-600">
                    {hour.format("HH:mm")}
                  </div>
                </div>
              ))}
          </div>

          {/* Day View Grid with Tasks */}
          <div className="relative border-r border-gray-300">
          {getHours
  .filter(hour => hour.hour() >= 10 && hour.hour() <= 18)
  .map((hour, i) => {
    const tasksInHour = filteredTasks.filter(task => {
      const taskStart = dayjs(task.startDate);
      return taskStart.hour() === hour.hour();
    });

    const taskCount = tasksInHour.length || 1; // Avoid division by zero
    const margin = 0.5; // Adjust margin (in percentage or px, here in px)

    return (
      <div
        key={i}
        className="relative flex h-16 border-b border-gray-300 hover:bg-gray-100"
      >
        {tasksInHour.map((task, index) => {
          const taskStart = dayjs(task.startDate);
          const taskEnd = dayjs(task.dueDate);
          const widthPercentage = (100 - (margin * (taskCount - 1))) / taskCount; // Adjust width to accommodate margin
          const leftPercentage = index * (widthPercentage + margin); // Position with margin

          return (
            <div
              key={task.id}
              className="absolute top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow-md"
              style={{
                width: `${widthPercentage}%`,
                left: `${leftPercentage}%`,
              }}
            >
              <div>{task.title}</div>
              <div className="text-xxs">
                {taskStart.format("HH:mm")} - {taskEnd.format("HH:mm")}
              </div>
            </div>
          );
        })}
      </div>
    );
  })}





            {/* Current time indicator */}
            {isToday && (
              <div
                className="absolute h-0.5 w-full bg-red-500"
                style={{
                  top: `${(currentTime.hour() - 10) * 100 / 9}%`,
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
