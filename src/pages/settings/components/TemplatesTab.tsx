import React from 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import type { MessageTemplate } from '../../../types';
import { FadeIn, Badge } from '../../../components/ui';

const TEMPLATE_VARIABLES = [
  { variable: '{{user_name}}', desc: 'Nombre del usuario' },
  { variable: '{{task_title}}', desc: 'Título de la tarea' },
  { variable: '{{task_status}}', desc: 'Estado de la tarea' },
  { variable: '{{task_priority}}', desc: 'Prioridad de la tarea' },
  { variable: '{{due_date}}', desc: 'Fecha límite' },
  { variable: '{{area_name}}', desc: 'Nombre del área' },
  { variable: '{{app_name}}', desc: 'Nombre de la aplicación' },
  { variable: '{{app_url}}', desc: 'URL de la aplicación' },
];

export function TemplatesTab({
  templates,
  templateDrafts,
  updateTemplateDraft,
  hasPendingTemplateDrafts,
  saving,
  savingTemplateId,
  confirmingTemplateId,
  setConfirmingTemplateId,
  saveTemplate,
  discardTemplateDraft,
  saveAllTemplates,
  insertVariable,
  lastFocusedRef,
  handleDrop,
  handleDragOver,
}: {
  templates: MessageTemplate[];
  templateDrafts: Record<number, Partial<Pick<MessageTemplate, 'subject' | 'body' | 'active'>>>;
  updateTemplateDraft: (id: number, changes: Partial<Pick<MessageTemplate, 'subject' | 'body' | 'active'>>) => void;
  hasPendingTemplateDrafts: boolean;
  saving: boolean;
  savingTemplateId: number | null;
  confirmingTemplateId: number | null;
  setConfirmingTemplateId: (id: number | null) => void;
  saveTemplate: (id: number) => void;
  discardTemplateDraft: (id: number) => void;
  saveAllTemplates: () => void;
  insertVariable: (variable: string, templateId?: number, field?: 'subject' | 'body') => void;
  lastFocusedRef: React.MutableRefObject<{ templateId: number; field: 'subject' | 'body'; element: HTMLInputElement | HTMLTextAreaElement } | null>;
  handleDrop: (e: React.DragEvent, templateId: number, field: 'subject' | 'body') => void;
  handleDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div className="space-y-3">
      <FadeIn className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
          <HiOutlineInformationCircle className="h-4 w-4" /> Variables disponibles
        </div>
        <p className="mb-2 text-xs text-indigo-600 dark:text-indigo-400/70">Haz clic en una variable para insertarla, o arrástrala al campo de asunto o cuerpo.</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.variable}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', v.variable);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => insertVariable(v.variable)}
              className="group flex items-center gap-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1.5 text-xs transition-all hover:bg-indigo-200 hover:shadow-sm active:scale-95 cursor-grab active:cursor-grabbing"
              title={v.desc}
            >
              <code className="font-mono font-semibold text-indigo-800 dark:text-indigo-300">{v.variable}</code>
              <span className="text-indigo-600 dark:text-indigo-400/70">{v.desc}</span>
            </button>
          ))}
        </div>
      </FadeIn>
      {templates.map((t) => {
        const draft = templateDrafts[t.id];
        const currentSubject = draft?.subject ?? t.subject;
        const currentBody = draft?.body ?? t.body;
        const currentActive = draft?.active ?? t.active;
        const isModified = t.id in templateDrafts;
        return (
          <FadeIn key={t.id} className={`rounded-2xl border bg-white dark:bg-gray-900 p-4 shadow-sm ${isModified ? 'border-blue-200 dark:border-blue-800' : 'border-gray-100 dark:border-gray-800'}`}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</h4>
                <span className="text-xs text-gray-400 dark:text-gray-500">{t.slug}</span>
              </div>
              <button
                type="button"
                onClick={() => updateTemplateDraft(t.id, { active: !currentActive })}
                className="transition-all active:scale-[0.96]"
              >
                <Badge variant={currentActive ? 'green' : 'gray'} size="sm">{currentActive ? 'Activa' : 'Inactiva'}</Badge>
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Asunto</label>
                <input
                  type="text"
                  value={currentSubject}
                  onChange={(e) => updateTemplateDraft(t.id, { subject: e.target.value })}
                  onFocus={(e) => { lastFocusedRef.current = { templateId: t.id, field: 'subject', element: e.target }; }}
                  onDrop={(e) => handleDrop(e, t.id, 'subject')}
                  onDragOver={handleDragOver}
                  className={`mt-0.5 w-full rounded-lg border px-3 py-1.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isModified && draft?.subject != null ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Cuerpo</label>
                <textarea
                  value={currentBody}
                  onChange={(e) => updateTemplateDraft(t.id, { body: e.target.value })}
                  onFocus={(e) => { lastFocusedRef.current = { templateId: t.id, field: 'body', element: e.target }; }}
                  onDrop={(e) => handleDrop(e, t.id, 'body')}
                  onDragOver={handleDragOver}
                  rows={3}
                  className={`mt-0.5 w-full rounded-lg border px-3 py-1.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isModified && draft?.body != null ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  }`}
                />
              </div>
            </div>
            {isModified && (
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                {confirmingTemplateId === t.id ? (
                  <>
                    <span className="mr-auto text-xs text-amber-600 dark:text-amber-400">{'\u00bf'}Guardar cambios de esta plantilla?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmingTemplateId(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => saveTemplate(t.id)}
                      disabled={savingTemplateId === t.id}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      {savingTemplateId === t.id ? 'Guardando...' : 'Confirmar'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => discardTemplateDraft(t.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingTemplateId(t.id)}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Guardar
                    </button>
                  </>
                )}
              </div>
            )}
          </FadeIn>
        );
      })}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveAllTemplates}
          disabled={!hasPendingTemplateDrafts || saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar todas'}
        </button>
      </div>
    </div>
  );
}
