import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { BookingsPage, CourtsPage, LoginPage } from "@/pages";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col">
        <Routes>
          <Route element={<AuthGate requireAuth={false} />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<AuthGate requireAuth />}>
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  );
}
