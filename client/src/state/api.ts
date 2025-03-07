import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface ProjectType {
  id: number;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}

export interface User {
  userId?: number;
  username: string;
  email: string;
  profilePictureUrl?: string;
  cognitoId?: string;
  teamId?: number;
  role?: string; 
}

export interface Attachment {
  id: number;
  fileURL: string;
  fileName: string;
  taskId: number;
  uploadedById: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  assignedBy?: string;
  assignedTo: string;
  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface SearchResults {
  tasks?: Task[];
  projects?: ProjectType[];
  users?: User[];
}

export interface Team {
  teamId: number;
  teamName: string;
  productOwnerUserId?: number;
  projectManagerUserId?: number;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token"); // Get token from localStorage
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const user = JSON.parse(localStorage.getItem("user") || "{}"); // Get user from localStorage
      if (user?.username) {
        headers.set("X-Logged-In-User", user.username); // Send username in a custom header
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams"],
  endpoints: (build) => ({
    registerUser: build.mutation<{ message: string }, Partial<User>>({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),
    getAuthUser: build.query({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const user = await getCurrentUser();
          const session = await fetchAuthSession();
          if (!session) throw new Error("No session found");
          const { userSub } = session;
          const { accessToken } = session.tokens ?? {};

          const userDetailsResponse = await fetchWithBQ(`users/${userSub}`);
          const userDetails = userDetailsResponse.data as User;
          const role = userDetails?.role || "DEFAULT_ROLE"; // default role if not found

          return { data: { user, userSub, userDetails, role } };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),
    getProjects: build.query<ProjectType[], { projectId?: number }>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),
    
    createProject: build.mutation<ProjectType, Partial<ProjectType>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => `tasks?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [{ type: "Tasks" as const }],
    }),
    getTasksByUser: build.query<Task[], number>({
      query: (userId) => `tasks/user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks", id }))
          : [{ type: "Tasks", id: userId }],
    }),
    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),
    updateTask: build.mutation<Task, { taskId: number; taskData: Partial<Task> }>({
      query: ({ taskId, taskData }) => ({
        url: `tasks/${taskId}`,
        method: "PUT",
        body: taskData, // taskData can still include assignedBy if needed
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Tasks", id: taskId }],
    }),
    deleteTask: build.mutation<void, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: 'Tasks', id: taskId }
      ],
    }),
 
    updateTaskStatus: build.mutation<Task, { taskId: number; status: string; updatedBy: number }>({
      query: ({ taskId, status, updatedBy }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status, updatedBy },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    updateProjectStatus: build.mutation<ProjectType, { projectId: number; status: string }>({
      query: ({ projectId, status }) => ({
        url: `projects/${projectId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Projects", id: projectId },
      ],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    deleteUser: build.mutation<void, string>({
      query: (email) => ({
        url: `users/${email}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
   }),

   updateUserRole: build.mutation<void, { userId: number; role: string }>({
    query: ({ userId, role }) => ({
      url: `users/role/${userId}`, // Match backend route
      method: "PUT", // Change to PUT
      body: { role },
    }),
    invalidatesTags: ["Users"],
  }),
  
  
   
    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation, 
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useUpdateProjectStatusMutation,
  useSearchQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation, 
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetAuthUserQuery,
  useRegisterUserMutation,
} = api;
