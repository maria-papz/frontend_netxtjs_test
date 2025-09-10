"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, Search, UserPlus, UserMinus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
  useGetUsersQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserFollowingQuery
} from "@/redux/services/usersApiSlice";
import { User as UserType } from "@/types/dashboard";

// Use the type from dashboard.ts and extend it with our needs
type User = UserType & {
  is_superuser?: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Use retrieveUser from authApiSlice instead of getCurrentUser
  const { data: currentUser } = useRetrieveUserQuery();

  // Use proper type assertion for query results
  const { data, isLoading, error } = useGetUsersQuery(undefined, {
    refetchOnMountOrArgChange: true
  });
  const users = useMemo(() => (data || []) as User[], [data]);

  // Use proper type assertion for following users
  const { data: followingData, refetch: refetchFollowing } = useGetUserFollowingQuery(undefined, {
    refetchOnMountOrArgChange: true
  });
  const following = useMemo(() => (followingData || []) as User[], [followingData]);

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // State to track loading state for each user
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Local state to track following status to ensure UI updates immediately
  const [localFollowingStatus, setLocalFollowingStatus] = useState<Record<string, boolean>>({});

  // Initialize local following status from API data when it loads
  useEffect(() => {
    if (following.length > 0) {
      const statusMap: Record<string, boolean> = {};
      following.forEach((user: User) => {
        statusMap[user.id] = true;
      });
      setLocalFollowingStatus(statusMap);
    }
  }, [following]);

  // Function to determine if current user is following another user
  const isFollowingUser = (userId: string) => {
    // First check local state for immediate feedback
    if (localFollowingStatus[userId] !== undefined) {
      return localFollowingStatus[userId];
    }
    // Fall back to API data
    return following.some((followedUser: User) => followedUser.id === userId);
  };

  // Handle follow/unfollow actions
  const handleFollowToggle = async (userId: string) => {
    // Prevent actions on own account
    if (currentUser && currentUser.id === userId) {
      toast({
        title: "Action not allowed",
        description: "You cannot follow your own account",
        variant: "destructive"
      });
      return;
    }

    try {
      // Set loading state for this specific user
      setLoadingStates(prev => ({ ...prev, [userId]: true }));

      const isCurrentlyFollowing = isFollowingUser(userId);

      // Update local state immediately for responsive UI
      setLocalFollowingStatus(prev => ({
        ...prev,
        [userId]: !isCurrentlyFollowing
      }));

      if (isCurrentlyFollowing) {
        await unfollowUser(userId).unwrap();
        toast({
          title: "Success",
          description: "User unfollowed successfully"
        });
      } else {
        await followUser(userId).unwrap();
        toast({
          title: "Success",
          description: "User followed successfully"
        });
      }

      // Refresh the following list after action completes
      refetchFollowing();

    } catch {
      // Revert local state on error
      setLocalFollowingStatus(prev => ({
        ...prev,
        [userId]: isFollowingUser(userId)
      }));

      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Could not load users",
        variant: "destructive"
      });
    }
  }, [error]);

  // Filter users based on search query
  const filteredUsers = users.filter((user: User) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
        </div>
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users table card */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Users
              </CardTitle>
              <CardDescription>
                {isLoading ? "Loading users..." : `${filteredUsers.length} users found`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="w-[240px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  // User rows
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name}%20${user.last_name}`}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-secondary via-secondary to-tertiary opacity-65 text-white">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.first_name} {user.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.is_superuser
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {user.is_superuser ? "Admin" : "User"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Activity button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5"
                            onClick={() => router.push(`/dashboard/users/${user.id}/activity`)}
                          >
                            <Activity className="h-3.5 w-3.5" />
                            <span>Activity</span>
                          </Button>

                          {/* Follow/Unfollow button (only for other users) */}
                          {currentUser && currentUser.id !== user.id && (
                            <Button
                              size="sm"
                              variant={isFollowingUser(user.id) ? "destructive" : "secondary"}
                              className="flex items-center gap-1.5"
                              disabled={loadingStates[user.id]}
                              onClick={() => handleFollowToggle(user.id)}
                            >
                              {loadingStates[user.id] ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              ) : isFollowingUser(user.id) ? (
                                <UserMinus className="h-3.5 w-3.5" />
                              ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                              )}
                              <span>{isFollowingUser(user.id) ? "Unfollow" : "Follow"}</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No results row
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found matching your search
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
