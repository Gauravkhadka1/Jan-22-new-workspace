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
    tasks?.filter((task) => dayjs(task.startDate).isSame(userSelectedDate, "day")) || [];

  return (
    <>
      <div className="grid grid-cols-[auto_auto_1fr] px-4">
        <div className="w-16 border-r border-gray-300 text-xs">GMT +2</div>
        <div className="flex w-16 flex-col items-center">
          <div className={cn("text-xs", isToday && "text-blue-600")}>
            {userSelectedDate.format("ddd")}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-full p-2 text-2xl",
              isToday && "bg-blue-600 text-white"
            )}
          >
            {userSelectedDate.format("DD")}
          </div>
        </div>
        <div></div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] p-4">
          <div className="w-16 border-r border-gray-300">
            {getHours
              .filter((hour) => hour.hour() >= 10 && hour.hour() <= 18)
              .map((hour, index) => (
                <div key={index} className="relative h-16">
                  <div className="absolute -top-2 text-xs text-gray-600">
                    {hour.format("HH:mm")}
                  </div>
                </div>
              ))}
          </div>

          <div className="relative border-r border-gray-300">
            {getHours
              .filter((hour) => hour.hour() >= 10 && hour.hour() <= 18)
              .map((hour, i) => {
                const tasksInHour = filteredTasks.filter((task) => {
                  const taskStart = dayjs(task.startDate);
                  const taskEnd = dayjs(task.dueDate);
                  return (
                    taskStart.hour() === hour.hour() &&
                    taskEnd.isAfter(taskStart)
                  );
                });

                return (
                  <div
                    key={i}
                    className="relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                    onClick={() => {
                      setDate(userSelectedDate.hour(hour.hour()));
                      openPopover();
                    }}
                  >
                    {tasksInHour.map((task, index) => {
                      const taskStart = dayjs(task.startDate);
                      const taskEnd = dayjs(task.dueDate);
                      const top = (taskStart.minute() / 60) * 100;
                      const height = ((taskEnd.diff(taskStart, "minutes")) / 60) * 100;
                      
                      
                      const nestedLevel = filteredTasks.reduce((level, otherTask) => {
                        if (
                          taskStart.isAfter(dayjs(otherTask.startDate)) &&
                          taskEnd.isBefore(dayjs(otherTask.dueDate))
                        ) {
                          return level + 1; // Increase nesting level
                        }
                        return level;
                      }, 0);
                      
                      const maxNestedMargin = 20; // Maximum left margin to avoid excessive shifts
                      const left = Math.min(nestedLevel * 50, maxNestedMargin + 200); // Adjust left margin safely
                      
                      const baseWidth = 100 / tasksInHour.length; // Standard width
                      const adjustedWidth = baseWidth - (left / 2); // Reduce width slightly when left margin is applied
                      
                      
                      
                      
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "absolute text-white text-xs px-2 py-1 rounded-md shadow-md border border-white",
                            task.status === "Completed" ? "bg-green-600" : "bg-blue-500"
                          )}
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            width: `calc(100% - ${left}px)`, // Ensure it doesn't overflow
                            marginLeft: `${left}px`, // Prevent overflow while keeping alignment
                            maxWidth: "100%", // Make sure it doesn't exceed parent width
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
                  </div>
                );
              })}

            {isToday && (
              <div
                className="absolute h-0.5 w-full bg-red-500"
                style={{
                  top: `${((currentTime.hour() - 10) * 100) / 9}%`,
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}