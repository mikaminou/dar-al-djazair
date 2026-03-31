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
  const [fullName, setFullName] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [accountType, setAccountType] = useState(user?.role === 'professional' ? 'professional' : 'user');
  const [agencyName, setAgencyName] = useState(user?.agency_name || '');
  const [professionalType, setProfessionalType] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  const t = {
    title:            { en: 'Complete your profile', fr: 'Complétez votre profil', ar: 'أكمل ملفك الشخصي' },
    subtitle:         { en: 'Tell us a bit about yourself to get started.', fr: 'Dites-nous qui vous êtes pour commencer.', ar: 'أخبرنا قليلاً عن نفسك للبدء.' },
    fullName:         { en: 'Full Name', fr: 'Nom complet', ar: 'الاسم الكامل' },
    ownerFullName:    { en: 'Owner Name', fr: 'Nom du propriétaire', ar: 'اسم المالك' },
    accountType:      { en: 'Account Type', fr: 'Type de compte', ar: 'نوع الحساب' },
    individual:       { en: 'Individual', fr: 'Particulier', ar: 'فرد' },
    professional:     { en: 'Promoteur / Agence', fr: 'Promoteur / Agence', ar: 'مرقي / وكالة' },
    agencyName:       { en: 'Business Name', fr: "Nom de l'entreprise", ar: 'اسم النشاط التجاري' },
    professionalType: { en: 'Professional Type', fr: 'Type de professionnel', ar: 'نوع المحترف' },
    agenceImmobiliere:{ en: 'Real Estate Agency', fr: 'Agence immobilière', ar: 'وكالة عقارية' },
    promoteur:        { en: 'Property Developer', fr: 'Promoteur immobilier', ar: 'مرقي عقاري' },
    yearsOfExp:       { en: 'Years of Experience', fr: "Années d'expérience", ar: 'سنوات الخبرة' },
    avatar:           { en: 'Profile Photo', fr: 'Photo de profil', ar: 'صورة الملف الشخصي' },
    optional:         { en: 'Optional', fr: 'Facultatif', ar: 'اختياري' },
    note:             { en: 'Account type cannot be changed after this step.', fr: 'Le type de compte ne peut pas être modifié après cette étape.', ar: 'لا يمكن تغيير نوع الحساب بعد هذه الخطوة.' },
    save:             { en: 'Get Started', fr: 'Commencer', ar: 'ابدأ' },
    required:         { en: 'This field is required.', fr: 'Ce champ est obligatoire.', ar: 'هذا الحقل مطلوب.' },
  };
  const tx = k => t[k]?.[lang] || t[k]?.en;
  const isRtl = lang === 'ar';

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setUploadingAvatar(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (accountType === 'professional') {
      if (!ownerFullName.trim()) errs.ownerFullName = tx('required');
      if (!agencyName.trim()) errs.agencyName = tx('required');
      if (!professionalType) errs.professionalType = tx('required');
    } else {
      if (!fullName.trim()) errs.fullName = tx('required');
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const updates = {};
    if (accountType === 'professional') {
      updates.owner_full_name = ownerFullName.trim();
      updates.first_name = ownerFullName.trim();
      updates.agency_name = agencyName.trim();
      if (professionalType) updates.professional_type = professionalType;
      if (yearsOfExperience) updates.years_of_experience = Number(yearsOfExperience);
    } else {
      updates.first_name = fullName.trim();
    }
    if (avatarUrl) updates.avatar_url = avatarUrl;

    try {
      await base44.auth.updateMe(updates);
      onComplete({ ...user, ...updates });
    } finally {
      setSaving(false);
    }
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
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-emerald-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-gray-400" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">{tx('avatar')} ({tx('optional')})</span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name fields */}
          {accountType === 'professional' ? (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('ownerFullName')} *</label>
              <Input value={ownerFullName} onChange={e => { setOwnerFullName(e.target.value); setErrors(prev => ({ ...prev, ownerFullName: undefined })); }} placeholder={tx('ownerFullName')} className={errors.ownerFullName ? 'border-red-400' : ''} />
              {errors.ownerFullName && <p className="text-xs text-red-500 mt-1">{errors.ownerFullName}</p>}
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('fullName')} *</label>
              <Input value={fullName} onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: undefined })); }} placeholder={tx('fullName')} className={errors.fullName ? 'border-red-400' : ''} />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>
          )}

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
                onClick={() => setAccountType('professional')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${accountType === 'professional' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-medium">{tx('professional')}</span>
              </button>
            </div>
          </div>

          {/* Agency Name + Professional Details */}
          {accountType === 'professional' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('agencyName')} *</label>
                <Input value={agencyName} onChange={e => { setAgencyName(e.target.value); setErrors(prev => ({ ...prev, agencyName: undefined })); }} placeholder={tx('agencyName')} className={errors.agencyName ? 'border-red-400' : ''} />
                {errors.agencyName && <p className="text-xs text-red-500 mt-1">{errors.agencyName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('professionalType')}</label>
                  <select value={professionalType} onChange={e => { setProfessionalType(e.target.value); setErrors(prev => ({ ...prev, professionalType: undefined })); }} className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.professionalType ? 'border-red-400' : 'border-gray-200'}`}>
                    <option value="">—</option>
                    <option value="agence_immobiliere">{tx('agenceImmobiliere')}</option>
                    <option value="promoteur">{tx('promoteur')}</option>
                  </select>
                  {errors.professionalType && <p className="text-xs text-red-500 mt-1">{errors.professionalType}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{tx('yearsOfExp')}</label>
                  <Input type="number" min="0" max="60" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} placeholder="0" />
                </div>
              </div>
            </>
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