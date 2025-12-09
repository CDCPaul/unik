'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Upload, Loader2 } from 'lucide-react';
import { getPlayers, addPlayer, updatePlayer, deletePlayer, uploadPlayerPhoto } from '@/lib/services/admin/players';
import type { Player } from '@unik/shared/types';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAction, setUploadingAction] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPlayer({
      name: '',
      nameKorean: '',
      number: 0,
      position: 'Guard',
      height: '',
      team: '',
      thumbnailUrl: '',
      photoUrl: '',
      actionPhotoUrl: '',
      bio: '',
      achievements: [],
      hometown: '',
      isAllStar: true,
      allStarYear: 2026,
      order: players.length,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlayer || !editingPlayer.name || !editingPlayer.thumbnailUrl || !editingPlayer.photoUrl) {
      alert('Please fill in required fields: Name, Thumbnail, and Main Photo');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlayer.id) {
        await updatePlayer(editingPlayer.id, editingPlayer);
      } else {
        await addPlayer(editingPlayer as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>);
      }
      await loadPlayers();
      setIsModalOpen(false);
      setEditingPlayer(null);
    } catch (error) {
      alert('Failed to save player');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await deletePlayer(id);
      await loadPlayers();
    } catch (error) {
      alert('Failed to delete player');
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;

    setUploadingThumbnail(true);
    try {
      const thumbnailUrl = await uploadPlayerPhoto(file, editingPlayer.id || 'temp');
      setEditingPlayer({ ...editingPlayer, thumbnailUrl });
    } catch (error) {
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;

    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadPlayerPhoto(file, editingPlayer.id || 'temp');
      setEditingPlayer({ ...editingPlayer, photoUrl });
    } catch (error) {
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleActionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;

    setUploadingAction(true);
    try {
      const actionPhotoUrl = await uploadPlayerPhoto(file, editingPlayer.id || 'temp');
      setEditingPlayer({ ...editingPlayer, actionPhotoUrl });
    } catch (error) {
      alert('Failed to upload action photo');
    } finally {
      setUploadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Players</h1>
          <p className="text-slate-500 mt-1">Manage Filipino All-Star players</p>
        </div>
        <button onClick={handleAdd} className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          Add Player
        </button>
      </div>

      {/* Players Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : players.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <p className="text-slate-500">No players yet. Add your first Filipino All-Star!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="admin-card overflow-hidden"
            >
              {/* Player Photo */}
              <div className="aspect-3/4 bg-slate-100 relative">
                {player.thumbnailUrl ? (
                  <img src={player.thumbnailUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Photo
                  </div>
                )}
                {player.isAllStar && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                    ALL-STAR
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">#{player.number} {player.name}</h3>
                    {player.nameKorean && (
                      <p className="text-sm text-slate-500">{player.nameKorean}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <p><strong>Position:</strong> {player.position}</p>
                  <p><strong>Height:</strong> {player.height}</p>
                  <p><strong>Team:</strong> {player.team}</p>
                  <p><strong>Hometown:</strong> {player.hometown}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(player)}
                    className="flex-1 admin-btn-secondary text-sm py-2"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingPlayer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPlayer.id ? 'Edit Player' : 'Add New Player'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Photo Uploads */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Player Photos</h3>
                
                {/* Thumbnail (Grid용) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thumbnail (Grid View) - 300x400 recommended *
                  </label>
                  <div className="flex items-center gap-4">
                    {editingPlayer.thumbnailUrl ? (
                      <img src={editingPlayer.thumbnailUrl} alt="Thumbnail" className="w-20 h-28 object-cover rounded-lg border-2 border-slate-300" />
                    ) : (
                      <div className="w-20 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                        Grid
                      </div>
                    )}
                    <label className="admin-btn-secondary cursor-pointer text-sm">
                      {uploadingThumbnail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Thumbnail
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Main Photo (상세 페이지용) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Main Photo (Detail Page) - 900x1200 recommended *
                  </label>
                  <div className="flex items-center gap-4">
                    {editingPlayer.photoUrl ? (
                      <img src={editingPlayer.photoUrl} alt="Main Photo" className="w-24 h-32 object-cover rounded-lg border-2 border-blue-300" />
                    ) : (
                      <div className="w-24 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                        Detail
                      </div>
                    )}
                    <label className="admin-btn-secondary cursor-pointer text-sm">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Main Photo
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Action Photo (선택) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Action Shot (Optional) - 1800x1200 recommended
                  </label>
                  <div className="flex items-center gap-4">
                    {editingPlayer.actionPhotoUrl ? (
                      <img src={editingPlayer.actionPhotoUrl} alt="Action Shot" className="w-32 h-24 object-cover rounded-lg border-2 border-green-300" />
                    ) : (
                      <div className="w-32 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                        Action
                      </div>
                    )}
                    <label className="admin-btn-secondary cursor-pointer text-sm">
                      {uploadingAction ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Action Shot
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleActionPhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200"></div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="admin-input"
                    placeholder="Juan Gomez de Liaño"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Korean Name</label>
                  <input
                    type="text"
                    value={editingPlayer.nameKorean || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, nameKorean: e.target.value })}
                    className="admin-input"
                    placeholder="후안 고메즈"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Number *</label>
                  <input
                    type="number"
                    value={editingPlayer.number}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, number: parseInt(e.target.value) })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Position *</label>
                  <select
                    value={editingPlayer.position}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value as any })}
                    className="admin-input"
                  >
                    <option value="Guard">Guard</option>
                    <option value="Forward">Forward</option>
                    <option value="Center">Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Height</label>
                  <input
                    type="text"
                    value={editingPlayer.height}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, height: e.target.value })}
                    className="admin-input"
                    placeholder="6'2&quot;"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Team *</label>
                  <input
                    type="text"
                    value={editingPlayer.team}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                    className="admin-input"
                    placeholder="Seoul SK Knights"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hometown *</label>
                <input
                  type="text"
                  value={editingPlayer.hometown}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, hometown: e.target.value })}
                  className="admin-input"
                  placeholder="Manila, Philippines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                <textarea
                  value={editingPlayer.bio}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, bio: e.target.value })}
                  className="admin-input"
                  rows={4}
                  placeholder="Player biography..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Achievements (one per line)
                </label>
                <textarea
                  value={editingPlayer.achievements?.join('\n') || ''}
                  onChange={(e) => setEditingPlayer({ 
                    ...editingPlayer, 
                    achievements: e.target.value.split('\n').filter(a => a.trim()) 
                  })}
                  className="admin-input"
                  rows={3}
                  placeholder="PBA Champion&#10;SEA Games Gold Medal"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingPlayer.isAllStar}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, isAllStar: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label className="text-sm font-medium text-slate-700">All-Star Player (2026)</label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 admin-btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 admin-btn-primary">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Player
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

