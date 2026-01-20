import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <div className={`hidden lg:block fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile drawer trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-full max-w-xs p-0">
            {/* Mobile navigation menu */}
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <span className="text-white font-bold text-sm">JI</span>
                </div>
                <span className="font-bold text-foreground">Admin</span>
              </div>
              <nav className="flex flex-col gap-2">
                <a href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Dashboard</a>
                <a href="/admin/jobs" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Jobs</a>
                <a href="/admin/users" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Users</a>
                <a href="/admin/profile-fields" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Profile Fields</a>
                <a href="/admin/skills" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Skills</a>
                <a href="/admin/notifications" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Notifications</a>
                <a href="/admin/referrals" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Referrals</a>
                <a href="/admin/crawlers" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Crawlers</a>
                <a href="/admin/analytics" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Analytics</a>
                <a href="/admin/revenue" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Revenue</a>
                <a href="/admin/settings" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Settings</a>
              </nav>
              <div className="mt-4 border-t pt-4">
                <a href="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted block">Exit Admin</a>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Main content area - takes full width, with margin for sidebar on lg+ */}
      <main className={`flex-1 transition-all duration-300 w-full ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="p-4 lg:p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
