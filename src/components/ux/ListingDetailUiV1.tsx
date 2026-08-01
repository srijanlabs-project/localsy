import React, { useMemo, useState } from 'react';
import { Clock3, ExternalLink, Globe, Mail, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Business, Category, Locality, Review, UserSession } from '../../types';
import {
  FeaturedBusinessCard,
  LocalisyPreviewHeader,
  PageContainer,
  SidebarCard,
  ThemePage,
  formatRating,
  getLocalityContext,
} from './localisyPublicPrimitives';

type ListingDetailUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  reviews: Review[];
  userSession: UserSession;
  businessId?: string;
  onOpenLivePortal: () => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onRequestAuth: () => void;
  onSubmitReview: (businessId: string, userName: string, userPhone: string, rating: number, comment: string) => void;
};

export default function ListingDetailUiV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
  reviews,
  userSession,
  businessId,
  onOpenLivePortal,
  onOpenListingPage,
  onRequestAuth,
  onSubmitReview,
}: ListingDetailUiV1Props) {
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState('');
  const activeLocality = useMemo(() => (
    localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null
  ), [activeLocalityId, localities]);

  const { localityLabel, fullLocationLabel } = getLocalityContext(activeLocality);

  const approvedBusinesses = useMemo(() => (
    businesses.filter((business) => business.localityId === activeLocality?.id && business.status === 'approved')
  ), [activeLocality?.id, businesses]);

  const primaryBusiness = useMemo(() => {
    if (businessId) {
      const explicit = approvedBusinesses.find((business) => business.id === businessId);
      if (explicit) return explicit;
    }
    return [...approvedBusinesses].sort((left, right) => {
      const leftScore = (left.featured ? 4 : 0) + left.rating + (left.reviewCount / 50);
      const rightScore = (right.featured ? 4 : 0) + right.rating + (right.reviewCount / 50);
      return rightScore - leftScore;
    })[0] || null;
  }, [approvedBusinesses, businessId]);

  const relatedBusinesses = useMemo(() => (
    approvedBusinesses
      .filter((business) => business.id !== primaryBusiness?.id && business.categoryId === primaryBusiness?.categoryId)
      .slice(0, 3)
  ), [approvedBusinesses, primaryBusiness?.categoryId, primaryBusiness?.id]);

  const businessReviews = useMemo(() => (
    reviews
      .filter((review) => review.businessId === primaryBusiness?.id)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  ), [primaryBusiness?.id, reviews]);

  const categoryLabel = categories.find((category) => category.id === primaryBusiness?.categoryId)?.name
    || primaryBusiness?.sourceCategoryLabel
    || 'Local business';

  const canSubmitReview = userSession.isAuthenticated && Boolean(userSession.userPhone);

  const handleReviewSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedComment = draftComment.trim();
    if (!primaryBusiness || !userSession.userPhone || !userSession.userName || !normalizedComment) return;
    onSubmitReview(primaryBusiness.id, userSession.userName, userSession.userPhone, draftRating, normalizedComment);
    setDraftComment('');
    setDraftRating(5);
  };

  if (!primaryBusiness) {
    return (
      <ThemePage>
        <PageContainer>
          <LocalisyPreviewHeader locationLabel={fullLocationLabel} onOpenLivePortal={onOpenLivePortal} />
          <div className="mt-5 rounded-[26px] border border-slate-200 bg-white px-8 py-16 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="text-2xl font-bold text-slate-950">No listing available for preview</div>
          </div>
        </PageContainer>
      </ThemePage>
    );
  }

  const heroImage = primaryBusiness.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80';

  return (
    <ThemePage>
      <PageContainer>
        <LocalisyPreviewHeader locationLabel={fullLocationLabel} onOpenLivePortal={onOpenLivePortal} />

        <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="px-8 py-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
                {categoryLabel}
              </div>
              <h1 className="mt-5 text-[3.2rem] font-black leading-[0.96] tracking-[-0.06em] text-[#0D1B2A]">
                {primaryBusiness.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{formatRating(primaryBusiness.rating)}</span>
                  <span className="text-slate-400">({primaryBusiness.reviewCount} reviews)</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#1E3A8A]" />
                  <span>{primaryBusiness.address}</span>
                </div>
              </div>

              <p className="mt-6 max-w-[560px] text-[1rem] leading-8 text-slate-600">
                {primaryBusiness.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#eef8f1] px-4 py-2 text-sm font-semibold text-[#1b8f5f]">
                  {primaryBusiness.verifiedBadge ? 'Verified listing' : 'Trusted listing'}
                </span>
                <span className="rounded-full bg-[#FFF4CC] px-4 py-2 text-sm font-semibold text-[#0D1B2A]">
                  {primaryBusiness.responseTime || 'Fast response'}
                </span>
                <span className="rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#1E3A8A]">
                  {primaryBusiness.kycStatus === 'verified' ? 'KYC verified' : 'KYC in progress'}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Contact</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-[#1E3A8A]" />
                      <span>{primaryBusiness.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#1E3A8A]" />
                      <span>{primaryBusiness.email || 'contact@localisy.example'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-[#1E3A8A]" />
                      <span>{primaryBusiness.website || 'www.localisy.example'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Operational info</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-4 w-4 text-[#1E3A8A]" />
                      <span>{primaryBusiness.hours || 'Mon-Sat, 9:00 AM - 8:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-[#1b8f5f]" />
                      <span>{primaryBusiness.customerSatisfaction || 94}% satisfaction score</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-[#1E3A8A]" />
                      <span>{primaryBusiness.repeatCustomerScore || 62}% repeat customer score</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[22px] border border-[#FFD54F]/40 bg-[linear-gradient(90deg,#fff9df_0%,#fff5f9_100%)] px-6 py-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[1.15rem] font-bold tracking-[-0.03em] text-slate-950">Listing detail is a trust conversion page</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      This screen should become the main destination for SEO, WhatsApp shares, and direct local discovery.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[340px] bg-slate-100">
              <img src={heroImage} alt={primaryBusiness.name} className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.9fr_0.95fr]">
          <div>
            <div className="text-[1.8rem] font-black tracking-[-0.04em] text-slate-950">Related businesses in {localityLabel}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {relatedBusinesses.map((business) => (
                <div key={business.id}>
                  <FeaturedBusinessCard business={business} localityLabel={localityLabel} onOpenDetails={(nextBusinessId) => onOpenListingPage(nextBusinessId, business.localityId)} />
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <SidebarCard title={`Verified reviews (${businessReviews.length})`}>
              <div className="space-y-3">
                {businessReviews.length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    No verified reviews yet. Be the first to share a trusted local experience.
                  </div>
                ) : (
                  businessReviews.slice(0, 4).map((review) => (
                    <div key={review.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{review.userName}</div>
                          <div className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                      {review.verifiedByOtp ? (
                        <div className="mt-3 inline-flex rounded-full bg-[#eef8f1] px-3 py-1 text-[11px] font-semibold text-[#1b8f5f]">
                          OTP verified
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </SidebarCard>

            <SidebarCard title="Why this listing ranks">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>High rating, verified trust signals, strong reviews, and locality relevance improve visibility here.</p>
                <p>Future versions can also include sponsored boosts, response quality, and recent engagement signals.</p>
              </div>
            </SidebarCard>

            <SidebarCard title="Write a review">
              {canSubmitReview ? (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setDraftRating(starValue)}
                        className="text-amber-500 transition hover:scale-105"
                      >
                        <Star className={`h-5 w-5 ${draftRating >= starValue ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={draftComment}
                    onChange={(event) => setDraftComment(event.target.value)}
                    rows={4}
                    placeholder="Share your verified local experience..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  >
                    Submit verified review
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Sign in with your verified mobile number to submit a trusted review for this business.
                  </p>
                  <button
                    type="button"
                    onClick={onRequestAuth}
                    className="inline-flex rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  >
                    Sign in to review
                  </button>
                </div>
              )}
            </SidebarCard>

            <SidebarCard title="Listing attributes">
              <div className="flex flex-wrap gap-3">
                {(primaryBusiness.tags || []).slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </PageContainer>
    </ThemePage>
  );
}
