'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Save, Plus, Trash2, ExternalLink } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

const defaultNavItems: NavItem[] = [
  { id: '1', label: 'Home', href: '/', isVisible: true, order: 0 },
  { id: '2', label: 'Players', href: '/players', isVisible: true, order: 1 },
  { id: '3', label: 'Tour', href: '/tour', isVisible: true, order: 2 },
  { id: '4', label: 'Info', href: '/info', isVisible: true, order: 3 },
  { id: '5', label: 'Register', href: '/register', isVisible: true, order: 4 },
  { id: '6', label: 'Contact', href: '/contact', isVisible: true, order: 5 },
];

export default function NavigationPage() {
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const updateItem = (id: string, updates: Partial<NavItem>) => {
    setNavItems(items => 
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const toggleVisibility = (id: string) => {
    setNavItems(items =>
      items.map(item => 
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
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

  const deleteItem = (id: string) => {
    if (navItems.length <= 1) return;
    setNavItems(items => items.filter(item => item.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = navItems.findIndex(item => item.id === draggedItem);
    const targetIndex = navItems.findIndex(item => item.id === targetId);

    const newItems = [...navItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setNavItems(newItems.map((item, index) => ({ ...item, order: index })));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Firebase
      console.log('Saving navigation:', navItems);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Navigation saved successfully!');
    } catch (error) {
      alert('Failed to save navigation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Navigation</h1>
          <p className="text-slate-500 mt-1">Manage menu items and their order</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addNewItem} className="btn-secondary">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button onClick={saveChanges} disabled={isSaving} className="btn-primary">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Preview
        </h3>
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center gap-8">
            <span className="text-white font-bold">
              UNI<span className="text-yellow-400">K</span>
            </span>
            <nav className="flex items-center gap-6">
              {navItems
                .filter(item => item.isVisible)
                .sort((a, b) => a.order - b.order)
                .map(item => (
                  <span key={item.id} className="text-slate-300 text-sm hover:text-white cursor-pointer">
                    {item.label}
                  </span>
                ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Nav Items Editor */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Menu Items</h2>
          <p className="text-sm text-slate-500 mt-1">Drag to reorder, click eye to toggle visibility</p>
        </div>

        <div className="divide-y divide-slate-200">
          {navItems
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <motion.div
                key={item.id}
                layout
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, item.id)}
                onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, item.id)}
                onDragEnd={handleDragEnd}
                className={`p-4 flex items-center gap-4 ${
                  draggedItem === item.id ? 'opacity-50 bg-slate-50' : ''
                } ${!item.isVisible ? 'bg-slate-50' : ''}`}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                </div>

                {/* Order Number */}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                  {index + 1}
                </div>

                {/* Label Input */}
                <div className="flex-1">
                  <label className="label">Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Href Input */}
                <div className="flex-1">
                  <label className="label">URL Path</label>
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => updateItem(item.id, { href: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-6">
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
                  
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Open page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={navItems.length <= 1}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Tips */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag items to reorder them in the navigation bar</li>
          <li>• Hide items temporarily without deleting them</li>
          <li>• Changes are applied to the main website after saving</li>
        </ul>
      </div>
    </div>
  );
}

