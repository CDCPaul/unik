import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { HomeConfig, HomeConfigsDoc, HomeProductKey, HomeSection } from '@unik/shared/types';

const HOME_CONFIGS_DOC_ID = 'homeConfigs';

export function createDefaultHomeConfig(productKey: HomeProductKey): HomeConfig {
  const baseSections: HomeSection[] = [
    {
      id: 'players',
      type: 'playersGrid',
      enabled: productKey === 'courtside',
      order: 10,
      props: {
        heading: 'Filipino Stars',
        subheading: 'Meet the pride of Philippines in KBL.',
        ctaText: 'View All Players',
        maxItems: 4,
      },
    } as any,
    {
      id: 'highlights',
      type: 'highlightsFromItinerary',
      enabled: productKey === 'cherry-blossom',
      order: 20,
      props: {
        heading: 'Highlights',
        subheading: 'Top moments from the itinerary.',
        maxItems: 3,
        onlyHighlighted: true,
      },
    } as any,
    {
      id: 'gallery',
      type: 'galleryPreview',
      enabled: true,
      order: 30,
      props: {
        heading: 'Tour Gallery',
        subheading: 'Sneak peek of what awaits you in Korea.',
        ctaText: 'View Full Gallery',
        maxItems: 6,
      },
    } as any,
    {
      id: 'cta',
      type: 'cta',
      enabled: true,
      order: 40,
      props: {
        heading: "Don't Miss the Action!",
        body: 'Secure your spot now for the upcoming tour. Limited seats available for this exclusive experience.',
        buttonText: 'Register Now',
      },
    } as any,
  ];

  return {
    version: 1,
    productKey,
    hero: {
      badgeText: 'Official Tour Package',
      titleText: '',
      subtitleText: '',
      titleFontFamily: 'display',
      badgeFontFamily: 'inherit',
      subtitleFontFamily: 'inherit',
      primaryCtaText: 'View Tour Details',
      secondaryCtaText: 'Book Now',
      primaryCtaFontFamily: 'inherit',
      secondaryCtaFontFamily: 'inherit',
      bgDesktopUrl: '',
      bgMobileUrl: '',
    },
    sections: baseSections,
  };
}

export async function getHomeConfigsDoc(): Promise<HomeConfigsDoc | null> {
  const refDoc = doc(db, COLLECTIONS.settings, HOME_CONFIGS_DOC_ID);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    ...data,
    updatedAt: data.updatedAt?.toDate?.(),
  } as HomeConfigsDoc;
}

export async function getHomeConfigAdmin(productKey: HomeProductKey): Promise<HomeConfig> {
  const docData = await getHomeConfigsDoc();
  const cfg = docData?.configs?.[productKey];
  if (cfg) return cfg;
  return createDefaultHomeConfig(productKey);
}

export async function saveHomeConfig(productKey: HomeProductKey, config: HomeConfig): Promise<void> {
  const refDoc = doc(db, COLLECTIONS.settings, HOME_CONFIGS_DOC_ID);
  await setDoc(
    refDoc,
    {
      configs: {
        [productKey]: config,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function uploadHomeHeroBackground(
  file: File,
  productKey: HomeProductKey,
  device: 'desktop' | 'mobile'
): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const storageRef = ref(storage, `settings/homeConfigs/hero/${productKey}/${device}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}


