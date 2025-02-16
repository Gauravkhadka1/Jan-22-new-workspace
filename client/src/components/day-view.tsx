import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState, useMemo } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { getHours } from "@/lib/getTime";
import { useAuth } from "@/context/AuthContext";
import { useGetTasksByUserQuery, useGetProjectsQuery } from "@/state/api";

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: tasks, isLoading: isTasksLoading } = useGetTasksByUserQuery(userId);
  const { data: projects, isLoading: isProjectsLoading } = useGetProjectsQuery({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = userSelectedDate.isSame(dayjs(), "day");

  // Memoize the split tasks to avoid recalculating on every render
  const splitTasks = useMemo(() => {
    return tasks?.flatMap((task) => {
      const taskStart = dayjs(task.startDate);
      const taskEnd = dayjs(task.dueDate);

      if (taskStart.isSame(taskEnd, "day")) {
        return [task]; // Task does not span multiple days
      } else {
        const tasks = [];
        let currentStart = taskStart;

        while (currentStart.isBefore(taskEnd)) {
          const endOfDay = currentStart.endOf("day");
          const startOfNextDay = currentStart.add(1, "day").startOf("day");

          tasks.push({
            ...task,
            startDate: currentStart.toISOString(),
            dueDate: endOfDay.isBefore(taskEnd) ? endOfDay.toISOString() : taskEnd.toISOString(),
          });

          currentStart = startOfNextDay;
        }

        return tasks;
      }
    }) || [];
  }, [tasks]);

  // Memoize the filtered tasks to avoid recalculating on every render
  const filteredTasks = useMemo(() => {
    return splitTasks.filter((task) => {
      const taskStart = dayjs(task.startDate);
      return taskStart.isSame(userSelectedDate, "day");
    });
  }, [splitTasks, userSelectedDate]);

  // Create a map of project IDs to project names
  const projectMap = useMemo(() => {
    return projects?.reduce((map, project) => {
      map[project.id] = project.name;
      return map;
    }, {} as Record<number, string>) || {}; // Fallback to an empty object if projects is undefined
  }, [projects]);

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
              .filter((hour) => hour.hour() >= 0 && hour.hour() <= 23)
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
              .filter((hour) => hour.hour() >= 0 && hour.hour() <= 23)
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
                      
                      // Calculate nesting level for overlapping tasks
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
                      const leftMargin = Math.min(nestedLevel * 50, maxNestedMargin + 200); // Adjust left margin safely
                      
                      // Calculate the width and left position for tasks in the same time range
                      const taskCount = tasksInHour.length;
                      const taskWidth = `calc(${100 / taskCount}% - ${leftMargin}px)`; // Divide width equally with margins
                      const taskLeft = `calc(${(100 / taskCount) * index}% + ${leftMargin}px)`; // Position each task with margins and nesting

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
                            width: taskWidth,
                            left: taskLeft,
                            zIndex: 10,
                          }}
                        >
                          <div>{task.title}</div>
                          <div>in {projectMap[task.projectId] || 'Unknown Project'}</div>
                          
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