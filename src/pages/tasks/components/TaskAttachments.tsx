import { HiOutlinePaperClip } from 'react-icons/hi';
import { FadeIn, StaggerList, StaggerItem, Badge } from '../../../components/ui';

interface Attachment {
  id: number;
  file_name: string;
  attachment_type: string;
  user?: { name?: string } | null;
}

export function TaskAttachments({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <FadeIn delay={0.15} className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <HiOutlinePaperClip className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Adjuntos
        <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">{attachments.length}</span>
      </h3>
      <StaggerList className="space-y-2">
        {attachments.map((a) => (
          <StaggerItem key={a.id}>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                  <HiOutlinePaperClip className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.file_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.user?.name ?? 'Desconocido'} · <Badge variant="gray" size="sm">{a.attachment_type}</Badge></p>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </FadeIn>
  );
}
