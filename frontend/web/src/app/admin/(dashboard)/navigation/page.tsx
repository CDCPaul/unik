'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Save, Plus, Trash2, ExternalLink, RefreshCw, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { getNavigation, saveNavigation, defaultNavItems, type NavItem } from '@/lib/services/admin/navigation';
import type { TabItem } from '@unik/shared/types';

export default function NavigationPage() {
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNavigation();
  }, []);

  const loadNavigation = async () => {
    setIsLoading(true);
    try {
      const items = await getNavigation();
      setNavItems(items);
      // Auto-expand items with children
      const withChildren = new Set(items.filter(i => i.children && i.children.length > 0).map(i => i.id));
      setExpandedItems(withChildren);
      
      // Auto-expand child items with tabs
      const childrenWithTabs = new Set<string>();
      items.forEach(item => {
        if (item.children) {
          item.children.forEach(child => {
            if (child.tabs && child.tabs.length > 0) {
              childrenWithTabs.add(child.id);
            }
          });
        }
      });
      setExpandedTabs(childrenWithTabs);
    } catch (error) {
      console.error('Error loading navigation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = (id: string, updates: Partial<NavItem>) => {
    setNavItems(items => 
      items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => 
              child.id === id ? { ...child, ...updates } : child
            )
          };
        }
        return item;
      })
    );
  };

  const updateTab = (childId: string, tabId: string, updates: Partial<TabItem>) => {
    // Force path to lowercase and remove spaces
    if (updates.path) {
      updates.path = updates.path.toLowerCase().replace(/\s+/g, '-');
    }
    
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId && child.tabs) {
                return {
                  ...child,
                  tabs: child.tabs.map(tab =>
                    tab.id === tabId ? { ...tab, ...updates } : tab
                  )
                };
              }
              return child;
            })
          };
        }
        return item;
      })
    );
  };

  const toggleVisibility = (id: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.id === id) {
          return { ...item, isVisible: !item.isVisible };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child =>
              child.id === id ? { ...child, isVisible: !child.isVisible } : child
            )
          };
        }
        return item;
      })
    );
  };

  const toggleTabVisibility = (childId: string, tabId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId && child.tabs) {
                return {
                  ...child,
                  tabs: child.tabs.map(tab =>
                    tab.id === tabId ? { ...tab, isVisible: !tab.isVisible } : tab
                  )
                };
              }
              return child;
            })
          };
        }
        return item;
      })
    );
  };

  const addNewItem = () => {
    const newItem: NavItem = {
      id: Date.now().toString(),
      label: 'New Menu',
      href: '/new-page',
      isVisible: true,
      order: navItems.length,
    };
    setNavItems([...navItems, newItem]);
  };

  const addChildItem = (parentId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.id === parentId) {
          const children = item.children || [];
          const newChild: NavItem = {
            id: `${parentId}-${Date.now()}`,
            label: 'New Sub-menu',
            href: '/new-sub-page',
            isVisible: true,
            order: children.length,
          };
          return {
            ...item,
            children: [...children, newChild]
          };
        }
        return item;
      })
    );
    setExpandedItems(prev => new Set(prev).add(parentId));
  };

  const addTab = (childId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId) {
                const tabs = child.tabs || [];
                const newTab: TabItem = {
                  id: `tab-${Date.now()}`,
                  label: 'New Tab',
                  path: 'new-tab',
                  isVisible: true,
                  order: tabs.length,
                };
                return {
                  ...child,
                  tabs: [...tabs, newTab]
                };
              }
              return child;
            })
          };
        }
        return item;
      })
    );
    setExpandedTabs(prev => new Set(prev).add(childId));
  };

  const deleteItem = (id: string, parentId?: string) => {
    if (parentId) {
      setNavItems(items =>
        items.map(item => {
          if (item.id === parentId && item.children) {
            return {
              ...item,
              children: item.children.filter(child => child.id !== id)
            };
          }
          return item;
        })
      );
    } else {
      if (navItems.length <= 1) return;
      setNavItems(items => items.filter(item => item.id !== id));
    }
  };

  const deleteTab = (childId: string, tabId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId && child.tabs) {
                return {
                  ...child,
                  tabs: child.tabs.filter(tab => tab.id !== tabId)
                };
              }
              return child;
            })
          };
        }
        return item;
      })
    );
  };

  const convertToDropdown = (id: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.id === id && !item.children) {
          return {
            ...item,
            children: []
          };
        }
        return item;
      })
    );
    setExpandedItems(prev => new Set(prev).add(id));
  };

  const removeDropdown = (id: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.id === id) {
          const { children, ...rest } = item;
          return rest;
        }
        return item;
      })
    );
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const enableTabs = (childId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId && !child.tabs) {
                return {
                  ...child,
                  tabs: []
                };
              }
              return child;
            })
          };
        }
        return item;
      })
    );
    setExpandedTabs(prev => new Set(prev).add(childId));
  };

  const disableTabs = (childId: string) => {
    setNavItems(items =>
      items.map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === childId) {
                const { tabs, ...rest } = child;
                return rest;
              }
              return child;
            })
          };
        }
        return item;
      })
    );
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(childId);
      return newSet;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleTabsExpanded = (id: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await saveNavigation(navItems);
      alert('Navigation saved successfully!');
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert('Failed to save navigation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Navigation</h1>
          <p className="text-slate-500 mt-1">Manage menu items, dropdowns, and page tabs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addNewItem} className="admin-btn-secondary">
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
          <button onClick={saveChanges} disabled={isSaving} className="admin-btn-primary">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-6">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Preview</h3>
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center gap-8">
            <span className="text-white font-bold">UNI<span className="text-yellow-400">K</span></span>
            <nav className="flex items-center gap-6">
              {navItems
                .filter(item => item.isVisible)
                .sort((a, b) => a.order - b.order)
                .map(item => (
                  <div key={item.id} className="relative group">
                    <span className="text-slate-300 text-sm hover:text-white cursor-pointer flex items-center gap-1">
                      {item.label}
                      {item.children && item.children.length > 0 && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                    {item.children && item.children.length > 0 && (
                      <div className="hidden group-hover:block absolute top-full left-0 mt-2 bg-slate-800 rounded-lg py-2 min-w-[150px] shadow-xl">
                        {item.children
                          .filter(child => child.isVisible)
                          .sort((a, b) => a.order - b.order)
                          .map(child => (
                            <div key={child.id}>
                              <div className="px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center justify-between">
                                <span>{child.label}</span>
                                {child.tabs && child.tabs.length > 0 && (
                                  <Layers className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Nav Items Editor */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Menu Items</h2>
          <p className="text-sm text-slate-500 mt-1">Configure main menu items, dropdowns, and page tabs</p>
        </div>

        <div className="divide-y divide-slate-200">
          {navItems
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <div key={item.id}>
                {/* Parent Item */}
                <div
                  className={`p-4 flex items-center gap-4 ${!item.isVisible ? 'bg-slate-50' : ''}`}
                >
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">URL Path</label>
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateItem(item.id, { href: e.target.value })}
                      className="admin-input"
                      placeholder={item.children ? "(Optional for dropdown)" : "/path"}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    {item.children !== undefined ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title={expandedItems.has(item.id) ? "Collapse" : "Expand"}
                        >
                          {expandedItems.has(item.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => addChildItem(item.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Add Sub-menu"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeDropdown(item.id)}
                          className="px-3 py-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors text-xs font-medium"
                          title="Convert to regular link"
                        >
                          Remove Dropdown
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => convertToDropdown(item.id)}
                        className="px-3 py-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors text-xs font-medium"
                        title="Make this a dropdown menu"
                      >
                        Make Dropdown
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleVisibility(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.isVisible 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={item.isVisible ? 'Visible' : 'Hidden'}
                    >
                      {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={navItems.length <= 1}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Child Items */}
                {item.children && expandedItems.has(item.id) && (
                  <div className="bg-slate-50 border-t border-slate-200">
                    {item.children.length === 0 ? (
                      <div className="p-4 pl-20 text-sm text-slate-500 italic">
                        No sub-menu items. Click "+" to add one.
                      </div>
                    ) : (
                      item.children
                        .sort((a, b) => a.order - b.order)
                        .map((child, childIndex) => (
                          <div key={child.id}>
                            <div
                              className={`p-4 pl-20 flex items-center gap-4 border-t border-slate-200 ${
                                !child.isVisible ? 'bg-slate-100' : ''
                              }`}
                            >
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                {childIndex + 1}
                              </div>

                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Sub-menu Label</label>
                                <input
                                  type="text"
                                  value={child.label}
                                  onChange={(e) => updateItem(child.id, { label: e.target.value })}
                                  className="admin-input text-sm"
                                />
                              </div>

                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">URL Path</label>
                                <input
                                  type="text"
                                  value={child.href}
                                  onChange={(e) => updateItem(child.id, { href: e.target.value })}
                                  className="admin-input text-sm"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-5">
                                {child.tabs !== undefined ? (
                                  <>
                                    <button
                                      onClick={() => toggleTabsExpanded(child.id)}
                                      className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                                      title="Toggle tabs"
                                    >
                                      <Layers className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => addTab(child.id)}
                                      className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                      title="Add tab"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => disableTabs(child.id)}
                                      className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors text-xs font-medium"
                                      title="Remove tabs"
                                    >
                                      Remove Tabs
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => enableTabs(child.id)}
                                    className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors text-xs font-medium"
                                    title="Enable page tabs"
                                  >
                                    Enable Tabs
                                  </button>
                                )}

                                <button
                                  onClick={() => toggleVisibility(child.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    child.isVisible 
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                      : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                  }`}
                                  title={child.isVisible ? 'Visible' : 'Hidden'}
                                >
                                  {child.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>

                                <button
                                  onClick={() => deleteItem(child.id, item.id)}
                                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Tabs */}
                            {child.tabs && expandedTabs.has(child.id) && (
                              <div className="bg-slate-100 border-t border-slate-300">
                                {child.tabs.length === 0 ? (
                                  <div className="p-3 pl-32 text-xs text-slate-500 italic">
                                    No tabs. Click "+" to add tabs for this page.
                                  </div>
                                ) : (
                                  child.tabs
                                    .sort((a, b) => a.order - b.order)
                                    .map((tab, tabIndex) => (
                                      <div
                                        key={tab.id}
                                        className={`p-3 pl-32 flex items-center gap-3 border-t border-slate-300 ${
                                          !tab.isVisible ? 'bg-slate-200' : ''
                                        }`}
                                      >
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                                          {tabIndex + 1}
                                        </div>

                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            value={tab.label}
                                            onChange={(e) => updateTab(child.id, tab.id, { label: e.target.value })}
                                            className="admin-input text-xs"
                                            placeholder="Tab Label"
                                          />
                                        </div>

                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            value={tab.path}
                                            onChange={(e) => updateTab(child.id, tab.id, { path: e.target.value })}
                                            className="admin-input text-xs font-mono"
                                            placeholder="path"
                                          />
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => toggleTabVisibility(child.id, tab.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                              tab.isVisible 
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                                : 'bg-slate-300 text-slate-500 hover:bg-slate-400'
                                            }`}
                                          >
                                            {tab.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                          </button>

                                          <button
                                            onClick={() => deleteTab(child.id, tab.id)}
                                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                )}
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </motion.div>

      {/* Tips */}
      <div className="admin-card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Dropdown Menu:</strong> Click "Make Dropdown" to add sub-menu items</li>
          <li>• <strong>Page Tabs:</strong> Click "Enable Tabs" on sub-menu items to add page-level tabs</li>
          <li>• <strong>Example:</strong> Tour → Courtside → [Overview | Schedule | Players | Gallery]</li>
          <li>• <strong>Tab Path:</strong> Used in URL (e.g., "schedule" → /tour/courtside/schedule)</li>
          <li>• Changes are applied to the main website after saving</li>
        </ul>
      </div>
    </div>
  );
}
