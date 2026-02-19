import { useState } from "react";
import { useUser, useUpdateUser, useChangePassword } from "../hooks";
import { usersApi } from "../../users/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Textarea } from "../../../shared/components/ui/textarea";
import { motion } from "framer-motion";
import { Upload, FileText, FileCheck, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();
  const queryClient = useQueryClient();

  // Use controlled inputs with user data as default values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterTemplate, setCoverLetterTemplate] = useState("");
  const [uploadingCV, setUploadingCV] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use current values or fall back to user data
    const finalName = name || user?.name || "";
    const finalEmail = email || user?.email || "";
    const finalTemplate = coverLetterTemplate || user?.cover_letter_template || undefined;
    
    await updateUser.mutateAsync({ 
      name: finalName, 
      email: finalEmail,
      cover_letter_template: finalTemplate
    });
  };

  const handleUploadCV = async () => {
    if (!cvFile) return;
    
    // Vérifier que c'est un PDF
    if (!cvFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Seuls les fichiers PDF sont acceptés');
      return;
    }

    // Vérifier la taille (max 10 MB)
    if (cvFile.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10 MB');
      return;
    }
    
    setUploadingCV(true);
    try {
      const response = await usersApi.uploadCV(cvFile);
      
      // Mettre à jour le profil avec le nouveau cv_file_path
      await updateUser.mutateAsync({
        cv_file_path: response.file_path
      });
      
      // Rafraîchir les données utilisateur
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      
      alert('CV uploadé avec succès !');
      setCvFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors de l\'upload du CV');
    } finally {
      setUploadingCV(false);
    }
  };

  const handleDebugCVExtraction = async () => {
    if (!cvFile) return;
    
    if (!cvFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Seuls les fichiers PDF sont acceptés');
      return;
    }
    
    setUploadingCV(true);
    try {
      const response = await usersApi.debugCVExtraction(cvFile);
      console.log('🔍 RAW TEXT FROM PYPDF2:');
      console.log(response.raw_text);
      console.log('📊 Text length:', response.text_length);
      
      // Télécharger le texte brut dans un fichier
      const blob = new Blob([response.raw_text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv_raw_extraction.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`✅ Extraction brute PyPDF2 téléchargée !\n\n📊 ${response.text_length} caractères extraits\n\nOuvrez la console et le fichier cv_raw_extraction.txt`);
    } catch (error) {
      console.error('Debug extraction error:', error);
      alert('Erreur lors du debug d\'extraction');
    } finally {
      setUploadingCV(false);
    }
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Mot de passe changé avec succès");
    } catch {
      alert("Erreur lors du changement de mot de passe");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
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
        Paramètres
      </motion.h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={name || user?.name || ""}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || user?.email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cv">CV (PDF)</Label>
                  
                  {(user?.cv_file_path || user?.cv_path) ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                        <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            CV uploadé
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {(user.cv_file_path || user.cv_path)?.split('/').pop()}
                          </p>
                          {user.cv_text && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {user.cv_text.length} caractères extraits
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Visualisation des sections extraites */}
                      <div className="space-y-3 border-t pt-3">
                        <Label className="text-sm font-medium">Sections du CV extraites</Label>
                        <p className="text-xs text-muted-foreground">
                          Contrôlez l'extraction de chaque section de votre CV
                        </p>
                        
                        {/* 1. Informations personnelles */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            📋 Informations personnelles {!user.cv_personal_info && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_personal_info || ""}
                            readOnly
                            className="min-h-[80px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Nom, email, téléphone, adresse..."
                          />
                        </div>
                        
                        {/* 2. Résumé professionnel */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            💼 Résumé professionnel {!user.cv_summary && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_summary || ""}
                            readOnly
                            className="min-h-[100px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Profil professionnel, objectifs..."
                          />
                        </div>
                        
                        {/* 3. Compétences techniques (IT Skills) */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-green-600 dark:text-green-400">
                            💻 Compétences techniques (IT Skills) {!user.cv_technical_skills && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_technical_skills || ""}
                            readOnly
                            className="min-h-[150px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Technologies, langages, frameworks..."
                          />
                        </div>
                        
                        {/* 4. Compétences comportementales (Soft Skills) */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                            🤝 Compétences comportementales (Soft Skills) {!user.cv_soft_skills && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_soft_skills || ""}
                            readOnly
                            className="min-h-[120px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Communication, leadership, travail d'équipe..."
                          />
                        </div>
                        
                        {/* 5. Expérience professionnelle */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            🏢 Expérience professionnelle {!user.cv_experience && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_experience || ""}
                            readOnly
                            className="min-h-[180px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Postes occupés, entreprises, responsabilités..."
                          />
                        </div>
                        
                        {/* 6. Projets */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                            🚀 Projets {!user.cv_projects && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_projects || ""}
                            readOnly
                            className="min-h-[180px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Projets personnels, professionnels, académiques..."
                          />
                        </div>
                        
                        {/* 7. Formation */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                            🎓 Formation {!user.cv_education && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_education || ""}
                            readOnly
                            className="min-h-[150px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Diplômes, écoles, formations..."
                          />
                        </div>
                        
                        {/* 8. Certifications & Prix */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-yellow-600 dark:text-yellow-500">
                            🏆 Certifications & Prix {!user.cv_awards && <span className="text-red-500">(vide)</span>}
                          </Label>
                          <Textarea
                            value={user.cv_awards || ""}
                            readOnly
                            className="min-h-[100px] text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Certifications, prix, distinctions..."
                          />
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            ℹ️ Ces sections sont automatiquement extraites et utilisées pour améliorer la précision des matchs et de la génération de lettres de motivation
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cv-replace" className="text-sm text-muted-foreground">
                          Remplacer le CV
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="cv-replace"
                            type="file"
                            accept=".pdf"
                            onChange={handleCvFileChange}
                            className="cursor-pointer"
                          />
                          {cvFile && (
                            <Button
                              type="button"
                              onClick={handleUploadCV}
                              disabled={uploadingCV}
                              size="sm"
                            >
                              {uploadingCV ? "Upload..." : "Remplacer"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Uploadez votre CV pour des matchs plus précis
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Le système utilisera votre CV réel pour calculer la compatibilité avec les offres d'emploi.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          id="cv"
                          type="file"
                          accept=".pdf"
                          onChange={handleCvFileChange}
                          className="cursor-pointer"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleUploadCV}
                            disabled={!cvFile || uploadingCV}
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingCV ? "Upload..." : "Uploader"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleDebugCVExtraction}
                            disabled={!cvFile || uploadingCV}
                            size="sm"
                            variant="outline"
                          >
                            🔍 Debug Extraction
                          </Button>
                        </div>
                      </div>
                      
                      {cvFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Fichier sélectionné: {cvFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? "Changement..." : "Changer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Template de lettre de motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">
                  Modèle personnalisé (variables disponibles: {"{company}"}, {"{position}"}, {"{name}"})
                </Label>
                <Textarea
                  id="template"
                  value={coverLetterTemplate || user?.cover_letter_template || ""}
                  onChange={(e) => setCoverLetterTemplate(e.target.value)}
                  placeholder="Madame, Monsieur,&#10;&#10;Je me permets de vous adresser ma candidature pour le poste de {position} au sein de {company}.&#10;&#10;Fort(e) de mes expériences...&#10;&#10;Cordialement,&#10;{name}"
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Ce template sera utilisé par l'IA pour générer vos lettres de motivation personnalisées.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
