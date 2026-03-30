import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Search, Heart, MessageSquare, Plus, User, Menu, X, Globe, ChevronDown, Home, MoreVertical } from "lucide-react";
import UserAvatar from "./components/UserAvatar";
import { LanguageProvider, useLang } from "./components/LanguageContext";
import SavedSearchAlerts from "./components/SavedSearchAlerts";
import ThemeToggle from "./components/ThemeToggle";
import NotificationBell from "./components/notifications/NotificationBell";
import OnboardingModal from "./components/OnboardingModal";
import VerificationBanner from "./components/VerificationBanner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function NavContent({ currentPageName, children }) {
  const { t, lang, changeLang } = useLang();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUser(u);
        if (!u.full_name) setShowOnboarding(true);
      }
    }).catch(() => {});
  }, []);

  // Global presence heartbeat — runs on every page so online status is accurate
  useEffect(() => {
    if (!user) return;
    async function ping() {
      const { base44: b44 } = await import('@/api/base44Client');
      const now = new Date().toISOString();
      const existing = await b44.entities.UserPresence.filter({ user_email: user.email }).catch(() => []);
      if (existing.length > 0) {
        b44.entities.UserPresence.update(existing[0].id, { last_seen: now }).catch(() => {});
      } else {
        b44.entities.UserPresence.create({ user_email: user.email, last_seen: now }).catch(() => {});
      }
    }
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isPro = user?.role === "professional" || user?.role === "admin";

  const navLinks = [
    { label: t.buy, href: createPageUrl("Listings") + "?listing_type=sale" },
    { label: t.rent, href: createPageUrl("Listings") + "?listing_type=rent" },
    ...(isPro ? [{ label: t.sell, href: createPageUrl("PostListing") }] : []),
  ];

  const isRtl = lang === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0f1115] pb-20 md:pb-0 select-none">
      <style>{`
        :root { --primary: #059669; }
        body { font-family: ${isRtl ? "'Cairo', 'Amiri', sans-serif" : "'Inter', sans-serif"}; overscroll-behavior: none; }
        .content-text { user-select: text; }
      `}</style>

      {/* NAVBAR — hidden on mobile */}
      <header className="hidden md:block bg-white dark:bg-[#13161c] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm dark:shadow-none select-none">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3 md:gap-4">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 flex-shrink-0 min-w-fit min-h-[44px] select-none rounded">
            <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" className="w-8 h-8" />
            <span className="hidden sm:inline font-bold text-lg text-emerald-700">{lang === "ar" ? "دار الجزائر" : "Dar Al Djazair"}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center select-none">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="px-3 py-2 min-h-[44px] flex items-center text-sm font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 ml-auto select-none">
            {/* Action Buttons */}
            <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Plus className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 select-none">
                <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                  <Link to={createPageUrl("PostListing")} onClick={() => setCreateMenuOpen(false)}>
                    {lang === "ar" ? "إضافة عقار" : lang === "fr" ? "Ajouter un bien" : "List a Property"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isPro && (
            <Link
              to={createPageUrl("PostListing")}
              className="hidden md:flex items-center justify-center gap-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 rounded-lg transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">{t.postListing}</span>
            </Link>
            )}

            {/* Notifications */}
            <NotificationBell user={user} lang={lang} />

            {/* Messages */}
            <Link
              to={createPageUrl("Messages")}
              className="hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title={lang === "ar" ? "الرسائل" : lang === "fr" ? "Messages" : "Messages"}
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            {/* Favorites */}
            <Link
              to={createPageUrl("Favorites")}
              className="hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title={lang === "ar" ? "المفضلة" : lang === "fr" ? "Favoris" : "Favorites"}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle lang={lang} />

            {/* Language Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-gray-600 text-xs px-2 h-11 min-w-[44px] hover:bg-gray-100 select-none">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 select-none">
                <DropdownMenuItem onClick={() => changeLang("en")} className="text-sm min-h-[44px] flex items-center select-none">
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("fr")} className="text-sm min-h-[44px] flex items-center select-none">
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ar")} className="text-sm min-h-[44px] flex items-center select-none">
                  🇩🇿 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full min-h-[44px] min-w-[44px] hover:bg-gray-100 select-none p-0.5">
                  {user ? <UserAvatar user={user} size="sm" /> : <User className="w-5 h-5 text-gray-600" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 select-none">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 truncate">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Profile")}>{lang === "ar" ? "ملفي الشخصي" : lang === "fr" ? "Mon profil" : "My Profile"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Appointments")}>{lang === "ar" ? "مواعيدي" : lang === "fr" ? "Mes Rendez-vous" : "My Appointments"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("SavedSearches")}>{lang === "ar" ? "بحوثي المحفوظة" : lang === "fr" ? "Mes recherches" : "Saved Searches"}</Link>
                    </DropdownMenuItem>
                    {isPro && (<>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("MyListings")}>{t.myListings}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Leads")}>{lang === "ar" ? "العملاء المحتملون" : lang === "fr" ? "Mes Leads" : "My Leads"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("OwnerDashboard")}>{lang === "ar" ? "لوحة التحليلات" : lang === "fr" ? "Tableau de bord" : "Analytics Dashboard"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Availability")}>{lang === "ar" ? "مواعيد الزيارة" : lang === "fr" ? "Mes Disponibilités" : "My Availability"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("TenantManagement")}>{lang === "ar" ? "إدارة المستأجرين" : lang === "fr" ? "Gestion des locataires" : "Tenant Management"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("RentalIncomeDashboard")}>{lang === "ar" ? "لوحة دخل الإيجار" : lang === "fr" ? "Revenu Locatif" : "Rental Income"}</Link>
                    </DropdownMenuItem>
                    </>)}
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Favorites")}>{t.favorites}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                      <Link to={createPageUrl("Messages")}>{t.messages}</Link>
                    </DropdownMenuItem>
                    {/* These are inside the user ? block so they only render when logged in */}
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                        <Link to={createPageUrl("AdminVerification")}>{lang === "ar" ? "التحقق من الحسابات" : lang === "fr" ? "Vérifications" : "Verifications"}</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-500 min-h-[44px] flex items-center select-none">
                      {t.signOut}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => base44.auth.redirectToLogin()} className="min-h-[44px] flex items-center select-none">
                    {t.signIn}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Create Plus Menu */}
            <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="md:hidden min-h-[44px] min-w-[44px] text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 select-none">
                <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
                  <Link to={createPageUrl("PostListing")} onClick={() => setCreateMenuOpen(false)}>
                    {lang === "ar" ? "إضافة عقار" : lang === "fr" ? "Ajouter un bien" : "List a Property"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile menu — only shows on md down with navbar */}
        {menuOpen && (
          <div className="hidden md:flex border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13161c] px-4 py-3 space-y-1 select-none">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:bg-emerald-50 rounded-lg">
                {link.label}
              </a>
            ))}
            <Link to={createPageUrl("Favorites")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <Heart className="w-4 h-4" /> {t.favorites}
            </Link>
            <Link to={createPageUrl("Messages")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <MessageSquare className="w-4 h-4" /> {t.messages}
            </Link>
            <Link to={createPageUrl("MyListings")} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-emerald-50 rounded-lg w-full text-left">
              <User className="w-4 h-4" /> {t.myListings}
            </Link>
          </div>
        )}
      </header>

      <SavedSearchAlerts />
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          lang={lang}
          onComplete={updatedUser => { setUser(updatedUser); setShowOnboarding(false); }}
        />
      )}
      <VerificationBanner user={user} lang={lang} />

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#13161c] border-b border-gray-100 dark:border-gray-800 z-30 h-14 flex items-center justify-between px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center">
          <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" className="w-6 h-6" />
          <span className="ml-2 font-bold text-sm text-emerald-700">{lang === "ar" ? "دار الجزائر" : "Dar Al Djazair"}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell user={user} lang={lang} />
          {/* More menu in top bar */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg min-h-[44px] min-w-[44px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 select-none">
            <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
              <Link to={createPageUrl("Favorites")}>{t.favorites}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
              <Link to={createPageUrl("SavedSearches")}>{lang === "ar" ? "بحوثي المحفوظة" : lang === "fr" ? "Mes recherches" : "Saved Searches"}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
              <Link to={createPageUrl("Appointments")}>{lang === "ar" ? "مواعيدي" : lang === "fr" ? "Mes Rendez-vous" : "My Appointments"}</Link>
            </DropdownMenuItem>
            {isPro && (<>
            <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
              <Link to={createPageUrl("MyListings")}>{t.myListings}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-[44px] flex items-center select-none">
              <Link to={createPageUrl("Leads")}>{lang === "ar" ? "العملاء المحتملون" : lang === "fr" ? "Mes Leads" : "My Leads"}</Link>
            </DropdownMenuItem>
            </>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-500 min-h-[44px] flex items-center select-none">
              {t.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* PAGE CONTENT — with mobile header padding and bottom nav space */}
      <main className="flex-1 pt-16 md:pt-[max(1rem,env(safe-area-inset-top))] pb-24 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV — Floating Pill with Centered Plus Button */}
      <nav className="fixed bottom-4 left-4 right-4 md:hidden z-40 select-none">
        <div className="bg-white dark:bg-[#13161c] border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg dark:shadow-2xl flex justify-around items-center px-2 py-3">
          {/* Home */}
          <Link 
            to={createPageUrl("Home")} 
            className={`flex flex-col items-center justify-center gap-1 min-h-[50px] min-w-[50px] rounded-2xl transition-all ${
              location.pathname === createPageUrl("Home") 
                ? "text-emerald-500" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home"}</span>
          </Link>

          {/* Search */}
          <Link 
            to={createPageUrl("Listings")} 
            className={`flex flex-col items-center justify-center gap-1 min-h-[50px] min-w-[50px] rounded-2xl transition-all ${
              location.pathname === createPageUrl("Listings")
                ? "text-emerald-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{lang === "ar" ? "بحث" : lang === "fr" ? "Chercher" : "Search"}</span>
          </Link>

          {/* Centered Plus Button */}
          <div className="relative -top-6">
            {isPro ? (
            <Link 
              to={createPageUrl("PostListing")} 
              className="flex items-center justify-center h-14 w-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-7 h-7" />
            </Link>
            ) : (
            <div className="flex items-center justify-center h-14 w-14 bg-gray-200 text-gray-400 rounded-full shadow-lg cursor-not-allowed">
              <Plus className="w-7 h-7" />
            </div>
            )}
          </div>

          {/* Messages */}
          <Link 
            to={createPageUrl("Messages")} 
            className={`flex flex-col items-center justify-center gap-1 min-h-[50px] min-w-[50px] rounded-2xl transition-all ${
              location.pathname === createPageUrl("Messages")
                ? "text-emerald-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{lang === "ar" ? "رسائل" : lang === "fr" ? "Messages" : "Inbox"}</span>
          </Link>

          {/* Profile */}
          <Link 
            to={createPageUrl("Profile")} 
            className={`flex flex-col items-center justify-center gap-1 min-h-[50px] min-w-[50px] rounded-2xl transition-all ${
              location.pathname === createPageUrl("Profile")
                ? "text-emerald-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{lang === "ar" ? "ملفي" : lang === "fr" ? "Profil" : "Profile"}</span>
          </Link>
        </div>
      </nav>

      {/* FOOTER — hidden on mobile for logged-in users unless on home */}
      {(!user || location.pathname === "/" || location.pathname === createPageUrl("Home")) && (
        <footer className="bg-gray-900 dark:bg-[#0a0c10] text-gray-400 pt-10 pb-5">
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
      )}
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