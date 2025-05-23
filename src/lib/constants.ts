
export const APP_NAME = "Rivaayat Finance";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  APPLY_LOAN: "/apply-loan", // This will be the new loan application page
  ADMIN_DASHBOARD: "/admin",
  ADMIN_APPLICATION_DETAIL: (id: string) => `/admin/applications/${id}`,
  ADMIN_USERS: "/admin/users", // New route for listing users
};
