import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { Lock, Plus, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UserManagementPage = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [resetPassword, setResetPassword] = useState({ password: "", confirm: "" });

  // Check if current user is admin
  const isAdmin = currentUser?.id === 0;

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.auth.listUsers();
      setUsers(response.users || []);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username.trim() || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newUser.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await api.auth.register(newUser.username.trim(), newUser.password);
      toast.success(`User ${newUser.username} created successfully`);
      setIsAddUserOpen(false);
      setNewUser({ username: "", password: "" });
      loadUsers();
    } catch (error) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await api.auth.deleteUser(userId);
      toast.success(`User ${username} deleted successfully`);
      loadUsers();
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetPassword.password || !resetPassword.confirm) {
      toast.error("Please fill in all fields");
      return;
    }

    if (resetPassword.password !== resetPassword.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (resetPassword.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await api.auth.resetPassword(selectedUserId, resetPassword.password);
      const user = users.find(u => u.id === selectedUserId);
      toast.success(`Password reset for ${user?.username || 'user'}`);
      setIsResetPasswordOpen(false);
      setResetPassword({ password: "", confirm: "" });
      setSelectedUserId(null);
    } catch (error) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  const openResetPasswordDialog = (userId) => {
    setSelectedUserId(userId);
    setIsResetPasswordOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only administrators can access user management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <UserPlus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {user.username}
                      </h3>
                      {user.id === 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md">
                          Admin
                        </span>
                      )}
                      {user.id === currentUser?.id && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-md">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      User ID: {user.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResetPasswordDialog(user.id)}
                    >
                      <Lock size={14} className="mr-1" />
                      Reset Password
                    </Button>
                    {user.id !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Add New User</h2>
              <p className="text-muted-foreground mt-1">
                Create a new user account
              </p>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 8 characters)"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  <Plus size={16} className="mr-2" />
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddUserOpen(false);
                    setNewUser({ username: "", password: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
              <p className="text-muted-foreground mt-1">
                Set a new password for{" "}
                {users.find(u => u.id === selectedUserId)?.username || "this user"}
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={resetPassword.password}
                  onChange={(e) => setResetPassword({ ...resetPassword, password: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={resetPassword.confirm}
                  onChange={(e) => setResetPassword({ ...resetPassword, confirm: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  <Lock size={16} className="mr-2" />
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    setResetPassword({ password: "", confirm: "" });
                    setSelectedUserId(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
