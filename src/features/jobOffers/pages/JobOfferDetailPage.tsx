import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AxiosError } from "axios";
import { useJobOffer } from "../hooks";
import { useJobMatch, useAnalyzeJobMatch } from "../../jobMatches/hooks";
import { useDraft, useGenerateDraft, useUpdateDraft, useSendDraft } from "../../drafts/hooks";
import { useUser } from "../../users/hooks";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { ArrowLeft, Sparkles, FileText, AlertCircle, FileCheck, Send, Save } from "lucide-react";
import { motion } from "framer-motion";

export function JobOfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "match">("details");

  const jobId = Number(id);
  const { data: offer, isLoading: offerLoading } = useJobOffer(jobId);
  const { data: match, isLoading: matchLoading } = useJobMatch(jobId);
  const { data: draft, isLoading: draftLoading } = useDraft(jobId);
  const { data: user } = useUser();
  const analyzeMatch = useAnalyzeJobMatch();
  const generateDraft = useGenerateDraft();
  const updateDraft = useUpdateDraft();
  const sendDraft = useSendDraft();

  // States pour l'édition du draft
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [editedEmailSubject, setEditedEmailSubject] = useState("");
  const [editedEmailBody, setEditedEmailBody] = useState("");

  const handleAnalyze = async () => {
    // Avertir si pas de CV
    if (!user?.cv_file_path && !user?.cv_path && !user?.cv_text) {
      const confirmed = window.confirm(
        "Vous n'avez pas encore uploadé votre CV.\n\n" +
        "Le match sera calculé avec un profil générique, ce qui peut réduire la précision de l'analyse.\n\n" +
        "Voulez-vous continuer quand même ?\n\n" +
        "💡 Astuce : Uploadez votre CV dans Paramètres pour des résultats plus précis."
      );
      if (!confirmed) return;
    }
    
    try {
      await analyzeMatch.mutateAsync(jobId);
    } catch (error: unknown) {
      // Gérer erreur 400 "CV required"
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError?.response?.status === 400) {
        const message = axiosError?.response?.data?.detail || "Une erreur est survenue";
        if (message.toLowerCase().includes("cv") || message.toLowerCase().includes("upload")) {
          if (window.confirm(
            "❌ Erreur : Vous devez d'abord uploader votre CV.\n\n" +
            "Cliquez sur OK pour aller dans Paramètres."
          )) {
            navigate("/settings");
          }
          return;
        }
      }
      console.error("Analyze error:", error);
      alert("Erreur lors de l'analyse");
    }
  };

  const handleGenerateDraft = async () => {
    // Vérifier si CV uploadé
    if (!user?.cv_file_path && !user?.cv_path && !user?.cv_text) {
      if (window.confirm(
        "❌ Vous devez d'abord uploader votre CV pour générer une lettre de motivation.\n\n" +
        "Cliquez sur OK pour aller dans Paramètres."
      )) {
        navigate("/settings");
      }
      return;
    }
    
    try {
      await generateDraft.mutateAsync(jobId);
    } catch (error: unknown) {
      // Gérer erreur 400 "CV required"
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError?.response?.status === 400) {
        const message = axiosError?.response?.data?.detail || "Une erreur est survenue";
        if (message.toLowerCase().includes("cv") || message.toLowerCase().includes("upload")) {
          if (window.confirm(
            "❌ Erreur : Vous devez d'abord uploader votre CV.\n\n" +
            "Cliquez sur OK pour aller dans Paramètres."
          )) {
            navigate("/settings");
          }
          return;
        }
      }
      console.error("Generate draft error:", error);
      alert("Erreur lors de la génération");
    }
  };

  const handleEditDraft = () => {
    if (draft) {
      setEditedCoverLetter(draft.cover_letter_text || "");
      setEditedEmailSubject(draft.email_subject || "");
      setEditedEmailBody(draft.email_body || "");
      setIsEditingDraft(true);
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return;

    try {
      await updateDraft.mutateAsync({
        id: draft.id,
        data: {
          cover_letter_text: editedCoverLetter,
          email_subject: editedEmailSubject,
          email_body: editedEmailBody,
        },
      });
      setIsEditingDraft(false);
      alert("Brouillon sauvegardé !");
    } catch (error) {
      console.error("Save draft error:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDraft(false);
  };

  const handleSendApplication = async () => {
    if (!draft) return;

    if (!window.confirm(
      "Êtes-vous sûr de vouloir envoyer cette candidature ?\n\n" +
      "Cette action ne peut pas être annulée."
    )) {
      return;
    }

    try {
      await sendDraft.mutateAsync(draft.id);
      alert("Candidature envoyée avec succès !");
      navigate("/applications");
    } catch (error) {
      console.error("Send application error:", error);
      alert("Erreur lors de l'envoi");
    }
  };

  if (offerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!offer) {
    return <div>Offre non trouvée</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          {offer.title}
        </motion.h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Détails
        </button>
        <button
          onClick={() => setActiveTab("match")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "match"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Match & Draft
        </button>
      </div>

      {activeTab === "details" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entreprise</p>
                <p className="text-lg">{offer.company}</p>
              </div>
              {offer.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localisation</p>
                  <p className="text-lg">{offer.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Source</p>
                <Badge variant="outline">{offer.source}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type de candidature</p>
                <Badge variant="secondary">{offer.application_type}</Badge>
              </div>
              {offer.url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lien</p>
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {offer.url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {offer.raw_description}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === "match" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analyse de correspondance</CardTitle>
                  <div className="mt-2">
                    {(user?.cv_file_path || user?.cv_path || user?.cv_text) ? (
                      <Badge variant="default" className="bg-green-600">
                        <FileCheck className="w-3 h-3 mr-1" />
                        CV uploadé - Analyse précise
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Analyse générique (uploadez votre CV)
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMatch.isPending}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {analyzeMatch.isPending ? "Analyse..." : "Analyser"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {matchLoading ? (
                <Skeleton className="h-32" />
              ) : match ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score</p>
                    <div className="flex items-center gap-2">
                      <div className="text-4xl font-bold">{match.score}%</div>
                      <div
                        className={`h-2 flex-1 rounded-full bg-gradient-to-r ${
                          match.score >= 70
                            ? "from-green-500 to-green-600"
                            : match.score >= 50
                            ? "from-yellow-500 to-yellow-600"
                            : "from-red-500 to-red-600"
                        }`}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                  </div>
                  {match.reasons && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Raisons</p>
                      <p className="text-sm">{match.reasons}</p>
                    </div>
                  )}
                  {match.skills_detected && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Compétences détectées</p>
                      <p className="text-sm">{match.skills_detected}</p>
                    </div>
                  )}
                  {match.red_flags && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Points d'attention</p>
                      <p className="text-sm text-destructive">{match.red_flags}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune analyse disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lettre de motivation</CardTitle>
                <div className="flex gap-2">
                  {draft && !isEditingDraft && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleEditDraft}
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Éditer
                      </Button>
                      <Button
                        onClick={handleSendApplication}
                        disabled={sendDraft.isPending}
                        size="sm"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendDraft.isPending ? "Envoi..." : "Envoyer"}
                      </Button>
                    </>
                  )}
                  {!draft && (
                    <Button
                      onClick={handleGenerateDraft}
                      disabled={generateDraft.isPending}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {generateDraft.isPending ? "Génération..." : "Générer"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {draftLoading ? (
                <Skeleton className="h-32" />
              ) : draft ? (
                <div className="space-y-4">
                  {!isEditingDraft ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Statut</p>
                        <Badge>{draft.status}</Badge>
                      </div>
                      
                      {draft.email_subject && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Sujet</p>
                          <p className="text-sm">{draft.email_subject}</p>
                        </div>
                      )}
                      
                      {draft.email_body && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Corps de l'email</p>
                          <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                            {draft.email_body}
                          </div>
                        </div>
                      )}
                      
                      {draft.cover_letter_text && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Lettre de motivation</p>
                          <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                            {draft.cover_letter_text}
                          </div>
                        </div>
                      )}
                      
                      {draft.cover_letter_pdf_path && (
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(draft.cover_letter_pdf_path || "", "_blank")}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ouvrir PDF
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email_subject">Sujet de l'email</Label>
                        <Input
                          id="email_subject"
                          value={editedEmailSubject}
                          onChange={(e) => setEditedEmailSubject(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email_body">Corps de l'email</Label>
                        <Textarea
                          id="email_body"
                          value={editedEmailBody}
                          onChange={(e) => setEditedEmailBody(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cover_letter">Lettre de motivation</Label>
                        <Textarea
                          id="cover_letter"
                          value={editedCoverLetter}
                          onChange={(e) => setEditedCoverLetter(e.target.value)}
                          className="min-h-[300px]"
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleSaveDraft}
                          disabled={updateDraft.isPending}
                        >
                          {updateDraft.isPending ? "Sauvegarde..." : "Sauvegarder"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun brouillon disponible</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
