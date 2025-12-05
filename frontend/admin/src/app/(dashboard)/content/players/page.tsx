'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Star } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNumber: number;
  imageUrl: string;
  bio: string;
  isActive: boolean;
  order: number;
}

const mockPlayers: Player[] = [
  { id: '1', name: 'Justin Brownlee', team: 'Barangay Ginebra', position: 'Forward', jerseyNumber: 32, imageUrl: '', bio: 'Fan favorite import...', isActive: true, order: 0 },
  { id: '2', name: 'CJ Perez', team: 'San Miguel', position: 'Guard', jerseyNumber: 3, imageUrl: '', bio: 'Explosive scorer...', isActive: true, order: 1 },
  { id: '3', name: 'Scottie Thompson', team: 'Barangay Ginebra', position: 'Guard', jerseyNumber: 9, imageUrl: '', bio: 'Versatile playmaker...', isActive: true, order: 2 },
];

export default function PlayersContentPage() {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({});

  const handleSave = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      setPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddNew = () => {
    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name || 'New Player',
      team: newPlayer.team || '',
      position: newPlayer.position || 'Guard',
      jerseyNumber: newPlayer.jerseyNumber || 0,
      imageUrl: '',
      bio: newPlayer.bio || '',
      isActive: true,
      order: players.length,
    };
    setPlayers([...players, player]);
    setIsAddingNew(false);
    setNewPlayer({});
  };

  const saveAll = async () => {
    // TODO: Save to Firebase
    console.log('Saving players:', players);
    alert('Players saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Players</h1>
          <p className="text-slate-500 mt-1">Manage player profiles displayed on the website</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAddingNew(true)} className="btn-secondary">
            <Plus className="w-4 h-4" />
            Add Player
          </button>
          <button onClick={saveAll} className="btn-primary">
            <Save className="w-4 h-4" />
            Save All
          </button>
        </div>
      </div>

      {/* Add New Player Form */}
      {isAddingNew && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Add New Player</h3>
            <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Player name"
                value={newPlayer.name || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Team</label>
              <input
                type="text"
                className="input-field"
                placeholder="Team name"
                value={newPlayer.team || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Position</label>
              <select
                className="input-field"
                value={newPlayer.position || 'Guard'}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
              >
                <option value="Guard">Guard</option>
                <option value="Forward">Forward</option>
                <option value="Center">Center</option>
              </select>
            </div>
            <div>
              <label className="label">Jersey Number</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={newPlayer.jerseyNumber || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: parseInt(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Bio</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Short biography..."
                value={newPlayer.bio || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, bio: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setIsAddingNew(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleAddNew} className="btn-primary">
              Add Player
            </button>
          </div>
        </motion.div>
      )}

      {/* Players List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="divide-y divide-slate-200">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`p-4 flex items-center gap-4 ${!player.isActive ? 'bg-slate-50 opacity-60' : ''}`}
            >
              {/* Drag Handle */}
              <div className="cursor-grab">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>

              {/* Order */}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                {index + 1}
              </div>

              {/* Player Image Placeholder */}
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <Star className="w-6 h-6 text-slate-400" />
              </div>

              {/* Player Info */}
              {editingId === player.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={player.name}
                    onChange={(e) => player.name = e.target.value}
                  />
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={player.team}
                    onChange={(e) => player.team = e.target.value}
                  />
                  <select
                    className="input-field"
                    defaultValue={player.position}
                    onChange={(e) => player.position = e.target.value}
                  >
                    <option>Guard</option>
                    <option>Forward</option>
                    <option>Center</option>
                  </select>
                  <input
                    type="number"
                    className="input-field"
                    defaultValue={player.jerseyNumber}
                    onChange={(e) => player.jerseyNumber = parseInt(e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{player.name}</div>
                  <div className="text-sm text-slate-500">
                    {player.team} • {player.position} • #{player.jerseyNumber}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {editingId === player.id ? (
                  <>
                    <button
                      onClick={() => handleSave(player.id, player)}
                      className="btn-primary py-2"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary py-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(player.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No players added yet. Click "Add Player" to get started.
          </div>
        )}
      </motion.div>

      {/* Tips */}
      <div className="card p-6 bg-amber-50 border-amber-200">
        <h3 className="font-medium text-amber-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Drag players to reorder them on the website</li>
          <li>• Upload high-quality player photos for best results</li>
          <li>• Click "Save All" to apply changes to the website</li>
        </ul>
      </div>
    </div>
  );
}

