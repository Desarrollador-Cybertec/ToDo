import {  motion } from 'framer-motion';
import { HiOutlineX } from 'react-icons/hi';
import { TASK_PRIORITY_LABELS } from '../../../types/enums';
import { Spinner } from '../../../components/ui';

interface EditField {
  label: string;
  value: boolean;
  set: (v: boolean) => void;
}

interface Props {
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editPriority: string;
  setEditPriority: (v: string) => void;
  editDueDate: string;
  setEditDueDate: (v: string) => void;
  editStartDate: string;
  setEditStartDate: (v: string) => void;
  requirementFields: EditField[];
  notificationFields: EditField[];
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function TaskEditForm({
  editTitle, setEditTitle,
  editDescription, setEditDescription,
  editPriority, setEditPriority,
  editDueDate, setEditDueDate,
  editStartDate, setEditStartDate,
  requirementFields, notificationFields,
  saving, onSave, onCancel,
}: Props) {
  return (
    <motion.div
      key="edit-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar tarea</h3>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400">
          <HiOutlineX className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label>
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha límite</label>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de inicio</label>
          <input
            type="date"
            value={editStartDate}
            onChange={(e) => setEditStartDate(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <CheckboxGroup title="Requisitos" fields={requirementFields} />
      <CheckboxGroup title="Notificaciones" fields={notificationFields} />

      <div className="flex justify-end gap-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-gray-800 pt-4">
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !editTitle.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
        </button>
      </div>
    </motion.div>
  );
}

function CheckboxGroup({ title, fields }: { title: string; fields: EditField[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((opt) => (
          <label key={opt.label} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-white dark:hover:bg-gray-800">
            <input
              type="checkbox"
              checked={opt.value}
              onChange={(e) => opt.set(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500/20"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
