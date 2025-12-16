'use client';

import { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import ProductTabs from '@/components/products/ProductTabs';
import type { TabItem } from '@unik/shared/types';

const defaultTabs: TabItem[] = [
  { id: 'overview', label: 'Overview', path: 'overview', isVisible: true, order: 0 },
  { id: 'itinerary', label: 'Itinerary', path: 'itinerary', isVisible: true, order: 1 },
  { id: 'players', label: 'Players', path: 'players', isVisible: true, order: 2 },
  { id: 'gallery', label: 'Gallery', path: 'gallery', isVisible: true, order: 3 },
];

export default function CourtsideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { navItems } = useNavigation();
  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);

  useEffect(() => {
    // Find Courtside nav item and get its tabs
    const tourItem = navItems.find(item => item.href === '/tour');
    const courtsideItem = tourItem?.children?.find(child => child.href === '/tour/courtside');
    
    if (courtsideItem?.tabs && courtsideItem.tabs.length > 0) {
      // Force-remove schedule tab (content moved to itinerary)
      setTabs(courtsideItem.tabs.filter(t => t.id !== 'schedule' && t.path !== 'schedule'));
    }
  }, [navItems]);

  return (
    <>
      <ProductTabs basePath="/tour/courtside" tabs={tabs} />
      {children}
    </>
  );
}








