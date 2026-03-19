import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { TASK_PRIORITY_LABELS } from '../../../types/enums';
import type { TaskPriorityType } from '../../../types/enums';
import type { User, Area } from '../../../types';

interface DraftFormFields {
  title: string;
  description: string;
  priority: TaskPriorityType;
  due_date: string;
  assigned_to_user_id: number | null;
  assigned_to_area_id: number | null;
}

interface Props {
  form: DraftFormFields;
  setForm: React.Dispatch<React.SetStateAction<DraftFormFields>>;
  areaMembers: User[];
  otherAreas: Area[];
  meetingAreaName: string;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  assigneeValue: string;
  onAssigneeChange: (value: string) => void;
}

export function MeetingDraftTaskForm({
  form,
  setForm,
  areaMembers,
  otherAreas,
  meetingAreaName,
  isEditing,
  onSave,
  onCancel,
  assigneeValue,
  onAssigneeChange,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Título *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ej: Enviar informe semanal"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Responsable</label>
            <select
              value={assigneeValue}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sin asignar</option>
              {areaMembers.length > 0 && (
                <optgroup label={meetingAreaName || 'Miembros del área'}>
                  {areaMembers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherAreas.length > 0 && (
                <optgroup label="Asignar a otra área">
                  {otherAreas.map((a) => (
                    <option key={`area:${a.id}`} value={`area:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Prioridad</label>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value as TaskPriorityType }))
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha límite</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalle opcional…"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <HiOutlineX className="h-4 w-4" /> Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!form.title.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <HiOutlineCheck className="h-4 w-4" />
            {isEditing ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
