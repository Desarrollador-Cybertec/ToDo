import { HiOutlineChatAlt } from 'react-icons/hi';
import { FadeIn, StaggerList, StaggerItem } from '../../../components/ui';
import { formatDateTime } from '../../../utils';

interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user?: { name?: string } | null;
}

export function TaskComments({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;

  return (
    <FadeIn delay={0.1} className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <HiOutlineChatAlt className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Comentarios
        <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">{comments.length}</span>
      </h3>
      <StaggerList className="space-y-3">
        {comments.map((c) => (
          <StaggerItem key={c.id}>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-medium text-blue-600 dark:text-blue-400">{c.user?.name?.charAt(0) ?? '?'}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.user?.name ?? 'Desconocido'}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-2 pl-9 text-sm text-gray-700 dark:text-gray-300">{c.comment}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </FadeIn>
  );
}
