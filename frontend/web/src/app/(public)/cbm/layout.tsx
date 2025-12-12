'use client';

import { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import ProductTabs from '@/components/products/ProductTabs';
import type { TabItem } from '@unik/shared/types';

const defaultTabs: TabItem[] = [
  { id: 'overview', label: 'Overview', path: 'overview', isVisible: true, order: 0 },
  { id: 'schedule', label: 'Schedule', path: 'schedule', isVisible: true, order: 1 },
  { id: 'itinerary', label: 'Itinerary', path: 'itinerary', isVisible: true, order: 2 },
  { id: 'gallery', label: 'Gallery', path: 'gallery', isVisible: true, order: 3 },
];

export default function CbmLayout({ children }: { children: React.ReactNode }) {
  const { navItems } = useNavigation();
  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);

  useEffect(() => {
    // Find Tour nav item and get Cherry Blossom tabs from its children
    const tourItem = navItems.find((item) => item.href === '/tour');
    const cbmItem = tourItem?.children?.find((child) => child.href === '/cbm');
    if (cbmItem?.tabs && cbmItem.tabs.length > 0) {
      setTabs(cbmItem.tabs);
    }
  }, [navItems]);

  return (
    <>
      <ProductTabs basePath="/cbm" tabs={tabs} />
      {children}
    </>
  );
}


