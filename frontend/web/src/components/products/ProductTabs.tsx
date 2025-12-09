'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import type { TabItem } from '@unik/shared/types';

interface ProductTabsProps {
  basePath: string; // e.g., '/tour/courtside'
  tabs: TabItem[];
}

export default function ProductTabs({ basePath, tabs }: ProductTabsProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const visibleTabs = tabs
    .filter(tab => tab.isVisible)
    .sort((a, b) => a.order - b.order);

  const isActive = (tabPath: string) => {
    if (tabPath === 'overview') {
      return pathname === basePath || pathname === `${basePath}/overview`;
    }
    return pathname === `${basePath}/${tabPath}`;
  };

  return (
    <div 
      className="border-b sticky top-20 z-40 backdrop-blur-lg"
      style={{ 
        backgroundColor: `${theme.navbarBg}f5`,
        borderBottomColor: theme.cardBg 
      }}
    >
      <div className="container-custom">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
          {visibleTabs.map((tab) => {
            const active = isActive(tab.path);
            const href = tab.path === 'overview' ? basePath : `${basePath}/${tab.path}`;
            
            return (
              <Link
                key={tab.id}
                href={href}
                className="relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200"
                style={{
                  color: active ? theme.goldColor : theme.mutedText,
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.color = theme.headingText)}
                onMouseLeave={(e) => !active && (e.currentTarget.style.color = theme.mutedText)}
              >
                {tab.label}
                {active && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: theme.goldColor }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

