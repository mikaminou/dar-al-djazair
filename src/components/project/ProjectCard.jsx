import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Building2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  upcoming:           { fr: "À venir",          en: "Upcoming",           ar: "قادم",          color: "bg-blue-100 text-blue-700" },
  under_construction: { fr: "En construction",  en: "Under Construction", ar: "قيد الإنشاء",  color: "bg-amber-100 text-amber-700" },
  semi_fini:          { fr: "Semi-fini",        en: "Semi-Finished",      ar: "نصف تشطيب",    color: "bg-orange-100 text-orange-700" },
  fini:               { fr: "Fini",             en: "Finished",           ar: "تشطيب كامل",  color: "bg-teal-100 text-teal-700" },
  ready_to_move:      { fr: "Prêt à habiter",   en: "Ready to Move",      ar: "جاهز",          color: "bg-green-100 text-green-700" },
};

function formatPriceShort(n, lang = "fr") {
  if (!n) return "—";
  const DA = lang === "ar" ? "دج" : "DA";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Mrd ${DA}`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} M ${DA}`;
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${DA}`;
}

export default function ProjectCard({ project, lotTypes = [], lang = "fr" }) {
  const s = STATUS_CONFIG[project.project_status] || STATUS_CONFIG.upcoming;
  const cover = project.photos?.[0] || "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80";
  const minPrice = lotTypes.length > 0 ? Math.min(...lotTypes.map(lt => lt.price_min).filter(Boolean)) : null;
  const availableUnits = lotTypes.reduce((sum, lt) => sum + (lt.available_count ?? lt.total_count ?? 0), 0);
  const lotLabels = [...new Set(lotTypes.map(lt => lt.lot_type))].sort((a, b) => {
    const order = ["F1","F2","F3","F4","F5","F6+","Duplex","Penthouse","Commercial","Parking"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <Link to={`/ProjectDetail?id=${project.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Cover image */}
        <div className="relative h-52 overflow-hidden">
          <img src={cover} alt={project.project_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s[lang] || s.fr}</span>
            {project.is_exclusive && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                <Star className="w-3 h-3" /> {lang === "ar" ? "حصري" : "Exclusif"}
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-lg leading-tight drop-shadow-md">{project.project_name}</p>
            <p className="text-white/80 text-xs">{project.developer_name}</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{project.wilaya}{project.commune ? ` · ${project.commune}` : ""}</span>
          </div>

          {/* Lot types */}
          {lotLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lotLabels.map(lt => (
                <span key={lt} className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{lt}</span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <div>
              {minPrice && (
                <p className="text-emerald-700 font-bold text-sm">
                  {lang === "ar" ? "من" : lang === "fr" ? "À partir de" : "From"} {formatPriceShort(minPrice, lang)}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {availableUnits} {lang === "ar" ? "وحدة متاحة" : lang === "fr" ? "unité(s) disponible(s)" : "available unit(s)"}
              </p>
            </div>
            {project.delivery_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(project.delivery_date).toLocaleDateString(lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-DZ" : "en-GB", { month: "short", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}