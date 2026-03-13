import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * Shows a verification prompt banner:
 * - On ALL pages if the user has at least one listing
 * - Only on the Profile page if the user has no listings
 * Never shown to verified users.
 */
export default function VerificationBanner({ user, lang }) {
  const location = useLocation();
  const [hasListings, setHasListings] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('verify_banner_dismissed') === '1');

  useEffect(() => {
    if (!user || user.is_verified || dismissed) return;
    base44.entities.Listing.filter({ created_by: user.email }, '', 1)
      .then(data => setHasListings(data.length > 0))
      .catch(() => setHasListings(false));
  }, [user?.email, dismissed]);

  if (!user || user.is_verified || dismissed || hasListings === null) return null;

  const isProfilePage = location.pathname.toLowerCase().includes('/profile');
  if (!hasListings && !isProfilePage) return null;

  function dismiss() {
    sessionStorage.setItem('verify_banner_dismissed', '1');
    setDismissed(true);
  }

  const profileHref = createPageUrl('Profile');
  const isRtl = lang === 'ar';

  const msg = {
    en: 'Verify your identity to build trust and get more visibility.',
    fr: 'Vérifiez votre identité pour inspirer confiance et gagner en visibilité.',
    ar: 'تحقق من هويتك لبناء الثقة والحصول على رؤية أكبر.',
  };
  const cta = { en: 'Verify now', fr: 'Vérifier maintenant', ar: 'تحقق الآن' };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-3 text-sm"
    >
      <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-amber-800 flex-1 leading-snug">{msg[lang] || msg.en}</span>
      <a
        href={profileHref}
        className="font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap flex-shrink-0"
      >
        {cta[lang] || cta.en}
      </a>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-amber-400 hover:text-amber-600 flex-shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}