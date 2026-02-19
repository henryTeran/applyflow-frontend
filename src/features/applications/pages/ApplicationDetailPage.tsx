import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApplication } from "../hooks";
import { useTimeline, useCreateTimelineEvent } from "../../timeline/hooks";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Badge } from "../../../shared/components/ui/badge";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { ArrowLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);

  const { data: application, isLoading: appLoading } = useApplication(appId);
  const { data: timeline, isLoading: timelineLoading } = useTimeline(appId);
  const createEvent = useCreateTimelineEvent();

  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent.mutateAsync({
      applicationId: appId,
      data: {
        event_type: eventType,
        description,
        event_date: eventDate,
      },
    });
    setEventType("");
    setDescription("");
    setEventDate(new Date().toISOString().split("T")[0]);
  };

  if (appLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!application) {
    return <div>Candidature non trouvée</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/applications")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          Candidature #{application.id}
        </motion.h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              <Badge
                variant={
                  application.status === "confirmed"
                    ? "default"
                    : application.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {application.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Canal</p>
              <p>{application.channel}</p>
            </div>
            {application.portal_type && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portail</p>
                <p>{application.portal_type}</p>
              </div>
            )}
            {application.reference_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Référence</p>
                <p>{application.reference_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Soumise par</p>
              <p>{application.submitted_by}</p>
            </div>
            {application.sent_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Envoyée le</p>
                <p>{new Date(application.sent_at).toLocaleString()}</p>
              </div>
            )}
            {application.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{application.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter un événement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Type d'événement</Label>
                <Input
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="Ex: interview, relance, note"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails de l'événement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={createEvent.isPending} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineLoading ? (
            <Skeleton className="h-32" />
          ) : timeline && timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 border-l-2 border-primary pl-4 pb-4 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun événement pour le moment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
