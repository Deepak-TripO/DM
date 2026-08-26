import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider } from '@/hooks/useTheme';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { Loader2 } from 'lucide-react';

// Helper to automatically recover from stale chunk 404 errors after new Vercel deployments
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = window.sessionStorage.getItem('page-refreshed-on-chunk-error');
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem('page-refreshed-on-chunk-error');
      return component;
    } catch (error) {
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('page-refreshed-on-chunk-error', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Lazy load pages with automatic retry on 404 chunk error
const LoginPage = lazyRetry(() => import('@/features/auth/LoginPage'));
const SignupPage = lazyRetry(() => import('@/features/auth/SignupPage'));
const ForgotPasswordPage = lazyRetry(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyRetry(() => import('@/features/auth/ResetPasswordPage'));
const HomePage = lazyRetry(() => import('@/pages/HomePage'));
const TasksPage = lazyRetry(() => import('@/pages/TasksPage'));
const FilesPage = lazyRetry(() => import('@/pages/FilesPage'));
const RecentPage = lazyRetry(() => import('@/pages/RecentPage'));
const StarredPage = lazyRetry(() => import('@/pages/StarredPage'));
const SharedPage = lazyRetry(() => import('@/pages/SharedPage'));
const TrashPage = lazyRetry(() => import('@/pages/TrashPage'));
const ProfilePage = lazyRetry(() => import('@/pages/ProfilePage'));
const SettingsPage = lazyRetry(() => import('@/pages/SettingsPage'));
const SharePage = lazyRetry(() => import('@/pages/SharePage'));
const AdminLayout = lazyRetry(() => import('@/layouts/AdminLayout'));
const AdminOverview = lazyRetry(() => import('@/pages/admin/AdminOverview'));
const AdminUsers = lazyRetry(() => import('@/pages/admin/AdminUsers'));
const AdminStorage = lazyRetry(() => import('@/pages/admin/AdminStorage'));
const AdminFiles = lazyRetry(() => import('@/pages/admin/AdminFiles'));
const AdminShares = lazyRetry(() => import('@/pages/admin/AdminShares'));
const AdminActivity = lazyRetry(() => import('@/pages/admin/AdminActivity'));
const AdminCategories = lazyRetry(() => import('@/pages/admin/AdminCategories'));
const AdminTasks = lazyRetry(() => import('@/pages/admin/AdminTasks'));
const AdminSettings = lazyRetry(() => import('@/pages/admin/AdminSettings'));

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
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="tasks/:taskId" element={<TasksPage />} />
                  <Route path="home" element={<HomePage />} />
                  <Route path="files" element={<FilesPage />} />
                  <Route path="folders" element={<Navigate to="/tasks" replace />} />
                  <Route path="folders/:folderId" element={<Navigate to="/tasks" replace />} />
                  <Route path="recent" element={<RecentPage />} />
                  <Route path="starred" element={<Navigate to="/home" replace />} />
                  <Route path="shared" element={<SharedPage />} />
                  <Route path="trash" element={<TrashPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<Navigate to="/profile" replace />} />
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
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="tasks" element={<AdminTasks />} />
                  <Route path="folders" element={<Navigate to="/admin/tasks" replace />} />
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
