'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GalleryImage, HomeConfig, HomeProductKey, Player, TourPackage } from '@unik/shared/types';
import HomeRenderer from '@/components/homebuilder/HomeRenderer';
import { useSettings } from '@/context/SettingsContext';
import { getGalleryImages } from '@/lib/services/gallery';
import { subscribeHomeConfig } from '@/lib/services/homeConfigs';
import { getPlayers } from '@/lib/services/players';
import { getTours } from '@/lib/services/tours';

function buildFallbackHomeConfig(productKey: HomeProductKey, tour: TourPackage, settings: any | null): HomeConfig {
  const homeText = settings?.homePageText;
  const heroTitle = settings?.heroTitle;

  return {
    version: 1,
    productKey,
    hero: {
      badgeText: homeText?.heroBadgeText || 'Official Tour Package',
      titleText: heroTitle?.text || '',
      titleFontFamily: heroTitle?.fontFamily || 'display',
      subtitleText: homeText?.heroSubtitleText || '',
      primaryCtaText: homeText?.primaryCtaText || 'View Tour Details',
      secondaryCtaText: homeText?.secondaryCtaText || 'Book Now',
      bgDesktopUrl: '',
      bgMobileUrl: '',
    },
    sections: [
      {
        id: 'playersGrid',
        type: 'playersGrid',
        enabled: true,
        order: 10,
        props: {
          heading: homeText?.featuredPlayersHeading || 'Filipino Stars',
          subheading: homeText?.featuredPlayersSubheading || '',
          ctaText: homeText?.featuredPlayersCtaText || 'View All Players',
          maxItems: 4,
        },
      },
      {
        id: 'galleryPreview',
        type: 'galleryPreview',
        enabled: true,
        order: 20,
        props: {
          heading: homeText?.galleryHeading || 'Tour Gallery',
          subheading: homeText?.gallerySubheading || '',
          ctaText: homeText?.galleryCtaText || 'View Full Gallery',
          maxItems: 6,
        },
      },
      {
        id: 'cta',
        type: 'cta',
        enabled: true,
        order: 30,
        props: {
          heading: homeText?.ctaHeading || "Don't Miss the Action!",
          body: homeText?.ctaBody || '',
          buttonText: homeText?.ctaButtonText || 'Register Now',
        },
      },
    ],
    // keep to satisfy type, even if not set
    updatedAt: tour.updatedAt,
  } as HomeConfig;
}

export default function HomePage() {
  const { settings } = useSettings();
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);

  const forcedProductKey: HomeProductKey | null = useMemo(() => {
    const v = (settings as any)?.homeFeaturedProductKey;
    console.log('[HomePage] homeFeaturedProductKey from settings:', v);
    if (!v || v === 'auto') return null;
    if (v === 'courtside' || v === 'cherry-blossom' || v === 'default') return v;
    return null;
  }, [settings]);

  const featuredProductKeyFromTour: HomeProductKey = useMemo(() => {
    if (!tour) return 'default';
    if (tour.productCategory === 'courtside' || tour.productId?.startsWith('courtside')) return 'courtside';
    if (tour.productCategory === 'cherry-blossom' || tour.productId?.includes('cherry')) return 'cherry-blossom';
    return 'default';
  }, [tour]);

  const effectiveProductKey: HomeProductKey = forcedProductKey || featuredProductKeyFromTour;
  
  useEffect(() => {
    console.log('[HomePage] effectiveProductKey:', effectiveProductKey, '(forced:', forcedProductKey, ', fromTour:', featuredProductKeyFromTour, ')');
  }, [effectiveProductKey, forcedProductKey, featuredProductKeyFromTour]);

  useEffect(() => {
    async function loadData() {
      try {
        const [toursData, playersData, galleryData] = await Promise.all([getTours(), getPlayers(), getGalleryImages()]);

        const activeTours = toursData.filter((t) => t.isActive);
        const byProduct = forcedProductKey
          ? activeTours.filter((t) => {
              if (forcedProductKey === 'default') return true;
              return t.productCategory === forcedProductKey || t.productId?.startsWith(forcedProductKey);
            })
          : activeTours;

        const candidates = byProduct.length ? byProduct : activeTours;
        const homeTour =
          candidates.find((t) => t.isFeaturedOnHome) ||
          candidates.find((t) => t.isFeatured) ||
          candidates[0] ||
          toursData[0] ||
          null;

        setTour(homeTour);
        setPlayers(playersData);
        setGalleryImages(galleryData);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    loadData();
  }, [forcedProductKey]);

  useEffect(() => {
    if (!tour) return;
    const unsubscribe = subscribeHomeConfig(
      effectiveProductKey,
      (cfg) => setHomeConfig(cfg),
      (err) => {
        console.error('Failed to load home config:', err);
        setHomeConfig(null);
      }
    );
    return () => unsubscribe();
  }, [tour, effectiveProductKey]);

  // Avoid showing a "placeholder hero background" that then shifts on config load.
  if (isLoading || !tour) return null;

  const effectiveConfig = homeConfig || buildFallbackHomeConfig(effectiveProductKey, tour, settings);

  return <HomeRenderer config={effectiveConfig} tour={tour} players={players} galleryImages={galleryImages} />;
}
