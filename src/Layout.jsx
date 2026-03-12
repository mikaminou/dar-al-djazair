import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Search, Heart, MessageSquare, Plus, User, Menu, X, Globe, ChevronDown, Home } from "lucide-react";
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
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <style>{`
        :root { --primary: #059669; }
        body { font-family: ${isRtl ? "'Cairo', 'Amiri', sans-serif" : "'Inter', sans-serif"}; overscroll-behavior: none; }
      `}</style>

      {/* NAVBAR — hidden on mobile */}
      <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3 md:gap-4">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 flex-shrink-0 min-w-fit">
            <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" className="w-8 h-8" />
            <span className="hidden sm:inline font-bold text-lg text-emerald-700">{lang === "ar" ? "دار الجزائر" : "Dar Al Djazair"}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Action Buttons */}
            <Link
              to={createPageUrl("PostListing")}
              className="hidden md:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">{t.postListing}</span>
            </Link>

            {/* Notifications */}
            <NotificationBell user={user} lang={lang} />

            {/* Messages */}
            <Link
              to={createPageUrl("Messages")}
              className="hidden sm:flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title={lang === "ar" ? "الرسائل" : lang === "fr" ? "Messages" : "Messages"}
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            {/* Favorites */}
            <Link
              to={createPageUrl("Favorites")}
              className="hidden sm:flex items-center justify-center p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title={lang === "ar" ? "المفضلة" : lang === "fr" ? "Favoris" : "Favorites"}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Language Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-gray-600 text-xs px-2 h-9 hover:bg-gray-100">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => changeLang("en")} className="text-sm">
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("fr")} className="text-sm">
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ar")} className="text-sm">
                  🇩🇿 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-gray-100">
                  <User className="w-5 h-5 text-gray-600" />
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
                      <Link to={createPageUrl("TenantManagement")}>{lang === "ar" ? "إدارة المستأجرين" : lang === "fr" ? "Gestion des locataires" : "Tenant Management"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("RentalIncomeDashboard")}>{lang === "ar" ? "لوحة دخل الإيجار" : lang === "fr" ? "Revenu Locatif" : "Rental Income"}</Link>
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
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminVerification")}>{lang === "ar" ? "التحقق من الحسابات" : lang === "fr" ? "Vérifications" : "Verifications"}</Link>
                      </DropdownMenuItem>
                    )}
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

        {/* Mobile menu — only shows on md down with navbar */}
        {menuOpen && (
          <div className="hidden md:flex border-t border-gray-100 bg-white px-4 py-3 space-y-1">
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

      {/* PAGE CONTENT — with mobile header padding */}
      <main className="flex-1 pt-14 md:pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-40 flex justify-around items-center h-20 px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none">
        <Link to={createPageUrl("Home")} className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500 select-none">
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">{lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home"}</span>
        </Link>
        <Link to={createPageUrl("Listings")} className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500 select-none">
          <Search className="w-5 h-5" />
          <span className="text-xs font-medium">{lang === "ar" ? "بحث" : lang === "fr" ? "Chercher" : "Search"}</span>
        </Link>
        <Link to={createPageUrl("Messages")} className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500 select-none">
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">{lang === "ar" ? "رسائل" : lang === "fr" ? "Messages" : "Messages"}</span>
        </Link>
        <Link to={createPageUrl("Profile")} className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500 select-none">
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">{lang === "ar" ? "ملفي" : lang === "fr" ? "Profil" : "Profile"}</span>
        </Link>
      </nav>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 pt-10 pb-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" className="w-6 h-6" />
                <span className="font-bold text-white">{lang === "ar" ? "دار الجزائر" : "Dar Al Djazair"}</span>
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