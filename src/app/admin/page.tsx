import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Users, MessageSquare, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [episodesCount, usersCount, pendingCommentsCount] = await Promise.all([
    supabase
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then((r) => r.count ?? 0),
  ]);

  const stats = [
    {
      label: "Total Episodes",
      value: episodesCount,
      icon: Film,
    },
    {
      label: "Total Users",
      value: usersCount,
      icon: Users,
    },
    {
      label: "Pending Comments",
      value: pendingCommentsCount,
      icon: MessageSquare,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent audit log placeholder */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Connect to Supabase to see recent activity.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
