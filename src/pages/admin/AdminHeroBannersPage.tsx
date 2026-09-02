import React, { useMemo, useState } from 'react';
import type { HeroBanner, HomepageDefaultsConfigState, Locality, UserSession } from '../../types';
import HeroBannerManagerPanel from '../../components/admin/HeroBannerManagerPanel';
import { getMediaProxyUrl } from '../../utils/mediaUrl';
import {
  buildHeroStatDraftsFromTemplates,
  getFutureDateIso,
  getHeroBannerDraftDefaults,
  parseIdList,
  parsePincodeList,
  slugifyForPath,
  uploadAdminMediaImage,
} from '../../services/admin/adminConsoleUtils';

type AdminHeroBannersPageProps = {
  localities: Locality[];
  heroBanners?: HeroBanner[];
  homepageDefaultsConfig?: HomepageDefaultsConfigState;
  userSession?: UserSession;
  onCreateHeroBanner?: (banner: Omit<HeroBanner, 'id'>) => void;
  onUpdateHeroBanner?: (banner: HeroBanner) => void;
  onDeleteHeroBanner?: (bannerId: string) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.15 "Homepage CMS: Hero Banners" —
// Section 9 build step 4. This is the simplest of the six Homepage CMS pages: the legacy
// console's 'hero' subtab (AdminConsole.tsx lines ~6391-6432) was already a single
// self-contained, fully-controlled <HeroBannerManagerPanel> — this page just owns fresh
// local state for the same draft fields and reuses the panel + the existing
// onCreateHeroBanner/onUpdateHeroBanner/onDeleteHeroBanner callback props, unchanged
// behavior, new location. The legacy console's own Homepage CMS > Hero Banners tab is left
// completely untouched.
export default function AdminHeroBannersPage({
  localities,
  heroBanners = [],
  homepageDefaultsConfig,
  userSession,
  onCreateHeroBanner,
  onUpdateHeroBanner,
  onDeleteHeroBanner,
}: AdminHeroBannersPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const draftDefaults = useMemo(() => getHeroBannerDraftDefaults(homepageDefaultsConfig), [homepageDefaultsConfig]);
  const statDraftDefaults = useMemo(
    () => buildHeroStatDraftsFromTemplates(homepageDefaultsConfig?.heroStatTemplates),
    [homepageDefaultsConfig]
  );

  const [heroLocalityId, setHeroLocalityId] = useState(primaryLocalityId);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroEditId, setHeroEditId] = useState<string | null>(null);
  const [heroFormError, setHeroFormError] = useState('');
  const [heroStartDate, setHeroStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [heroEndDate, setHeroEndDate] = useState(getFutureDateIso(draftDefaults.durationDays));
  const [heroCtaLabel, setHeroCtaLabel] = useState(draftDefaults.ctaLabel);
  const [heroCtaType, setHeroCtaType] = useState<NonNullable<HeroBanner['ctaType']>>(draftDefaults.ctaType);
  const [heroCtaTarget, setHeroCtaTarget] = useState(draftDefaults.ctaTarget);
  const [heroPincodes, setHeroPincodes] = useState('');
  const [heroStatsDraft, setHeroStatsDraft] = useState(() => statDraftDefaults.map((stat) => ({ ...stat })));
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredHeroBanners = useMemo(() => heroBanners, [heroBanners]);
  const heroImageFolder = `homepage-banners/hero/${slugifyForPath(heroLocalityId || 'global')}`;

  const resetHeroBannerForm = () => {
    setHeroLocalityId(primaryLocalityId);
    setHeroTitle('');
    setHeroSubtitle('');
    setHeroImageUrl('');
    setHeroImageFile(null);
    setHeroImageUploading(false);
    setHeroEditId(null);
    setHeroFormError('');
    setHeroStartDate(new Date().toISOString().slice(0, 10));
    setHeroEndDate(getFutureDateIso(draftDefaults.durationDays));
    setHeroCtaLabel(draftDefaults.ctaLabel);
    setHeroCtaType(draftDefaults.ctaType);
    setHeroCtaTarget(draftDefaults.ctaTarget);
    setHeroPincodes('');
    setHeroStatsDraft(statDraftDefaults.map((stat) => ({ ...stat })));
  };

  const beginEditHeroBanner = (hero: HeroBanner) => {
    setHeroEditId(hero.id);
    setHeroLocalityId(hero.localityId);
    setHeroTitle(hero.title);
    setHeroSubtitle(hero.subtitle);
    setHeroImageUrl(hero.imageUrl || '');
    setHeroImageFile(null);
    setHeroStartDate(hero.startDate);
    setHeroEndDate(hero.endDate);
    setHeroCtaLabel(hero.ctaLabel || draftDefaults.ctaLabel);
    setHeroCtaType(hero.ctaType || draftDefaults.ctaType);
    setHeroCtaTarget(hero.ctaTarget || draftDefaults.ctaTarget);
    setHeroPincodes((hero.pincodes || []).join(', '));
    setHeroStatsDraft(statDraftDefaults.map((fallback, index) => {
      const stat = hero.heroStats?.[index];
      return {
        enabled: stat?.enabled ?? fallback.enabled,
        label: stat?.label || fallback.label,
        value: stat?.value || fallback.value,
        localityIds: (stat?.localityIds || []).join(', '),
        pincodes: (stat?.pincodes || []).join(', '),
      };
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHeroFormError('');
    if (!heroTitle.trim() || !heroSubtitle.trim()) {
      const message = 'Please fill hero title and subtitle.';
      setHeroFormError(message);
      notify(message);
      return;
    }

    setHeroImageUploading(true);
    try {
      const uploadedImageUrl = heroImageFile
        ? await uploadAdminMediaImage(heroImageFile, heroImageFolder, userSession?.authToken)
        : getMediaProxyUrl(heroImageUrl.trim());

      if (!uploadedImageUrl) {
        const message = 'Please upload a hero image or provide a hero image URL.';
        setHeroFormError(message);
        notify(message);
        return;
      }

      const payload: Omit<HeroBanner, 'id'> = {
        localityId: heroLocalityId,
        title: heroTitle.trim(),
        subtitle: heroSubtitle.trim(),
        imageUrl: uploadedImageUrl,
        startDate: heroStartDate,
        endDate: heroEndDate,
        ctaLabel: heroCtaLabel.trim() || 'Explore Businesses',
        ctaType: heroCtaType,
        ctaTarget: heroCtaTarget.trim() || 'all',
        pincodes: parsePincodeList(heroPincodes),
        heroStats: heroStatsDraft.map((stat) => ({
          enabled: stat.enabled,
          label: stat.label.trim(),
          value: stat.value.trim(),
          localityIds: parseIdList(stat.localityIds),
          pincodes: parsePincodeList(stat.pincodes),
        })),
        isActive: true,
      };
      if (heroEditId) {
        onUpdateHeroBanner?.({ ...payload, id: heroEditId });
        notify('Hero banner updated.');
      } else {
        onCreateHeroBanner?.(payload);
        notify('Hero banner created.');
      }
      resetHeroBannerForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hero image upload failed.';
      setHeroFormError(message);
      notify(message);
    } finally {
      setHeroImageUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Hero Banners</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage hero banners and top stat cards.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}
      <HeroBannerManagerPanel
        localities={localities}
        heroBanners={heroBanners}
        filteredHeroBanners={filteredHeroBanners}
        heroLocalityId={heroLocalityId}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroImageUrl={heroImageUrl}
        heroImageUploading={heroImageUploading}
        heroEditId={heroEditId}
        heroFormError={heroFormError}
        heroStartDate={heroStartDate}
        heroEndDate={heroEndDate}
        heroCtaLabel={heroCtaLabel}
        heroCtaType={heroCtaType}
        heroCtaTarget={heroCtaTarget}
        heroPincodes={heroPincodes}
        heroStatsDraft={heroStatsDraft}
        heroPreviewImageUrl={heroImageFile ? URL.createObjectURL(heroImageFile) : heroImageUrl}
        heroImageFolder={heroImageFolder}
        onHeroLocalityIdChange={setHeroLocalityId}
        onHeroTitleChange={setHeroTitle}
        onHeroSubtitleChange={setHeroSubtitle}
        onHeroImageUrlChange={setHeroImageUrl}
        onHeroImageFileChange={setHeroImageFile}
        onHeroStartDateChange={setHeroStartDate}
        onHeroEndDateChange={setHeroEndDate}
        onHeroCtaLabelChange={setHeroCtaLabel}
        onHeroCtaTypeChange={setHeroCtaType}
        onHeroCtaTargetChange={setHeroCtaTarget}
        onHeroPincodesChange={setHeroPincodes}
        onToggleAllStats={() => setHeroStatsDraft((prev) => prev.map((stat) => ({ ...stat, enabled: !stat.enabled })))}
        onToggleStat={(index) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, enabled: !item.enabled } : item)))}
        onUpdateStatField={(index, field, value) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)))}
        onSubmit={handleSubmit}
        onReset={resetHeroBannerForm}
        onBeginEdit={beginEditHeroBanner}
        onToggleActive={(hero) => onUpdateHeroBanner?.({ ...hero, isActive: !hero.isActive })}
        onDelete={(heroId) => onDeleteHeroBanner?.(heroId)}
      />
    </div>
  );
}
