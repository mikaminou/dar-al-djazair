import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Eye, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";

const PROJECT_STATUS_COLOR = {
  upcoming: "bg-blue-100 text-blue-700",
  under_construction: "bg-amber-100 text-amber-700",
  semi_fini: "bg-orange-100 text-orange-700",
  fini: "bg-teal-100 text-teal-700",
  ready_to_move: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
  changes_requested: "bg-orange-100 text-orange-700",
};

const PROJECT_STATUS_LABEL = {
  upcoming:           { en: "Upcoming",          fr: "À venir",           ar: "قادم" },
  under_construction: { en: "Under Construction", fr: "En construction",   ar: "قيد الإنشاء" },
  semi_fini:          { en: "Semi-Finished",      fr: "Semi-fini",         ar: "نصف تشطيب" },
  fini:               { en: "Finished",           fr: "Fini",              ar: "تشطيب كامل" },
  ready_to_move:      { en: "Ready to Move",      fr: "Prêt à habiter",    ar: "جاهز" },
  pending:            { en: "Pending Approval",   fr: "En attente",        ar: "بانتظار المراجعة" },
  active:             { en: "Active",             fr: "Actif",             ar: "نشط" },
  declined:           { en: "Declined",           fr: "Refusé",            ar: "مرفوض" },
  changes_requested:  { en: "Changes Requested",  fr: "Modif. requises",   ar: "تعديلات مطلوبة" },
};

export default function MyProjectsPage() {
  const { lang } = useLang();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    if (!user) { setLoading(false); return; }
    setCurrentUser(user);
    const data = await base44.entities.Project.filter({ published_by: user.email }, "-created_date", 100).catch(() => []);
    setProjects(data);
    setLoading(false);
  }

  const tabLabel = {
    listings: { en: "My Listings", fr: "Mes annonces", ar: "إعلاناتي" },
    projects: { en: "My Projects", fr: "Mes projets",  ar: "مشاريعي" },
  };

  if (!loading && currentUser && currentUser.role !== "professional" && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {lang === "ar" ? "متاح للمحترفين فقط" : lang === "fr" ? "Réservé aux professionnels" : "Professionals Only"}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">
            {lang === "ar" ? "مشاريعي" : lang === "fr" ? "Mes projets" : "My Projects"}
          </h1>
          {!loading && (
            <p className="text-emerald-200 text-sm">
              {projects.length} {lang === "ar" ? "مشروع" : lang === "fr" ? "projet(s)" : "project(s)"}
            </p>
          )}
        </div>
      </div>

      {/* Tab strip */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          <Link
            to="/MyListings"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-emerald-700 transition-colors"
          >
            {tabLabel.listings[lang] || tabLabel.listings.fr}
          </Link>
          <Link
            to="/MyProjects"
            className="px-4 py-3 text-sm font-medium text-emerald-700 border-b-2 border-emerald-600"
          >
            {tabLabel.projects[lang] || tabLabel.projects.fr}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Post a project CTA */}
        <div className="flex justify-end mb-4">
          <Link to="/PostProject">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="w-4 h-4" />
              {lang === "ar" ? "نشر مشروع" : lang === "fr" ? "Publier un projet" : "Post a Project"}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white h-20 rounded-xl animate-pulse border" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">
              {lang === "ar" ? "لا توجد مشاريع بعد" : lang === "fr" ? "Aucun projet pour l'instant" : "No projects yet"}
            </p>
            <Link to="/PostProject">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" />
                {lang === "ar" ? "نشر أول مشروع" : lang === "fr" ? "Publier votre premier projet" : "Post your first project"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <img
                  src={project.photos?.[0] || "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&q=70"}
                  alt=""
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{project.project_name}</h3>
                    <Badge className={PROJECT_STATUS_COLOR[project.status] || "bg-gray-100"}>
                      {lang === "ar" ? "المراجعة: " : lang === "fr" ? "Modération: " : "Review: "}
                      {PROJECT_STATUS_LABEL[project.status]?.[lang] || project.status}
                    </Badge>
                    {project.project_status && (
                      <Badge className={PROJECT_STATUS_COLOR[project.project_status] || "bg-gray-100"}>
                        {PROJECT_STATUS_LABEL[project.project_status]?.[lang] || project.project_status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {project.wilaya}, {project.commune}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {project.total_units} {lang === "ar" ? "وحدة" : lang === "fr" ? "unité(s)" : "unit(s)"}
                    {project.developer_name && ` • ${project.developer_name}`}
                  </p>
                  {project.status === "changes_requested" && project.admin_note && (
                    <p className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 mt-1 border border-orange-100">
                      ✏️ {lang === "ar" ? "ملاحظة المشرف" : lang === "fr" ? "Note admin" : "Admin note"}: {project.admin_note}
                    </p>
                  )}
                  {project.status === "declined" && project.admin_note && (
                    <p className="text-xs text-red-700 bg-red-50 rounded px-2 py-1 mt-1 border border-red-100">
                      ❌ {project.admin_note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link to={`/ProjectDetail?id=${project.id}`}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}