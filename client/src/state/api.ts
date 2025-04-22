import Prospects from "@/app/prospects/page";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface ProjectType {
  id: number;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  tasks?: Task[];
}
export interface Prospects {
  id: number;
  name: string;
  status: ProspectsStatus;
  category: string;
  inquiryDate?: string;
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
export enum ProspectsStatus {
  New = "New",
  Dealing = "Dealing",
  QuoteSent = "QuoteSent",
  AgreementSent = "AgreementSent",
  Converted = "Converted",
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
export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  userId: number;
  user?: User;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  user?: User;
  taskId: number;
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
  activityLogs?: ActivityLog[];
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

export interface Category {
  id: number;
  categoryName: string;
  categoryCode?: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
   // Add this to your second API's prepareHeaders function to debug
   prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
  }),
  reducerPath: "api",
  tagTypes: ["Projects", "Prospects", "Tasks", "Users", "Teams", "Comments", "Categories"],
  endpoints: (build) => ({
    registerUser: build.mutation<{ message: string }, Partial<User>>({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    changePassword: build.mutation<
    { message: string },
    { userId: number; currentPassword: string; newPassword: string }
    >({
    query: ({ userId, currentPassword, newPassword }) => ({
      url: `users/${userId}/change-password`,
      method: "POST",
      body: { currentPassword, newPassword },
    }),
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

    getProspects: build.query<Prospects[], { prospectsId?: number }>({
      query: () => "prospects",
      providesTags: ["Prospects"],
    }),


    createCategory: build.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: "categories",
        method: "POST",
        body: category,
      }),
      invalidatesTags: ["Categories"],
    }),
    getCategories: build.query<Category[], void>({
      query: () => "categories",
      providesTags: ["Categories"],
    }),
    updateCategory: build.mutation<
      Category,
      { id: number; categoryData: Partial<Category> }
    >({
      query: ({ id, categoryData }) => ({
        url: `categories/${id}`,
        method: "PUT",
        body: categoryData,
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: build.mutation<void, number>({
      query: (id) => ({
        url: `categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteMultipleCategories: build.mutation<void, number[]>({
      query: (ids) => ({
        url: "categories",
        method: "DELETE",
        body: { ids },
      }),
      invalidatesTags: ["Categories"],
    }),



     
    createProject: build.mutation<ProjectType, Partial<ProjectType>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),

    deleteProject: build.mutation<void, number>({
      query: (projectId) => ({
        url: `projects/${projectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),

updateProject: build.mutation<ProjectType, { projectId: number; name?: string; description?: string; startDate?: string; endDate?: string }>({
  query: ({ projectId, ...body }) => ({
    url: `projects/${projectId}`,
    method: 'PUT',
    body,
  }),
  invalidatesTags: ['Projects'],
}),

    createProspects: build.mutation<Prospects, Partial<Prospects>>({
      query: (prospects) => ({
        url: "prospects",
        method: "POST",
        body: prospects,
      }),
      invalidatesTags: ["Prospects"],
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
    getTasksByUserIdForProfile: build.query<Task[], number>({
      query: (userId) => `tasks/profile/${userId}`,
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
      invalidatesTags: ["Tasks", "Projects"],
    }),
    updateTask: build.mutation<Task, { taskId: number; taskData: Partial<Task> }>({
      query: ({ taskId, taskData }) => ({
        url: `tasks/${taskId}`,
        method: "PUT",
        body: taskData, // taskData can still include assignedBy if needed
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Tasks", id: taskId },
        { type: "Projects" },
      ],
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

    // Add to your endpoints in api.ts
getTaskComments: build.query<Comment[], number>({
  query: (taskId) => `tasks/${taskId}/comments`,
  providesTags: (result, error, taskId) => [
    { type: 'Comments', id: taskId }
  ],
}),
addCommentToTask: build.mutation<Comment, { taskId: number; content: string; userId: number }>({
  query: ({ taskId, content, userId }) => ({
    url: `tasks/${taskId}/comments`,
    method: 'POST',
    body: { content, userId },
  }),
  invalidatesTags: (result, error, { taskId }) => [
    { type: 'Comments', id: taskId }
  ],
}),

    deleteProspects: build.mutation<void, number>({
      query: (prospectId) => ({
        url: `prospects/${prospectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, prospectId) => [
        { type: 'Prospects', id: prospectId }
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
    updateProspect: build.mutation<Prospects, { 
      prospectsId: number; 
      name?: string; 
      status?: ProspectsStatus; 
      category?: string; 
      inquiryDate?: string; 
      updatedBy: number // Make `updatedBy` required
    }>({
      query: ({ prospectsId, name, status, category, inquiryDate, updatedBy }) => ({
        url: `prospects/${prospectsId}`,
        method: "PUT",
        body: { name, status, category, inquiryDate, updatedBy },
      }),
      invalidatesTags: (result, error, { prospectsId }) => [
        { type: "Prospects", id: prospectsId }, // Invalidate the specific prospect
        { type: "Prospects", id: "LIST" }, // Invalidate the entire list of prospects
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
  useGetProspectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useCreateProspectsMutation,
  useUpdateTaskMutation,  
  useDeleteProspectsMutation,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useUpdateProjectStatusMutation,
  useUpdateProspectMutation, 
  useSearchQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation, 
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetAuthUserQuery,
  useRegisterUserMutation,
  useGetTasksByUserIdForProfileQuery,
  useChangePasswordMutation,
  useAddCommentToTaskMutation,

    useGetCategoriesQuery,
    useUpdateCategoryMutation,
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useDeleteMultipleCategoriesMutation,
} = api;
