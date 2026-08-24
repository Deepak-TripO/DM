import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider } from '@/hooks/useTheme';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const FilesPage = lazy(() => import('@/pages/FilesPage'));
const RecentPage = lazy(() => import('@/pages/RecentPage'));
const StarredPage = lazy(() => import('@/pages/StarredPage'));
const SharedPage = lazy(() => import('@/pages/SharedPage'));
const TrashPage = lazy(() => import('@/pages/TrashPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SharePage = lazy(() => import('@/pages/SharePage'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminStorage = lazy(() => import('@/pages/admin/AdminStorage'));
const AdminFiles = lazy(() => import('@/pages/admin/AdminFiles'));
const AdminShares = lazy(() => import('@/pages/admin/AdminShares'));
const AdminActivity = lazy(() => import('@/pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/share/:token" element={<SharePage />} />

                {/* Normal User Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<HomePage />} />
                  <Route path="files" element={<FilesPage />} />
                  <Route path="recent" element={<RecentPage />} />
                  <Route path="starred" element={<StarredPage />} />
                  <Route path="shared" element={<SharedPage />} />
                  <Route path="trash" element={<TrashPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Administration Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="storage" element={<AdminStorage />} />
                  <Route path="files" element={<AdminFiles />} />
                  <Route path="shared-links" element={<AdminShares />} />
                  <Route path="shares" element={<Navigate to="/admin/shared-links" replace />} />
                  <Route path="activity" element={<AdminActivity />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-light)',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
