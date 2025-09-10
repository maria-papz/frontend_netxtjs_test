"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import components to reduce initial loading cost
const FollowedActivity = dynamic(() => import("@/components/user-activity/followed-activity"), {
  ssr: false,
  loading: () => <LoadingCard title="Followed Users Activity" description="Loading activity data..." />
});

const FavoritesActivity = dynamic(() => import("@/components/user-activity/favorites-activity"), {
  ssr: false,
  loading: () => <LoadingCard title="Indicator Activity" description="Loading activity data..." />
});

const LatestWorkflowGraph = dynamic(() => import("@/components/dashboard/latest-workflow-graph"), {
  ssr: false,
  loading: () => (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Workflow Data Visualization</CardTitle>
        <CardDescription>Loading latest workflow data...</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[320px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </CardContent>
    </Card>
  )
});

// Loading card component
const LoadingCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="col-span-1 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-center h-[320px]">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  return (
    <div className="container mx-auto py-10 p-2 md:p-10 text-pretty flex flex-col">
      <h1 className="text-3xl pb-5 font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-secondary">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Followed Users Latest Activity */}
        <Suspense fallback={<LoadingCard title="Followed Users Activity" description="Loading activity data..." />}>
          <FollowedActivity limit={5} dashboardView={true} />
        </Suspense>

        {/* Favorite Indicators Data Updates */}
        <Suspense fallback={<LoadingCard title="Data Updates" description="Loading data activity..." />}>
          <FavoritesActivity type="data" limit={5} dashboardView={true} />
        </Suspense>

        {/* Favorite Indicators Information Updates */}
        <Suspense fallback={<LoadingCard title="Metadata Changes" description="Loading metadata changes..." />}>
          <FavoritesActivity type="info" limit={5} dashboardView={true} />
        </Suspense>
      </div>

      {/* Latest Workflow Graph */}
      <Suspense
        fallback={
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="text-lg">Workflow Data Visualization</CardTitle>
              <CardDescription>Loading latest workflow data...</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[320px]">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        }
      >
        <LatestWorkflowGraph />
      </Suspense>
    </div>
  );
};

export default Dashboard;
