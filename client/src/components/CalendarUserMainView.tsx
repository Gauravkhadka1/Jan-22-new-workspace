"use client"
import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState, useMemo } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { getHours } from "@/lib/getTime";
import { useAuth } from "@/context/AuthContext";
import { useGetTasksByUserQuery, useGetProjectsQuery, useDeleteTaskMutation  } from "@/state/api";
import ModalNewTask from "./ModalNewTask"; // Import the ModalNewTask component
import { useParams } from "next/navigation"; // Import useParams to get userId from URL
import EventPopover from './event-popover'
import { SquarePen, Trash2 } from "lucide-react";
import SideBar from './CalendarSidebar/SideBar'; // Import the SideBar component

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { user } = useAuth();

  // Get userId from URL
  const params = useParams();
  const userId = params?.userId;
  const userIdNumber = userId && !isNaN(Number(userId)) ? Number(userId) : null;

   const {
      isPopoverOpen,
      closePopover,
      isEventSummaryOpen,
      closeEventSummary,
      selectedEvent,
      setEvents,
    } = useEventStore();

  // Fetch tasks for the specific user
  const { data: tasks, isLoading: isTasksLoading } = 
  userIdNumber !== null ? useGetTasksByUserQuery(userIdNumber) : { data: [], isLoading: false };
  const { data: projects, isLoading: isProjectsLoading } = useGetProjectsQuery({});

  const [taskOptionsVisible, setTaskOptionsVisible] = useState<Record<string | number, boolean>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for modal visibility
  const [selectedTask, setSelectedTask] = useState<any>(null); // State to store the task being edited

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = userSelectedDate.isSame(dayjs(), "day");

  // Filter tasks for the specific user
  const userTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => String(task.assignedTo) === String(userIdNumber));
  }, [tasks, userIdNumber]);

  // Memoize the split tasks to handle the new time constraints
  const splitTasks = useMemo(() => {
    if (!userTasks) return [];

    return userTasks.flatMap((task) => {
      const taskStart = dayjs(task.startDate);
      const taskEnd = dayjs(task.dueDate);

      const splitTask = [];
      let currentDay = taskStart.clone();

      while (currentDay.isBefore(taskEnd) || currentDay.isSame(taskEnd, "day")) {
        let startOfDay = currentDay.clone().startOf("day").hour(9); // 10 AM
        let endOfDay = currentDay.clone().startOf("day").hour(19); // 6 PM

        let segmentStart = startOfDay.isAfter(taskStart) ? startOfDay : taskStart;
        let segmentEnd = endOfDay.isBefore(taskEnd) ? endOfDay : taskEnd;

        if (segmentStart.isBefore(segmentEnd)) {
          splitTask.push({
            ...task,
            startDate: segmentStart.toISOString(),
            dueDate: segmentEnd.toISOString(),
          });
        }

        currentDay = currentDay.add(1, "day");
      }

      return splitTask;
    });
  }, [userTasks]);

  // Filter tasks for the selected day and within 10 AM - 6 PM
  const filteredTasks = useMemo(() => {
    return splitTasks.filter((task) => {
      const taskStart = dayjs(task.startDate);
      const taskEnd = dayjs(task.dueDate);
      const dayStart = userSelectedDate.clone().hour(9).minute(0);
      const dayEnd = userSelectedDate.clone().hour(19).minute(0);

      return (
        taskStart.isSame(userSelectedDate, "day") &&
        taskStart.isBefore(dayEnd) &&
        taskEnd.isAfter(dayStart)
      );
    });
  }, [splitTasks, userSelectedDate]);

  // Project mapping remains the same
  const projectMap = useMemo(() => {
    return projects?.reduce((map, project) => {
      map[project.id] = project.name;
      return map;
    }, {} as Record<number, string>) || {};
  }, [projects]);

  // Define the hours to display (10 AM to 6 PM)
  const displayHours = getHours.filter((hour) => hour.hour() >= 9 && hour.hour() <= 19);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  const handleDeleteClick = async (task: any) => {
    // Confirm deletion with the user
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id).unwrap();
        // You might want to refresh the tasks list or update the UI here
        // For example, you could reload the tasks or update local state
      } catch (error) {
        console.error('Failed to delete the task:', error);
        // Handle error (e.g., show an error message to the user)
      }
    }
  };

  return (
    <div className="flex">
      <SideBar /> {/* Sidebar component */}
      <div className="flex-1 p-4">
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
              {displayHours.map((hour, index) => (
                <div key={index} className="relative h-16">
                  <div className="absolute -top-2 text-xs text-gray-600">
                    {hour.format("hh:mm A")}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative border-r border-gray-300">
              {displayHours.map((hour, i) => {
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
                      const top = ((taskStart.minute() / 60) * 100);
                      const height = ((taskEnd.diff(taskStart, "minutes") / 60) * 100);

                      const nestedLevel = filteredTasks.reduce((level, otherTask) => {
                        if (
                          taskStart.isAfter(dayjs(otherTask.startDate)) &&
                          taskEnd.isBefore(dayjs(otherTask.dueDate))
                        ) {
                          return level + 1;
                        }
                        return level;
                      }, 0);

                      const maxNestedMargin = 20;
                      const leftMargin = Math.min(nestedLevel * 50, maxNestedMargin + 200);
                      const taskCount = tasksInHour.length;
                      const taskWidth = `calc(${100 / taskCount}% - ${leftMargin}px)`;
                      const taskLeft = `calc(${(100 / taskCount) * index}% + ${leftMargin}px)`;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "absolute text-white text-xs px-2 py-1 rounded-md shadow-md border border-white",
                            task.status === "Completed" ? "bg-green-600" :
                              task.status === "Work In Progress" ? "bg-orange-500" :
                                task.status === "Under Review" ? "bg-purple-600" : "bg-blue-500"
                          )}
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            width: taskWidth,
                            left: taskLeft,
                            zIndex: 10,
                          }}
                        >
                          <div className="flex justify-between">
                            <span>{task.title}</span>
                            <span 
                              className="cursor-pointer text-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskOptionsVisible(prev => ({ ...prev, [task.id]: !prev[task.id] })); 
                              }}
                            >
                              ...
                            </span>
                          </div>
                          <div>in {projectMap[task.projectId] || "Unknown Project"}</div>
                          
                          {taskOptionsVisible[task.id] && (
                            <div className="absolute right-0 mt-1 bg-white shadow-lg rounded">
                              <button 
                                className="block px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(task); // Open the edit modal with the current task
                                }}
                              >
                                <SquarePen className="w-4 h-4"/>
                              </button>
                               <button 
                                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(task);
                                          }}
                                          disabled={isDeleting}
                                        >
                                          {isDeleting ? 'Deleting...' : <Trash2 className="w-4 h-4"/>}
                                        </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {isToday && currentTime.hour() >= 9 && currentTime.hour() < 19 && (
                <div
                  className="absolute h-0.5 w-full bg-red-500"
                  style={{
                    top: `${((currentTime.hour() + currentTime.minute() / 60 - 10) / 8) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
        {isPopoverOpen && (
        <EventPopover
          isOpen={isPopoverOpen}
          onClose={closePopover}
          // date={userSelectedDate.format("YYYY-MM-DD")}
        />
      )}
          {/* Edit Modal */}
          {isEditModalOpen && (
  <ModalNewTask
    isOpen={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    task={selectedTask}
  // This will trigger the update when the form is submitted
  />
)}
      </div>
    </div>
  );
}
