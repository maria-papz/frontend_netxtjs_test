import React, { useState, useEffect } from 'react';
import {
  useGetCurrentUserQuery,
  useGetUsersQuery,
} from "@/redux/services/usersApiSlice";
import {
  useGetIndicatorPermissionsQuery,
  useUpdateIndicatorPermissionsMutation,
} from "@/redux/services/indicatorsApiSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser?: boolean;
}

interface UserPermission {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ACCESS_LEVELS = [
  { value: 'public', label: 'Public Viewing' },
  { value: 'organization', label: 'Organization Internal' },
  { value: 'org_full_public', label: 'Organization Full & Public Viewing' },
  { value: 'restricted', label: 'Restricted Access' },
  { value: 'unrestricted', label: 'Unrestricted Access' }

];

interface PermissionsFormProps {
  indicatorId: string | number;
  onClose?: () => void;
  onSaved?: () => void;
}

const PermissionsForm: React.FC<PermissionsFormProps> = ({ indicatorId, onClose, onSaved }) => {
  const [accessLevel, setAccessLevel] = useState('public');
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // RTK Query hooks
  const { data: currentUserData, isLoading: currentUserLoading } = useGetCurrentUserQuery({});
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({});
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    refetch: refetchPermissions
  } = useGetIndicatorPermissionsQuery(indicatorId);
  const [updatePermissions] = useUpdateIndicatorPermissionsMutation();

  // Derived states
  const currentUser = React.useMemo(() => {
    return currentUserData as CurrentUser | null;
  }, [currentUserData]);
  // Use useMemo to fix dependency issue and ensure we always have an array
  const users = React.useMemo(() => Array.isArray(usersData) ? usersData : [], [usersData]);
  const loading = currentUserLoading || usersLoading || permissionsLoading;

  useEffect(() => {
    if (permissionsData && currentUser && users.length > 0) {
      // Use type assertion to access properties
      const typedPermissionsData = permissionsData as {
        access_level: string;
        user_permissions: UserPermission[];
      };

      setAccessLevel(typedPermissionsData.access_level);

      // Initialize permissions with current user having all permissions
      let permissions = typedPermissionsData.user_permissions || [];

      // If permissions is empty or current user is not in the list, ensure current user has all permissions
      const currentUserPermission = permissions.find((p: UserPermission) => p.user_id === currentUser.id);
      if (!currentUserPermission) {
        permissions = [
          ...permissions,
          {
            user_id: currentUser.id,
            email: currentUser.email,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            can_view: true,
            can_edit: true,
            can_delete: true
          }
        ];
      } else {
        // Make sure current user has all permissions
        permissions = permissions.map((p: UserPermission) =>
          p.user_id === currentUser.id
            ? { ...p, can_view: true, can_edit: true, can_delete: true }
            : p
        );
      }

      setUserPermissions(permissions);
    }

    if (error) {
      setError('Failed to load permissions data. Please try again.');
    }
  }, [permissionsData, currentUser, users, error]);

  // Handle changing access level
  const handleAccessLevelChange = (value: string) => {
    setAccessLevel(value);

    // Initialize permissions for new users when switching to restricted mode
    if (value === 'restricted' && userPermissions.length === 0 && Array.isArray(users)) {
      const initialPermissions: UserPermission[] = users.map((user: User) => ({
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        // Current user should have all permissions
        can_view: currentUser?.id === user.id,
        can_edit: currentUser?.id === user.id,
        can_delete: currentUser?.id === user.id
      }));
      setUserPermissions(initialPermissions);
    } else if (value === 'restricted') {
      // Ensure current user still has all permissions when switching to restricted
      setUserPermissions(perms => perms.map((p: UserPermission) =>
        p.user_id === currentUser?.id
          ? { ...p, can_view: true, can_edit: true, can_delete: true }
          : p
      ));
    }
  };

  // Toggle permission for a user
  const togglePermission = (userId: number, permission: 'can_view' | 'can_edit' | 'can_delete') => {
    setUserPermissions(prevPermissions =>
      prevPermissions.map((perm: UserPermission) => {
        // Don't allow changing current user's permissions
        if (perm.user_id === currentUser?.id) {
          return { ...perm, can_view: true, can_edit: true, can_delete: true };
        }

        if (perm.user_id === userId) {
          const updated = { ...perm, [permission]: !perm[permission] };

          // If turning off view permission, automatically disable edit and delete
          if (permission === 'can_view' && perm.can_view && !updated.can_view) {
            updated.can_edit = false;
            updated.can_delete = false;
          }

          return updated;
        }
        return perm;
      })
    );
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const data = {
        access_level: accessLevel,
        user_permissions: accessLevel === 'restricted' ? userPermissions : []
      };

      await updatePermissions({
        id: indicatorId,
        data
      }).unwrap();

      toast({
        title: "Permissions updated",
        description: "The access level and permissions have been updated successfully.",
      });

      // Refresh permissions data
      await refetchPermissions();

      // Call onSaved callback if provided
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to update permissions. Please try again.');

      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-6 shadow-sm">
          <AlertTitle className="font-medium">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 bg-white/50 dark:bg-zinc-900 p-6 rounded-lg shadow-sm border dark:border-zinc-500">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Access Control</h3>

        <div className="space-y-3">
          <Label htmlFor="access-level" className="text-sm font-medium">Access Level</Label>
          <Select
            value={accessLevel}
            onValueChange={handleAccessLevelChange}
          >
            <SelectTrigger id="access-level" className="w-full bg-white dark:bg-black">
              <SelectValue placeholder="Select an access level" />
            </SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-3 p-3 bg-secondary/20 rounded-md border border-secondary">
            <p className="text-sm text-secondary">
              {accessLevel === 'public' && '👥 Anyone can view this indicator.'}
              {accessLevel === 'organization' && '🏢 Only members of your organization can view this indicator.'}
              {accessLevel === 'org_full_public' && '🌐 Organization members can edit while the public can view.'}
              {accessLevel === 'restricted' && '🔒 Access is restricted to specific users with assigned permissions.'}
              {accessLevel === 'unrestricted' && '🔓 All users have full access to this indicator.'}
            </p>
          </div>
        </div>
      </div>

      {accessLevel === 'restricted' && (
        <div className="space-y-4 bg-white/50 dark:bg-zinc-900 p-6 rounded-lg shadow-sm border dark:border-zinc-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">User Permissions</h3>
            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 px-4 py-2 rounded-md border shadow-sm">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Select All:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="select-all-view"
                    className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    checked={userPermissions.every((p: UserPermission) => p.can_view)}
                    onCheckedChange={(checked) => {
                      const newValue = Boolean(checked);
                      setUserPermissions(prevPermissions =>
                        prevPermissions.map(perm => ({
                          ...perm,
                          can_view: perm.user_id === currentUser?.id ? true : newValue,
                          can_edit: perm.user_id === currentUser?.id ? true : (newValue ? perm.can_edit : false),
                          can_delete: perm.user_id === currentUser?.id ? true : (newValue ? perm.can_delete : false)
                        }))
                      );
                    }}
                  />
                  <span className="text-xs">View</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="select-all-edit"
                    className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    checked={userPermissions.every((p: UserPermission) => p.can_edit)}
                    onCheckedChange={(checked) => {
                      const newValue = Boolean(checked);
                      setUserPermissions(prevPermissions =>
                        prevPermissions.map((perm: UserPermission) => ({
                          ...perm,
                          can_edit: perm.user_id === currentUser?.id ? true : (newValue && perm.can_view),
                          can_view: perm.user_id === currentUser?.id ? true : (perm.can_view || newValue)
                        }))
                      );
                    }}
                    disabled={!userPermissions.some((p: UserPermission) => p.can_view)}
                  />
                  <span className="text-xs">Edit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="select-all-delete"
                    className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    checked={userPermissions.every((p: UserPermission) => p.can_delete)}
                    onCheckedChange={(checked) => {
                      const newValue = Boolean(checked);
                      setUserPermissions(prevPermissions =>
                        prevPermissions.map((perm: UserPermission) => ({
                          ...perm,
                          can_delete: perm.user_id === currentUser?.id ? true : (newValue && perm.can_view),
                          can_view: perm.user_id === currentUser?.id ? true : (perm.can_view || newValue)
                        }))
                      );
                    }}
                    disabled={!userPermissions.some((p: UserPermission) => p.can_view)}
                  />
                  <span className="text-xs">Delete</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-md mt-4">
            <div className="p-3 border-b bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-500">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-black px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:secondary/40 focus:ring-offset-2 pl-9"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    if (!searchTerm && Array.isArray(users)) {
                      setUserPermissions(
                        users.map((user: User) => {
                          const existingPerm = userPermissions.find((p: UserPermission) => p.user_id === user.id);
                          return existingPerm || {
                            user_id: user.id,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            can_view: user.id === currentUser?.id,
                            can_edit: user.id === currentUser?.id,
                            can_delete: user.id === currentUser?.id
                          };
                        })
                      );
                    } else {
                      setUserPermissions(prevPermissions =>
                        prevPermissions.filter(
                          (user: UserPermission) =>
                            user.email.toLowerCase().includes(searchTerm) ||
                            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm)
                        )
                      );
                    }
                  }}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-black z-10">
                  <TableRow className="bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <TableHead className="w-[250px] py-3 font-semibold">User</TableHead>
                    <TableHead className="text-center py-3 font-semibold">View</TableHead>
                    <TableHead className="text-center py-3 font-semibold">Edit</TableHead>
                    <TableHead className="text-center py-3 font-semibold">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPermissions.length > 0 ? (
                    userPermissions.map((permission, index) => (
                      <TableRow
                        key={permission.user_id}
                        className={`${index % 2 === 0 ? "bg-white hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950" : "bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-50 dark:hover:bg-zinc-950"} ${permission.user_id === currentUser?.id ? "bg-secondary/10" : ""}`}
                      >
                        <TableCell className="py-3">
                          <div>
                            <div className="font-medium text-zinc-800 dark:text-zinc-200">
                              {permission.email}
                              {permission.user_id === currentUser?.id && <span className="ml-2 text-xs font-bold text-secondary">(You)</span>}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-white">
                              {permission.first_name} {permission.last_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_view}
                            onCheckedChange={() => togglePermission(permission.user_id, 'can_view')}
                            id={`view-${permission.user_id}`}
                            className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                            disabled={permission.user_id === currentUser?.id}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_edit}
                            onCheckedChange={() => togglePermission(permission.user_id, 'can_edit')}
                            id={`edit-${permission.user_id}`}
                            disabled={!permission.can_view || permission.user_id === currentUser?.id}
                            className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_delete}
                            onCheckedChange={() => togglePermission(permission.user_id, 'can_delete')}
                            id={`delete-${permission.user_id}`}
                            disabled={!permission.can_view || permission.user_id === currentUser?.id}
                            className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-gray-500 dark:text-white">
                        No users available for permissions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={saving} className="px-5">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-5 bg-secondary dark:bg-secondary hover:bg-secondary/70 dark:hover:bg-secondary/70 text-white dark:text-white"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
};

export default PermissionsForm;
