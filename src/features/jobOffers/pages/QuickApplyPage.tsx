import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateJobOffer } from "../hooks";
import { useAnalyzeJobMatch } from "../../jobMatches/hooks";
import { useGenerateDraft } from "../../drafts/hooks";
import { useSendDraft } from "../../drafts/hooks";
import { useUser } from "../../users/hooks";
import { apiClient } from "../../../shared/lib/apiClient";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Badge } from "../../../shared/components/ui/badge";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Step = "url" | "scraping" | "matching" | "drafting" | "review" | "sending" | "done";

export function QuickApplyPage() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const createOffer = useCreateJobOffer();
  const analyzeMatch = useAnalyzeJobMatch();
  const generateDraft = useGenerateDraft();
  const sendDraft = useSendDraft();

  const [currentStep, setCurrentStep] = useState<Step>("url");
  const [jobUrl, setJobUrl] = useState("");
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [createdOffer, setCreatedOffer] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrapeAndProcess = async () => {
    if (!jobUrl.trim()) {
      setError("Veuillez entrer une URL");
      return;
    }

    // Vérifier que le CV est uploadé (check both cv_file_path and cv_path for backward compatibility)
    if (!user?.cv_file_path && !user?.cv_path && !user?.cv_text) {
      if (window.confirm(
        "❌ Vous devez d'abord uploader votre CV.\n\nCliquez sur OK pour aller dans Paramètres."
      )) {
        navigate("/settings");
      }
      return;
    }

    setError(null);

    try {
      // ÉTAPE 1: Scraper l'URL
      setCurrentStep("scraping");
      let scraped: any;
      
      try {
        scraped = await apiClient.post<any>("/job-offers/scrape", { url: jobUrl });
      } catch (scrapeError: any) {
        // Si l'endpoint n'existe pas encore (400/404/501), utiliser des données mock
        if (scrapeError?.response?.status === 400 || 
            scrapeError?.response?.status === 404 ||
            scrapeError?.response?.status === 501) {
          console.warn("⚠️ Endpoint /scrape non implémenté - Utilisation de données mock");
          
          // Mock basé sur l'URL
          const urlObj = new URL(jobUrl);
          scraped = {
            title: "Senior Python Developer",
            company: urlObj.hostname.includes("linkedin") ? "TechCorp" : 
                     urlObj.hostname.includes("indeed") ? "StartupXYZ" : "CompanyABC",
            location: "Paris, France",
            description: `We are looking for a talented Senior Python Developer to join our team.

**Requirements:**
- 5+ years experience with Python
- Strong knowledge of FastAPI, Django or Flask
- Experience with PostgreSQL and Redis
- Understanding of REST APIs and microservices
- Familiarity with Docker and CI/CD

**Nice to have:**
- Experience with React/TypeScript
- Knowledge of cloud platforms (AWS, GCP, Azure)
- Previous work on SaaS products

**What we offer:**
- Competitive salary
- Remote work flexibility
- Health insurance
- Professional development budget
- Modern tech stack`,
            application_type: "portal",
            application_url: jobUrl
          };
        } else {
          throw scrapeError;
        }
      }
      
      setScrapedData(scraped);

      // ÉTAPE 2: Créer l'offre
      const offer = await createOffer.mutateAsync({
        title: scraped.title,
        company: scraped.company,
        location: scraped.location || null,
        source: new URL(jobUrl).hostname,
        url: jobUrl,
        application_type: scraped.application_type || "portal",
        application_url: scraped.application_url || jobUrl,
        raw_description: scraped.description,
      });
      setCreatedOffer(offer);

      // ÉTAPE 3: Analyser le match
      setCurrentStep("matching");
      const match = await analyzeMatch.mutateAsync(offer.id);
      setMatchResult(match);

      // Vérifier si le match est acceptable (score >= 50)
      if (match.score < 50) {
        if (!window.confirm(
          `⚠️ Le score de correspondance est faible (${match.score}%).\n\n` +
          `Voulez-vous continuer quand même ?`
        )) {
          setCurrentStep("review");
          return;
        }
      }

      // ÉTAPE 4: Générer le brouillon
      setCurrentStep("drafting");
      const generatedDraft = await generateDraft.mutateAsync(offer.id);
      setDraft(generatedDraft);

      // ÉTAPE 5: Afficher pour review
      setCurrentStep("review");

    } catch (err: any) {
      console.error("Quick apply error:", err);
      setError(err?.response?.data?.detail || "Une erreur est survenue");
      setCurrentStep("url");
    }
  };

  const handleSendApplication = async () => {
    if (!draft) return;

    setCurrentStep("sending");

    try {
      await sendDraft.mutateAsync(draft.id);
      setCurrentStep("done");
    } catch (err: any) {
      console.error("Send error:", err);
      setError(err?.response?.data?.detail || "Erreur lors de l'envoi");
      setCurrentStep("review");
    }
  };

  const handleStartOver = () => {
    setCurrentStep("url");
    setJobUrl("");
    setScrapedData(null);
    setCreatedOffer(null);
    setMatchResult(null);
    setDraft(null);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          Candidature Express
        </motion.h1>
      </div>

      {/* Steps indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { id: "url", label: "URL" },
              { id: "scraping", label: "Analyse" },
              { id: "matching", label: "Match" },
              { id: "drafting", label: "Brouillon" },
              { id: "review", label: "Révision" },
              { id: "sending", label: "Envoi" },
              { id: "done", label: "Terminé" },
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : ["scraping", "matching", "drafting", "review", "sending", "done"].indexOf(currentStep) >
                          ["scraping", "matching", "drafting", "review", "sending", "done"].indexOf(step.id as any)
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep === step.id && !["done"].includes(currentStep) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ["scraping", "matching", "drafting", "sending", "done"].indexOf(currentStep) >=
                      ["scraping", "matching", "drafting", "sending", "done"].indexOf(step.id as any) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className="text-xs mt-1">{step.label}</p>
                </div>
                {index < 6 && <div className="w-12 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: URL Input */}
      {currentStep === "url" && (
        <Card>
          <CardHeader>
            <CardTitle>Entrez l'URL de l'offre d'emploi</CardTitle>
            <CardDescription>
              Copiez-collez le lien de l'offre. Nous allons automatiquement extraire les informations,
              analyser la correspondance avec votre CV, et préparer votre candidature.
            </CardDescription>
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ℹ️ <strong>Mode développement:</strong> L'endpoint de scraping n'est pas encore implémenté au backend. 
                Des données de démonstration seront utilisées pour tester le workflow complet.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL de l'offre</Label>
              <Input
                id="url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/123456789/"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleScrapeAndProcess();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleScrapeAndProcess}
                disabled={!jobUrl.trim()}
                className="flex-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyser et Préparer la Candidature
              </Button>
            </div>

            {!user?.cv_file_path && !user?.cv_path && !user?.cv_text && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  ⚠️ Pensez à uploader votre CV dans{" "}
                  <button
                    onClick={() => navigate("/settings")}
                    className="underline font-medium"
                  >
                    Paramètres
                  </button>{" "}
                  pour une analyse précise.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Processing */}
      {["scraping", "matching", "drafting", "sending"].includes(currentStep) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">
                {currentStep === "scraping" && "Analyse de l'offre en cours..."}
                {currentStep === "matching" && "Calcul de la correspondance..."}
                {currentStep === "drafting" && "Génération de la lettre de motivation..."}
                {currentStep === "sending" && "Envoi de la candidature..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {currentStep === "review" && draft && (
        <div className="space-y-4">
          {/* Match Score */}
          <Card>
            <CardHeader>
              <CardTitle>Score de correspondance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">{matchResult?.score}%</div>
                <div className="flex-1">
                  <div
                    className={`h-4 rounded-full ${
                      matchResult?.score >= 70
                        ? "bg-green-600"
                        : matchResult?.score >= 50
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${matchResult?.score}%` }}
                  />
                </div>
              </div>
              {matchResult?.reasons && (
                <p className="text-sm text-muted-foreground mt-2">{matchResult.reasons}</p>
              )}
            </CardContent>
          </Card>

          {/* Draft Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la candidature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sujet de l'email</Label>
                <p className="text-sm">{draft.email_subject}</p>
              </div>

              <div>
                <Label>Corps de l'email</Label>
                <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {draft.email_body}
                </div>
              </div>

              <div>
                <Label>Lettre de motivation</Label>
                <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {draft.cover_letter_text}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleStartOver} className="flex-1">
                  Recommencer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/offers/${createdOffer?.id}`)}
                  className="flex-1"
                >
                  Modifier le brouillon
                </Button>
                <Button onClick={handleSendApplication} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Envoyer la candidature
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Done */}
      {currentStep === "done" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold">Candidature envoyée !</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Votre candidature a été envoyée avec succès. Vous pouvez suivre son évolution dans
                vos candidatures.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleStartOver}>
                  Nouvelle candidature
                </Button>
                <Button onClick={() => navigate("/applications")}>
                  Voir mes candidatures
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
