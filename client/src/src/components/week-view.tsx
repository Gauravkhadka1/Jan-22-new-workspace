import React, { useEffect, useState } from 'react'
import { getHours, getWeekDays } from "@/lib/getTime";
import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from 'dayjs';
import { ScrollArea } from './ui/scroll-area';
import { useGetTasksByUserQuery } from "@/state/api"; // Assuming you need to fetch tasks
import { useAuth } from "@/context/AuthContext";

export default function WeekView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch user-specific tasks
  const { data: tasks, isLoading } = useGetTasksByUserQuery(userId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);  

  // Filter tasks for the week
  const filteredTasksForWeek = tasks?.filter(task =>
    getWeekDays(userSelectedDate).some(({ currentDate }) => dayjs(task.startDate).isSame(currentDate, 'day'))
  ) || [];

  // Filtered hours (10 AM to 6 PM)
  const filteredHours = getHours.filter(hour => hour.hour() >= 10 && hour.hour() <= 18);

  return (
    <>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] place-items-center px-4 py-2">
        <div className="w-16 border-r border-gray-300">
          <div className="relative h-16">
            <div className="absolute top-2 text-xs text-gray-600">GMT +2</div>
          </div>
        </div>

        {/* Week View Header */}
        {getWeekDays(userSelectedDate).map(({ currentDate, today }, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={cn("text-xs", today && "text-blue-600")}>
              {currentDate.format("ddd")}
            </div>
            <div
              className={cn(
                "h-12 w-12 rounded-full p-2 text-2xl",
                today && "bg-blue-600 text-white",
              )}
            >
              {currentDate.format("DD")}
            </div>
          </div>
        ))}
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
          {/* Time Column */}
          <div className="w-16 border-r border-gray-300">
            {filteredHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600">
                  {hour.format("HH:mm")}
                </div>
              </div>
            ))}
          </div>

          {/* Week Days Corresponding Boxes */}
          {getWeekDays(userSelectedDate).map(({ isCurrentDay, today }, index) => {
            const dayDate = userSelectedDate
              .startOf("week")
              .add(index, "day");

            return (
              <div key={index} className="relative border-r border-gray-300">
                {filteredHours.map((hour, i) => (
                  <div
                    key={i}
                    className="relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                    onClick={() => {
                      setDate(dayDate.hour(hour.hour()));
                      openPopover();
                    }}
                  >
                    {/* Render tasks for each hour */}
                    {filteredTasksForWeek
  .filter(task => {
    const taskStart = dayjs(task.startDate);
    const taskEnd = dayjs(task.dueDate);

    return (
      taskStart.isSame(dayDate, "day") &&
      taskStart.hour() === hour.hour() &&
      taskEnd.isAfter(taskStart)
    );
  })
  .map(task => {
    const taskStart = dayjs(task.startDate);
    const taskEnd = dayjs(task.dueDate);
    const top = (taskStart.minute() / 60) * 100;
    const height = ((taskEnd.diff(taskStart, "minutes")) / 60) * 100;

    return (
      <div
        key={task.id}
        className="absolute left-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow-md"
        style={{
          top: `${top}%`,
          height: `${height}%`,
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
                ))}

                {/* Current time indicator for each day */}
                {/* {isCurrentDay(dayDate) && today && (
                  <div
                    className={cn("absolute h-0.5 w-full bg-red-500")}
                    style={{
                      top: `${(currentTime.hour() / 24) * 100}%`,
                    }}
                  />
                )} */}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
