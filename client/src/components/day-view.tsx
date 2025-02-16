import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useGetTasksByUserQuery } from "@/state/api";

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: tasks, isLoading } = useGetTasksByUserQuery(userId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = userSelectedDate.isSame(dayjs(), "day");

  const filteredTasks =
    tasks?.filter((task) => {
      const taskStart = dayjs(task.startDate);
      const taskEnd = dayjs(task.dueDate);
      return (
        taskStart.isSame(userSelectedDate, "day") ||
        (taskStart.isBefore(userSelectedDate.endOf("day")) &&
          taskEnd.isAfter(userSelectedDate.startOf("day")))
      );
    }) || [];

  // Define the working hours (10 AM - 6 PM)
  const workingHours = Array.from({ length: 9 }, (_, i) => dayjs().hour(10 + i).minute(0));

  return (
    <>
      <div className="grid grid-cols-[auto_auto_1fr] px-4">
        <div className="w-16 border-r border-gray-300 text-xs">GMT +2</div>
        <div className="flex w-16 flex-col items-center">
          <div className={cn("text-xs", isToday && "text-blue-600")}>{userSelectedDate.format("ddd")}</div>
          <div className={cn("h-12 w-12 rounded-full p-2 text-2xl", isToday && "bg-blue-600 text-white")}>
            {userSelectedDate.format("DD")}
          </div>
        </div>
        <div></div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] p-4">
          <div className="w-16 border-r border-gray-300">
            {workingHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600">{hour.format("HH:mm")}</div>
              </div>
            ))}
          </div>

          <div className="relative border-r border-gray-300">
            {filteredTasks.map((task) => {
              let taskStart = dayjs(task.startDate);
              let taskEnd = dayjs(task.dueDate);

              const startHourLimit = userSelectedDate.hour(10).minute(0);
              const endHourLimit = userSelectedDate.hour(18).minute(0);

              if (taskStart.isBefore(startHourLimit)) {
                taskStart = startHourLimit;
              }
              if (taskEnd.isAfter(endHourLimit)) {
                taskEnd = endHourLimit;
              }

              const totalMinutes = 8 * 60; // Total minutes from 10 AM to 6 PM
              const startMinutes = (taskStart.hour() - 10) * 60 + taskStart.minute();
              const taskHeight = (taskEnd.diff(taskStart, "minutes") / totalMinutes) * 100;
              const top = (startMinutes / totalMinutes) * 100;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "absolute text-white text-xs px-2 py-1 rounded-md shadow-md border border-white",
                    task.status === "Completed" ? "bg-green-600" : "bg-blue-500"
                  )}
                  style={{
                    top: `${top}%`,
                    height: `${taskHeight}%`,
                    width: "100%",
                    maxWidth: "100%",
                    zIndex: 10,
                  }}
                >
                  <div>{task.title}</div>
                  <div className="text-xxs">
                    {taskStart.format("HH:mm")} - {taskEnd.format("HH:mm")}
                  </div>
                </div>
              );
            })}

            {isToday && currentTime.hour() >= 10 && currentTime.hour() < 18 && (
              <div
                className="absolute h-0.5 w-full bg-red-500"
                style={{
                  top: `${(((currentTime.hour() - 10) * 60 + currentTime.minute()) / (8 * 60)) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
