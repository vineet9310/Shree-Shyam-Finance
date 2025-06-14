// src/lib/constants.ts

export const APP_NAME = "Shree Shyam Finance";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  APPLY_LOAN: "/apply-loan",
  ADMIN_DASHBOARD: "/admin",
  ADMIN_APPLICATION_DETAIL: (id: string) => `/admin/applications/${id}`,
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_PAYMENT_VERIFICATIONS: "/admin/payment-verifications", // New route for admin
  USER_APPLICATION_DETAIL: (id: string) => `/dashboard/application/${id}`, 
  FORGOT_PASSWORD: '/forgot-password',
};
