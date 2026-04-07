import React, { useState, useEffect } from 'react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import {
  User,
  Bell,
  Moon,
  LogOut,
  Shield,
  Mail,
  Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`${checked ? 'Dark' : 'Light'} mode enabled`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Settings" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Resident User</h3>
                  <p className="text-sm text-muted-foreground">
                    resident@example.com
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Resident User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="resident@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit Number</Label>
                  <Input id="unit" defaultValue="A-501" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+91 98765 43210" />
                </div>
              </div>

              <Button className="w-full md:w-auto">Save Changes</Button>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="email-notif" className="cursor-pointer">
                      Email Notifications
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="push-notif" className="cursor-pointer">
                      Push Notifications
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="complaint-notif" className="cursor-pointer">
                    Complaint Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your complaints are updated
                  </p>
                </div>
                <Switch
                  id="complaint-notif"
                  checked={complaintUpdates}
                  onCheckedChange={setComplaintUpdates}
                />
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="cursor-pointer">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Switch to dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
            </div>
          </section>

          {/* Logout Section */}
          <section>
            <div className="bg-card border border-destructive/30 rounded-xl p-6">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </section>

          {/* App Info */}
          <div className="text-center text-sm text-muted-foreground pb-8">
            <p>Society Hub v1.0.0</p>
            <p className="mt-1">© 2026 Smart Society Management System</p>
          </div>
        </div>
      </main>
    </div>
  );
}
