'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Users,
  MessageSquare,
  UserCheck,
  Clock,
  Loader2,
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  Shield,
  XCircle,
  Ban,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function AdminPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth and admin role
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();

        if (meData.user.role !== 'ADMIN') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/chat');
          return;
        }

        setUser(meData.user);
        await loadUsers();
        await loadAnalytics();
        setIsLoading(false);
      } catch (error) {
        console.error('Init error:', error);
        router.push('/login');
      }
    };

    init();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    setIsProcessing(userId);

    try {
      const endpoint = `/api/admin/users/${userId}/${action}`;
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        await loadUsers();
        await loadAnalytics();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'APPROVED':
        return 'bg-emerald-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'SUSPENDED':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeTab !== 'all' && u.status !== activeTab) return false;
    const search = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.employeeId.toLowerCase().includes(search)
    );
  });

  const StatCard = ({ icon: Icon, title, value, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <TrendingUp className="inline h-3 w-3 mr-1 text-emerald-600" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users and monitor platform activity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {user?.name}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/chat')}
              title="Go to Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              icon={Users}
              title="Total Users"
              value={analytics.users.total}
            />
            <StatCard
              icon={Clock}
              title="Pending Approval"
              value={analytics.users.pending}
              trend={`${analytics.users.pending} waiting`}
            />
            <StatCard
              icon={UserCheck}
              title="Active Users"
              value={analytics.users.approved}
              trend={`${analytics.users.online} online now`}
            />
            <StatCard
              icon={MessageSquare}
              title="Total Messages"
              value={analytics.messages.total}
              trend={`${analytics.messages.recentMessages} this week`}
            />
          </div>
        )}

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Approve, reject, suspend, or reactivate users</CardDescription>
              </div>
              <Button variant="outline" onClick={loadUsers}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-4">
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <Separator />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending {analytics?.users.pending > 0 && `(${analytics.users.pending})`}
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({analytics?.users.approved})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({analytics?.users.rejected})
                  </TabsTrigger>
                  <TabsTrigger value="suspended">
                    Suspended ({analytics?.users.suspended})
                  </TabsTrigger>
                  <TabsTrigger value="all">All Users</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <ScrollArea className="h-[600px]">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={u.profilePicture} />
                                <AvatarFallback>
                                  {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{u.name}</h3>
                                  <Badge className={getStatusColor(u.status)}>{u.status}</Badge>
                                  {u.isOnline && (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                                      Online
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span>ID: {u.employeeId}</span>
                                  <span>{u.department}</span>
                                  <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {u.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction(u.id, 'approve')}
                                    disabled={isProcessing === u.id}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    {isProcessing === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleAction(u.id, 'reject')}
                                    disabled={isProcessing === u.id}
                                  >
                                    {isProcessing === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                              {u.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleAction(u.id, 'suspend')}
                                  disabled={isProcessing === u.id}
                                >
                                  {isProcessing === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Ban className="mr-2 h-4 w-4" />
                                      Suspend
                                    </>
                                  )}
                                </Button>
                              )}
                              {u.status === 'SUSPENDED' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(u.id, 'reactivate')}
                                  disabled={isProcessing === u.id}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {isProcessing === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Reactivate
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}