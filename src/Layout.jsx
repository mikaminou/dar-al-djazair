import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, MessageSquare, Plus, User, Menu, X, Globe, ChevronDown } from "lucide-react";
import { LanguageProvider, useLang } from "./components/LanguageContext";
import SavedSearchAlerts from "./components/SavedSearchAlerts";
import NotificationBell from "./components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function NavContent({ currentPageName, children }) {
  const { t, lang, changeLang } = useLang();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navLinks = [
    { label: t.buy, href: createPageUrl("Listings") + "?listing_type=sale" },
    { label: t.rent, href: createPageUrl("Listings") + "?listing_type=rent" },
    { label: t.sell, href: createPageUrl("PostListing") },
  ];

  const isRtl = lang === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-gray-50">
      <style>{`
        :root { --primary: #059669; }
        body { font-family: ${isRtl ? "'Cairo', 'Amiri', sans-serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-emerald-700">{lang === "ar" ? "داري" : "Dari"}</span>
            <span className="text-xs text-gray-400 hidden sm:block">.dz</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-gray-500 text-xs">
                  <Globe className="w-4 h-4" />
                  {lang.toUpperCase()}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLang("fr")}>🇫🇷 Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ar")}>🇩🇿 العربية</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("en")}>🇬🇧 English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to={createPageUrl("Favorites")}
              className="hidden sm:flex items-center gap-1 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to={createPageUrl("Messages")}
              className="hidden sm:flex items-center gap-1 p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            <Link
              to={createPageUrl("PostListing")}
              className="hidden sm:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              {t.postListing}
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 truncate">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Profile")}>{lang === "ar" ? "ملفي الشخصي" : lang === "fr" ? "Mon profil" : "My Profile"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("MyListings")}>{t.myListings}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Leads")}>{lang === "ar" ? "العملاء المحتملون" : lang === "fr" ? "Mes Leads" : "My Leads"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("OwnerDashboard")}>{lang === "ar" ? "لوحة التحليلات" : lang === "fr" ? "Tableau de bord" : "Analytics Dashboard"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Appointments")}>{lang === "ar" ? "مواعيدي" : lang === "fr" ? "Mes Rendez-vous" : "My Appointments"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Availability")}>{lang === "ar" ? "مواعيد الزيارة" : lang === "fr" ? "Mes Disponibilités" : "My Availability"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("SavedSearches")}>{lang === "ar" ? "بحوثي المحفوظة" : lang === "fr" ? "Mes recherches" : "Saved Searches"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Favorites")}>{t.favorites}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Messages")}>{t.messages}</Link>
                    </DropdownMenuItem>
                    {/* These are inside the user ? block so they only render when logged in */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-500">
                      {t.signOut}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => base44.auth.redirectToLogin()}>
                    {t.signIn}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-500">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50 rounded-lg">
                {link.label}
              </a>
            ))}
            <Link to={createPageUrl("Favorites")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <Heart className="w-4 h-4" /> {t.favorites}
            </Link>
            <Link to={createPageUrl("Messages")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <MessageSquare className="w-4 h-4" /> {t.messages}
            </Link>
            <Link to={createPageUrl("MyListings")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <User className="w-4 h-4" /> {t.myListings}
            </Link>
          </div>
        )}
      </header>

      <SavedSearchAlerts />

      {/* PAGE CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 pt-10 pb-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">{lang === "ar" ? "داري" : "Dari"}.dz</span>
              </div>
              <p className="text-xs leading-relaxed">{t.hero_subtitle}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">{lang === "ar" ? "تصفح" : lang === "fr" ? "Explorer" : "Browse"}</h4>
              <ul className="space-y-2 text-xs">
                <li><a href={createPageUrl("Listings") + "?listing_type=sale"} className="hover:text-white">{t.buy}</a></li>
                <li><a href={createPageUrl("Listings") + "?listing_type=rent"} className="hover:text-white">{t.rent}</a></li>
                <li><a href={createPageUrl("PostListing")} className="hover:text-white">{t.sell}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">{lang === "ar" ? "الولايات الكبرى" : lang === "fr" ? "Grandes Villes" : "Major Cities"}</h4>
              <ul className="space-y-2 text-xs">
                {["Alger", "Oran", "Constantine", "Annaba"].map(w => (
                  <li key={w}><a href={createPageUrl(`Listings?wilaya=${w}`)} className="hover:text-white">{w}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">{lang === "ar" ? "تواصل" : lang === "fr" ? "Contact" : "Contact"}</h4>
              <ul className="space-y-2 text-xs">
                <li>contact@dari.dz</li>
                <li>+213 555 000 000</li>
                <li className="flex gap-2 mt-3">
                  <span className="text-lg">🇩🇿</span>
                  <span>{lang === "ar" ? "الجزائر" : "Algérie"}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 text-xs text-center text-gray-600">
            © 2024 Dari.dz — {lang === "ar" ? "منصة العقار الجزائرية" : lang === "fr" ? "La plateforme immobilière algérienne" : "The Algerian Real Estate Platform"}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <NavContent currentPageName={currentPageName}>
        {children}
      </NavContent>
    </LanguageProvider>
  );
}