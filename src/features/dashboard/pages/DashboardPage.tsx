import { useJobOffers } from "../../jobOffers/hooks";
import { useApplications } from "../../applications/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Briefcase, FileText, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardPage() {
  const { data: jobOffers, isLoading: offersLoading } = useJobOffers();
  const { data: applications, isLoading: appsLoading } = useApplications();

  const stats = [
    {
      name: "Offres enregistrées",
      value: jobOffers?.length || 0,
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      name: "Candidatures totales",
      value: applications?.length || 0,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      name: "En attente",
      value: applications?.filter((a) => a.status === "pending").length || 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      name: "Confirmées",
      value: applications?.filter((a) => a.status === "confirmed").length || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  if (offersLoading || appsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold"
      >
        Dashboard
      </motion.h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader>
          <CardTitle>Candidatures récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">Application #{app.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        app.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : app.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune candidature pour le moment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
