import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobOffers, useDeleteJobOffer } from "../hooks";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Badge } from "../../../shared/components/ui/badge";
import { Plus, Search, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function JobOffersListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: jobOffers, isLoading } = useJobOffers();
  const deleteOffer = useDeleteJobOffer();

  const filteredOffers = jobOffers?.filter(
    (offer) =>
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) {
      await deleteOffer.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          Offres d'emploi
        </motion.h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/offers/quick-apply")} variant="default">
            <Sparkles className="mr-2 h-4 w-4" />
            Candidature Express
          </Button>
          <Button onClick={() => navigate("/offers/new")} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle offre
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par titre ou entreprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOffers?.map((offer, index) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(`/offers/${offer.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{offer.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {offer.company}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(offer.id, e)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {offer.location && (
                    <p className="text-sm text-muted-foreground">
                      📍 {offer.location}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline">{offer.source}</Badge>
                    <Badge variant="secondary">{offer.application_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajoutée le {new Date(offer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredOffers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune offre trouvée</p>
        </div>
      )}
    </div>
  );
}
