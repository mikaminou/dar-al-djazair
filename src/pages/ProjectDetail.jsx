import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { MapPin, Calendar, Building2, Home, Car, Star, Play, Phone, Mail, MessageSquare, ChevronLeft, ChevronRight, X, CheckCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LOT_ORDER = ["F1","F2","F3","F4","F5","F6+","Duplex","Penthouse","Commercial","Parking"];

const STATUS_CONFIG = {
  upcoming:           { fr: "À venir",          en: "Upcoming",           ar: "قادم",         color: "bg-blue-100 text-blue-700 border-blue-200" },
  under_construction: { fr: "En construction",  en: "Under Construction", ar: "قيد الإنشاء", color: "bg-amber-100 text-amber-700 border-amber-200" },
  ready_to_move:      { fr: "Prêt à habiter",   en: "Ready to Move",      ar: "جاهز",         color: "bg-green-100 text-green-700 border-green-200" },
  sold_out:           { fr: "Complet",          en: "Sold Out",           ar: "مكتمل",        color: "bg-gray-200 text-gray-600 border-gray-300" },
};

const TRANCHE_STATUS = {
  upcoming:           { fr: "À venir",         en: "Upcoming",           ar: "قادم",         dot: "bg-blue-400" },
  under_construction: { fr: "En travaux",      en: "Under Construction", ar: "قيد الإنشاء", dot: "bg-amber-400" },
  delivered:          { fr: "Livré",           en: "Delivered",          ar: "مُسلَّم",      dot: "bg-green-500" },
};

const AMENITY_LABELS = {
  elevator: { fr:"Ascenseur",en:"Elevator",ar:"مصعد" }, underground_parking:{fr:"Parking souterrain",en:"Underground parking",ar:"موقف سفلي"},
  rooftop_terrace:{fr:"Rooftop",en:"Rooftop terrace",ar:"تراس علوي"}, concierge:{fr:"Gardien",en:"Concierge",ar:"حارس"},
  generator:{fr:"Groupe électrogène",en:"Generator",ar:"مولد"}, water_tank:{fr:"Château d'eau",en:"Water tank",ar:"خزان مياه"},
  solar_panels:{fr:"Solaire",en:"Solar panels",ar:"طاقة شمسية"}, interphone:{fr:"Interphone",en:"Interphone",ar:"إنترفون"},
  cctv:{fr:"Vidéosurveillance",en:"CCTV",ar:"مراقبة"}, secured_entrance:{fr:"Entrée sécurisée",en:"Secured entrance",ar:"مدخل آمن"},
  fitted_kitchen:{fr:"Cuisine équipée",en:"Fitted kitchen",ar:"مطبخ مجهز"}, ac_preinstall:{fr:"Pré-install. AC",en:"AC pre-install",ar:"تمديد مكيف"},
  double_glazing:{fr:"Double vitrage",en:"Double glazing",ar:"زجاج مزدوج"}, high_ceilings:{fr:"Hauts plafonds",en:"High ceilings",ar:"سقف عالٍ"},
  fiber_ready:{fr:"Fibre optique",en:"Fiber ready",ar:"فيبر"}, garden:{fr:"Jardin",en:"Garden",ar:"حديقة"},
  playground:{fr:"Aire de jeux",en:"Playground",ar:"ملعب أطفال"}, pool:{fr:"Piscine",en:"Pool",ar:"مسبح"},
  sports_court:{fr:"Terrain de sport",en:"Sports court",ar:"ملعب رياضي"}, jogging_path:{fr:"Jogging",en:"Jogging path",ar:"مسار رياضي"},
  commercial_ground_floor:{fr:"RDC commercial",en:"Commercial GF",ar:"طابق تجاري"}, near_school:{fr:"École proche",en:"Near school",ar:"قرب مدرسة"},
  near_hospital:{fr:"Hôpital proche",en:"Near hospital",ar:"قرب مستشفى"}, near_mosque:{fr:"Mosquée proche",en:"Near mosque",ar:"قرب مسجد"},
  near_transport:{fr:"Transport proche",en:"Near transport",ar:"قرب مواصلات"}, near_highway:{fr:"Autoroute proche",en:"Near highway",ar:"قرب طريق سريع"},
  sea_view:{fr:"Vue mer",en:"Sea view",ar:"إطلالة بحرية"}, mountain_view:{fr:"Vue montagne",en:"Mountain view",ar:"إطلالة جبلية"},
  city_center:{fr:"Centre-ville",en:"City center",ar:"وسط المدينة"},
};

function formatPrice(n, lang="fr") {
  if (!n) return "—";
  const DA = lang === "ar" ? "دج" : "DA";
  if (n >= 1_000_000_000) return `${(n/1e9).toFixed(1).replace(/\.0$/,"")} Mrd ${DA}`;
  if (n >= 1_000_000) return `${Math.round(n/1e6)} M ${DA}`;
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${DA}`;
}

function getYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

export default function ProjectDetail() {
  const { lang } = useLang();
  const [project, setProject] = useState(null);
  const [lotTypes, setLotTypes] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [expandedLotType, setExpandedLotType] = useState(null);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) load(id);
  }, []);

  async function load(id) {
    const [proj, lts, ls] = await Promise.all([
      base44.entities.Project.filter({ id }, null, 1).then(r => r[0]).catch(() => null),
      base44.entities.ProjectLotType.filter({ project_id: id }, null, 50).catch(() => []),
      base44.entities.ProjectLot.filter({ project_id: id }, null, 200).catch(() => []),
    ]);
    setProject(proj);
    setLotTypes(lts.sort((a, b) => LOT_ORDER.indexOf(a.lot_type) - LOT_ORDER.indexOf(b.lot_type)));
    setLots(ls);
    // increment view
    if (proj) base44.entities.Project.update(id, { views_count: (proj.views_count || 0) + 1 }).catch(() => {});
    setLoading(false);
  }

  async function sendContact() {
    if (!contactForm.name || !contactForm.phone) return;
    setSendingContact(true);
    if (project?.contact_email) {
      await base44.integrations.Core.SendEmail({
        to: project.contact_email,
        from_name: "Dar El Djazair",
        subject: `Demande d'info — ${project.project_name}`,
        body: `<b>${contactForm.name}</b> (${contactForm.phone}${contactForm.email ? `, ${contactForm.email}` : ""})<br>${contactForm.message}`,
      }).catch(() => {});
    }
    if (project?.published_by) {
      await base44.entities.Lead.create({
        listing_id: project.id,
        listing_title: project.project_name,
        listing_wilaya: project.wilaya,
        agent_email: project.published_by,
        seeker_email: contactForm.email || "anonymous",
        status: "new",
      }).catch(() => {});
    }
    setSendingContact(false);
    setContactSent(true);
  }

  const L = lang;
  const t = (fr, en, ar) => L === "ar" ? ar : L === "fr" ? fr : en;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <p>{t("Projet introuvable", "Project not found", "المشروع غير موجود")}</p>
    </div>
  );

  const sc = STATUS_CONFIG[project.project_status] || STATUS_CONFIG.upcoming;
  const embedUrl = getYoutubeEmbed(project.video_url);
  const availableTotal = lotTypes.reduce((s, lt) => s + (lt.available_count ?? lt.total_count ?? 0), 0);
  const minPrice = lotTypes.length > 0 ? Math.min(...lotTypes.map(lt => lt.price_min).filter(Boolean)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <div className="relative h-[55vh] min-h-[360px] bg-black overflow-hidden">
        {project.photos?.length > 0 ? (
          <>
            <img
              src={project.photos[activePhoto]}
              alt={project.project_name}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {/* Navigation arrows */}
            {project.photos.length > 1 && (
              <>
                <button onClick={() => setActivePhoto(p => (p - 1 + project.photos.length) % project.photos.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setActivePhoto(p => (p + 1) % project.photos.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-700" />
        )}

        {/* Video play button */}
        {embedUrl && (
          <button onClick={() => setShowVideo(true)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full p-5 hover:bg-white/30 transition-all">
            <Play className="w-8 h-8" />
          </button>
        )}

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${sc.color}`}>{sc[L] || sc.fr}</span>
              {project.is_exclusive && (
                <span className="flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  <Star className="w-3.5 h-3.5" /> {t("Exclusif", "Exclusive", "حصري")}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-md">{project.project_name}</h1>
            <p className="text-white/80 font-medium">{project.developer_name}</p>
            <div className="flex items-center gap-4 mt-2 text-white/70 text-sm flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.wilaya}{project.commune ? `, ${project.commune}` : ""}</span>
              {project.delivery_date && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{t("Livraison", "Delivery", "التسليم")}: {new Date(project.delivery_date).toLocaleDateString(L === "fr" ? "fr-FR" : L === "ar" ? "ar-DZ" : "en-GB", { month: "long", year: "numeric" })}</span>
              )}
            </div>
          </div>
        </div>

        {/* Photo count */}
        {project.photos?.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {activePhoto + 1} / {project.photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {project.photos?.length > 1 && (
        <div className="bg-white border-b px-4 py-2">
          <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto">
            {project.photos.map((url, i) => (
              <img key={i} src={url} alt="" onClick={() => setActivePhoto(i)}
                className={`w-16 h-12 object-cover rounded flex-shrink-0 cursor-pointer transition-all ${i === activePhoto ? "ring-2 ring-emerald-500" : "opacity-60 hover:opacity-100"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SUMMARY BAR ── */}
      <div className="bg-emerald-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            { label: t("Unités totales","Total Units","إجمالي الوحدات"), value: project.total_units },
            { label: t("Disponibles","Available","متاحة"), value: availableTotal },
            { label: t("Étages","Floors","طوابق"), value: project.total_floors || "—" },
            { label: t("Bâtiments","Buildings","مبانٍ"), value: project.total_buildings || "—" },
            { label: t("Prix à partir de","From","من"), value: minPrice ? formatPrice(minPrice, L) : "—" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-emerald-300 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── DESCRIPTION ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t("À propos du projet", "About the Project", "عن المشروع")}</h2>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>
        </section>

        {/* ── LOT TYPES ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("Types de lots disponibles", "Available Lot Types", "أنواع اللوتات المتاحة")}</h2>
          <div className="space-y-3">
            {lotTypes.map(lt => {
              const available = lt.available_count ?? lt.total_count ?? 0;
              const total = lt.total_count ?? 0;
              const pct = total > 0 ? available / total : 0;
              const availColor = pct === 0 ? "text-red-600 bg-red-50 border-red-200" : pct < 0.2 ? "text-orange-600 bg-orange-50 border-orange-200" : "text-green-700 bg-green-50 border-green-200";
              const barColor = pct === 0 ? "bg-red-400" : pct < 0.2 ? "bg-orange-400" : "bg-green-500";
              const isExpanded = expandedLotType === lt.id;
              const lotsForType = lots.filter(l => l.lot_type === lt.lot_type);

              return (
                <div key={lt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {lt.lot_type}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${availColor}`}>
                              {available} {t("disponible(s) sur", "available of", "متاح من")} {total}
                            </span>
                          </div>
                          <p className="text-emerald-700 font-bold">{formatPrice(lt.price_min, L)} — {formatPrice(lt.price_max, L)}</p>
                          <p className="text-gray-500 text-sm">{lt.area_min} – {lt.area_max} m²{lt.floor_min != null ? ` · ${t("Ét.","Fl.","طابق")} ${lt.floor_min}–${lt.floor_max}` : ""}</p>
                          {lt.description && <p className="text-xs text-gray-400 mt-0.5">{lt.description}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* Availability bar */}
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${Math.max(4, pct * 100)}%` }} />
                        </div>
                        {lotsForType.length > 0 && (
                          <button
                            onClick={() => setExpandedLotType(isExpanded ? null : lt.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? t("Masquer les lots","Hide lots","إخفاء اللوتات") : t("Voir les lots","View lots","عرض اللوتات")} ({lotsForType.length})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded lots table */}
                  {isExpanded && lotsForType.length > 0 && (
                    <div className="border-t border-gray-50 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {[t("Réf.","Ref","المرجع"), t("Étage","Floor","الطابق"), t("Surface","Area","المساحة"), t("Orientation","Orient.","الاتجاه"), t("Prix","Price","السعر"), t("Statut","Status","الحالة")].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {lotsForType.map(lot => (
                            <tr key={lot.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2.5 font-medium text-gray-900 text-xs">{lot.lot_reference}</td>
                              <td className="px-3 py-2.5 text-gray-600">{lot.floor}</td>
                              <td className="px-3 py-2.5 text-gray-600">{lot.area} m²</td>
                              <td className="px-3 py-2.5 text-gray-600 text-xs">{lot.orientation?.join(", ") || "—"}</td>
                              <td className="px-3 py-2.5 font-semibold text-emerald-700 text-xs">{formatPrice(lot.price, L)}</td>
                              <td className="px-3 py-2.5">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  lot.status === "available" ? "bg-green-100 text-green-700" :
                                  lot.status === "reserved" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {lot.status === "available" ? t("Disponible","Available","متاح") : lot.status === "reserved" ? t("Réservé","Reserved","محجوز") : t("Vendu","Sold","مُباع")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── AMENITIES ── */}
        {project.amenities?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("Équipements & atouts", "Amenities & Features", "المرافق والمميزات")}</h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {project.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {AMENITY_LABELS[a]?.[L] || a}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── DELIVERY TRANCHES ── */}
        {project.tranches?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("Phases de livraison", "Delivery Phases", "مراحل التسليم")}</h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {project.tranches.map((tr, i) => {
                  const ts = TRANCHE_STATUS[tr.tranche_status] || TRANCHE_STATUS.upcoming;
                  return (
                    <div key={i} className="flex-shrink-0 w-48 text-center">
                      <div className={`w-4 h-4 rounded-full ${ts.dot} mx-auto mb-2`} />
                      <p className="font-semibold text-sm text-gray-900">{tr.tranche_name}</p>
                      <p className="text-xs text-gray-500">{ts[L] || ts.fr}</p>
                      {tr.expected_delivery_date && <p className="text-xs text-emerald-600 mt-1">{new Date(tr.expected_delivery_date).toLocaleDateString(L === "fr" ? "fr-FR" : "en-GB", { month: "short", year: "numeric" })}</p>}
                      {tr.units_description && <p className="text-xs text-gray-400 mt-1">{tr.units_description}</p>}
                      {i < project.tranches.length - 1 && <div className="h-0.5 bg-gray-200 w-full mt-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── VIRTUAL TOUR ── */}
        {project.virtual_tour_url && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("Visite virtuelle", "Virtual Tour", "جولة افتراضية")}</h2>
            <a href={project.virtual_tour_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-400 transition-colors w-fit text-emerald-700 font-medium">
              <ExternalLink className="w-4 h-4" />{t("Ouvrir la visite 3D", "Open 3D Tour", "فتح الجولة الثلاثية الأبعاد")}
            </a>
          </section>
        )}

        {/* ── CONTACT ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("Contact", "Contact", "الاتصال")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
              <p className="font-semibold text-gray-900">{project.contact_name}</p>
              {project.show_phone && project.contact_phone && (
                <a href={`tel:${project.contact_phone}`} className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900">
                  <Phone className="w-4 h-4" />{project.contact_phone}
                </a>
              )}
              {project.contact_whatsapp && (
                <a href={`https://wa.me/${project.contact_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-800">
                  <MessageSquare className="w-4 h-4" />WhatsApp
                </a>
              )}
              {project.show_email && project.contact_email && (
                <a href={`mailto:${project.contact_email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <Mail className="w-4 h-4" />{project.contact_email}
                </a>
              )}
              {project.office_address && <p className="text-sm text-gray-500">📍 {project.office_address}</p>}
              {project.office_hours && <p className="text-xs text-gray-400">🕐 {project.office_hours}</p>}
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              {contactSent ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">{t("Demande envoyée !", "Request Sent!", "تم إرسال الطلب!")}</p>
                  <p className="text-xs text-gray-500 mt-1">{t("Nous vous contacterons prochainement.", "We will contact you shortly.", "سنتواصل معك قريباً.")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold text-gray-800 text-sm">{t("Demander des informations", "Request Information", "طلب معلومات")} — {project.project_name}</p>
                  <Input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder={t("Nom *", "Name *", "الاسم *")} />
                  <Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder={t("Téléphone *", "Phone *", "الهاتف *")} />
                  <Input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
                  <Textarea value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} rows={3} className="resize-none" placeholder={t("Message (optionnel)", "Message (optional)", "رسالة (اختياري)")} />
                  <Button onClick={sendContact} disabled={sendingContact || !contactForm.name || !contactForm.phone} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {t("Envoyer", "Send", "إرسال")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Video modal */}
      {showVideo && embedUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setShowVideo(false)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"><X className="w-5 h-5" /></button>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}