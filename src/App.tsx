import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import CustomerDashboard from "@/pages/CustomerDashboard"
import SubmitSamplePage from "@/pages/SubmitSamplePage"
import ParcelDetailPage from "@/pages/ParcelDetailPage"
import AdminDashboard from "@/pages/AdminDashboard"
import AdminParcelDetailPage from "@/pages/AdminParcelDetailPage"
import AdminCustomerListPage from "@/pages/AdminCustomerListPage"
import AdminSettingsPage from "@/pages/AdminSettingsPage"
import SuperAdminPage from "@/pages/SuperAdminPage"
import NotFound from "@/pages/NotFound"
import ResetPasswordPage from "@/pages/ResetPasswordPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Supervisor routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-sample"
            element={
              <ProtectedRoute requiredRole="customer">
                <SubmitSamplePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/samples/new"
            element={
              <ProtectedRoute requiredRole="customer">
                <SubmitSamplePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parcel/:id"
            element={
              <ProtectedRoute requiredRole="customer">
                <ParcelDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parcels/:id"
            element={
              <ProtectedRoute requiredRole="customer">
                <ParcelDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/parcel/:id"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminParcelDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/parcels/:id"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminParcelDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminCustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/supervisors"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminCustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin routes */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}