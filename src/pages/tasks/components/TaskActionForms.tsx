import type { UseFormReturn } from 'react-hook-form';
import { Role } from '../../../types/enums';
import type { User } from '../../../types';
import { SlideDown } from '../../../components/ui';
import type {
  AddCommentFormData,
  AddUpdateFormData,
  RejectTaskFormData,
  ApproveTaskFormData,
  DelegateTaskFormData,
} from '../../../schemas';

/* ── Comment Form ── */
export function CommentFormPanel({
  form, onSubmit, onClose,
}: {
  form: UseFormReturn<AddCommentFormData>;
  onSubmit: (data: AddCommentFormData) => void;
  onClose: () => void;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Agregar comentario</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <textarea {...form.register('comment')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Escribe tu comentario..." />
          {form.formState.errors.comment && <p className="text-sm text-red-500">{form.formState.errors.comment.message}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Enviar</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}

/* ── Update Form ── */
export function UpdateFormPanel({
  form, onSubmit, onClose,
}: {
  form: UseFormReturn<AddUpdateFormData>;
  onSubmit: (data: AddUpdateFormData) => void;
  onClose: () => void;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Reportar avance</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select {...form.register('update_type')} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="progress">Progreso</option>
              <option value="evidence">Evidencia</option>
              <option value="note">Nota</option>
            </select>
            <input type="number" {...form.register('progress_percent', { valueAsNumber: true })} min={0} max={100} placeholder="% avance" className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <textarea {...form.register('comment')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe el avance..." />
          <div className="flex gap-2">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Reportar</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}

/* ── Approve Form ── */
export function ApproveFormPanel({
  form, onSubmit, onClose,
}: {
  form: UseFormReturn<ApproveTaskFormData>;
  onSubmit: (data: ApproveTaskFormData) => void;
  onClose: () => void;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Aprobar tarea</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <textarea {...form.register('note')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Nota de aprobación (opcional)..." />
          <div className="flex gap-2">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">Aprobar</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}

/* ── Reject Form ── */
export function RejectFormPanel({
  form, onSubmit, onClose,
}: {
  form: UseFormReturn<RejectTaskFormData>;
  onSubmit: (data: RejectTaskFormData) => void;
  onClose: () => void;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Rechazar tarea</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <textarea {...form.register('note')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Motivo del rechazo..." />
          {form.formState.errors.note && <p className="text-sm text-red-500">{form.formState.errors.note.message}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Rechazar</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}

/* ── Delegate Form ── */
export function DelegateFormPanel({
  form, onSubmit, onClose, members, loading,
}: {
  form: UseFormReturn<DelegateTaskFormData>;
  onSubmit: (data: DelegateTaskFormData) => void;
  onClose: () => void;
  members: User[];
  loading: boolean;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Delegar tarea</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <select
            {...form.register('to_user_id', { valueAsNumber: true })}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {loading ? 'Cargando trabajadores...' : 'Seleccionar trabajador'}
            </option>
            {!loading && members.filter((m) => m.role?.slug === Role.WORKER).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {form.formState.errors.to_user_id && <p className="text-sm text-red-500">{form.formState.errors.to_user_id.message}</p>}
          <textarea {...form.register('note')} rows={2} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Nota (opcional)..." />
          <div className="flex gap-2">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Delegar</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}

/* ── Upload Form ── */
export function UploadFormPanel({
  file, setFile, attachmentType, setAttachmentType, onUpload, onClose,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  attachmentType: string;
  setAttachmentType: (v: string) => void;
  onUpload: () => void;
  onClose: () => void;
}) {
  return (
    <SlideDown className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Subir archivo</h3>
        <div className="space-y-3">
          <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="evidence">Evidencia</option>
            <option value="support">Soporte</option>
            <option value="final_delivery">Entrega final</option>
          </select>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100" />
          <div className="flex gap-2">
            <button type="button" onClick={onUpload} disabled={!file} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Subir</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      </div>
    </SlideDown>
  );
}
