import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check, Layers, Briefcase, Search, Book, Gamepad2, ShoppingBag, Heart } from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

interface WorkspacesProps {
  onClose: () => void;
}

const iconOptions = [
  { id: 'layers', icon: Layers },
  { id: 'briefcase', icon: Briefcase },
  { id: 'search', icon: Search },
  { id: 'book', icon: Book },
  { id: 'gamepad', icon: Gamepad2 },
  { id: 'shopping', icon: ShoppingBag },
  { id: 'heart', icon: Heart },
];

const colorOptions = [
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function Workspaces({ onClose }: WorkspacesProps) {
  const { workspaces, activeWorkspace, setActiveWorkspace, addWorkspace, deleteWorkspace, tabs } = useBrowserStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(colorOptions[0]);
  const [newIcon, setNewIcon] = useState('layers');

  const handleCreate = () => {
    if (newName.trim()) {
      addWorkspace(newName.trim(), newColor, newIcon);
      setNewName('');
      setIsCreating(false);
    }
  };

  const getTabCount = (workspaceId: string) => {
    return tabs.filter(t => t.workspaceId === workspaceId).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-nova-darker rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Espacios de trabajo</h2>
            <p className="text-sm text-gray-500">Organiza tus pestanas por contexto</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Workspaces list */}
        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {workspaces.map((workspace, index) => {
            const IconComponent = iconOptions.find(i => i.id === workspace.icon)?.icon || Layers;

            return (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  activeWorkspace === workspace.id
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5'
                }`}
                onClick={() => {
                  setActiveWorkspace(workspace.id);
                  onClose();
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: workspace.color + '30' }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: workspace.color }} />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white">{workspace.name}</p>
                  <p className="text-sm text-gray-500">{getTabCount(workspace.id)} pestanas</p>
                </div>

                {activeWorkspace === workspace.id && (
                  <div className="px-2 py-0.5 bg-green-500/20 rounded-full">
                    <span className="text-xs text-green-400">Activo</span>
                  </div>
                )}

                {workspaces.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteWorkspace(workspace.id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </motion.div>
            );
          })}

          {/* Create new workspace */}
          {isCreating ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nombre del espacio..."
                className="w-full bg-white/5 rounded-lg px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-nova-purple/50 mb-3"
                autoFocus
              />

              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Color:</p>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newColor === color ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Icono:</p>
                <div className="flex gap-2">
                  {iconOptions.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setNewIcon(id)}
                      className={`p-2 rounded-lg transition-colors ${
                        newIcon === id ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-nova-purple to-nova-blue rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo espacio de trabajo
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-500 text-center">
            Tip: Usa <kbd className="px-1 bg-white/10 rounded">Ctrl+Shift+W</kbd> para cambiar rapidamente entre espacios
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
