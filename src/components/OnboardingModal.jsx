import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Building2, Camera } from 'lucide-react';

/**
 * Shown to new users who have not yet set first_name.
 * Collects: first name, last name, account type (individual/agency).
 * Account type is stored as role and CANNOT be changed later via profile edit.
 */
export default function OnboardingModal({ user, lang, onComplete }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountType, setAccountType] = useState(user?.role === 'agency' ? 'agency' : 'user');
  const [agencyName, setAgencyName] = useState(user?.agency_name || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  const t = {
    title:       { en: 'Complete your profile', fr: 'Complétez votre profil', ar: 'أكمل ملفك الشخصي' },
    subtitle:    { en: 'Tell us a bit about yourself to get started.', fr: 'Dites-nous qui vous êtes pour commencer.', ar: 'أخبرنا قليلاً عن نفسك للبدء.' },
    firstName:   { en: 'First Name', fr: 'Prénom', ar: 'الاسم الأول' },
    lastName:    { en: 'Last Name', fr: 'Nom de famille', ar: 'اللقب' },
    accountType: { en: 'Account Type', fr: 'Type de compte', ar: 'نوع الحساب' },
    individual:  { en: 'Individual', fr: 'Particulier', ar: 'فرد' },
    agency:      { en: 'Agency', fr: 'Agence', ar: 'وكالة' },
    agencyName:  { en: 'Agency Name', fr: "Nom de l'agence", ar: 'اسم الوكالة' },
    avatar:      { en: 'Profile Photo', fr: 'Photo de profil', ar: 'صورة الملف الشخصي' },
    optional:    { en: 'Optional', fr: 'Facultatif', ar: 'اختياري' },
    note:        { en: 'Account type cannot be changed after this step.', fr: 'Le type de compte ne peut pas être modifié après cette étape.', ar: 'لا يمكن تغيير نوع الحساب بعد هذه الخطوة.' },
    save:        { en: 'Get Started', fr: 'Commencer', ar: 'ابدأ' },
    required:    { en: 'This field is required.', fr: 'Ce champ est obligatoire.', ar: 'هذا الحقل مطلوب.' },
  };
  const tx = k => t[k]?.[lang] || t[k]?.en;
  const isRtl = lang === 'ar';

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!firstName.trim()) errs.firstName = tx('required');
    if (!lastName.trim()) errs.lastName = tx('required');
    if (accountType === 'agency' && !agencyName.trim()) errs.agencyName = tx('required');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: accountType,
    };
    if (accountType === 'agency') updates.agency_name = agencyName.trim();

    await base44.auth.updateMe(updates);
    setSaving(false);
    onComplete({ ...user, ...updates });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
            <User className="w-7 h-7 text-emerald-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{tx('title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{tx('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('firstName')} *</label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={tx('firstName')} className={errors.firstName ? 'border-red-400' : ''} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('lastName')} *</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder={tx('lastName')} className={errors.lastName ? 'border-red-400' : ''} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">{tx('accountType')} *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${accountType === 'user' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">{tx('individual')}</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('agency')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${accountType === 'agency' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-medium">{tx('agency')}</span>
              </button>
            </div>
          </div>

          {/* Agency Name */}
          {accountType === 'agency' && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('agencyName')} *</label>
              <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder={tx('agencyName')} className={errors.agencyName ? 'border-red-400' : ''} />
              {errors.agencyName && <p className="text-xs text-red-500 mt-1">{errors.agencyName}</p>}
            </div>
          )}

          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{tx('note')}</p>

          <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? '...' : tx('save')}
          </Button>
        </form>
      </div>
    </div>
  );
}