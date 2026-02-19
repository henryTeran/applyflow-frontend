import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApplications } from "../hooks";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Badge } from "../../../shared/components/ui/badge";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export function ApplicationsListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: applications, isLoading } = useApplications();

  const filteredApplications = applications?.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-3xl font-bold"
      >
        Mes candidatures
      </motion.h1>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredApplications?.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        Candidature #{app.id}
                      </h3>
                      <Badge
                        variant={
                          app.status === "confirmed"
                            ? "default"
                            : app.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>Canal: {app.channel}</p>
                      {app.portal_type && <p>Portail: {app.portal_type}</p>}
                      {app.reference_number && (
                        <p>Référence: {app.reference_number}</p>
                      )}
                      <p>
                        Créée le {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredApplications?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune candidature trouvée</p>
        </div>
      )}
    </div>
  );
}
