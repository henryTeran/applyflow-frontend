import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateJobOffer } from "../hooks";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Select } from "../../../shared/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { ApplicationType } from "../../../shared/types";

export function CreateJobOfferPage() {
  const navigate = useNavigate();
  const createOffer = useCreateJobOffer();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    source: "",
    url: "",
    application_type: "portal" as ApplicationType,
    application_url: "",
    raw_description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }
    if (!formData.company.trim()) {
      newErrors.company = "L'entreprise est requise";
    }
    if (!formData.source.trim()) {
      newErrors.source = "La source est requise";
    }
    if (!formData.raw_description.trim()) {
      newErrors.raw_description = "La description est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await createOffer.mutateAsync({
        ...formData,
        location: formData.location || null,
        url: formData.url || null,
        application_url: formData.application_url || null,
      });

      alert("Offre créée avec succès !");
      navigate("/offers");
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Erreur lors de la création de l'offre");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          Nouvelle offre d'emploi
        </motion.h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'offre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Développeur Full Stack"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  Entreprise <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Ex: TechCorp"
                  className={errors.company ? "border-destructive" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Paris, France"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">
                  Source <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="Ex: LinkedIn, Indeed, etc."
                  className={errors.source ? "border-destructive" : ""}
                />
                {errors.source && (
                  <p className="text-sm text-destructive">{errors.source}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL de l'offre</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_type">Type de candidature</Label>
                <select
                  id="application_type"
                  name="application_type"
                  value={formData.application_type}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="email">Email</option>
                  <option value="portal">Portail</option>
                  <option value="manual">Manuel</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="application_url">URL de candidature</Label>
                <Input
                  id="application_url"
                  name="application_url"
                  type="url"
                  value={formData.application_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw_description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="raw_description"
                name="raw_description"
                value={formData.raw_description}
                onChange={handleChange}
                placeholder="Copiez-collez la description complète de l'offre..."
                className={`min-h-[300px] ${errors.raw_description ? "border-destructive" : ""}`}
              />
              {errors.raw_description && (
                <p className="text-sm text-destructive">{errors.raw_description}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/offers")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createOffer.isPending}>
                {createOffer.isPending ? "Création..." : "Créer l'offre"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
