import { useState } from 'react';
import { areasApi } from '../../../api/areas';
import { ApiError } from '../../../api/client';
import { HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { AnimatePresence } from 'framer-motion';
import { FadeIn, SlideDown } from '../../../components/ui';

interface AreaClaimSectionProps {
  areaId: number;
  onClaimed: () => void;
}

export function AreaClaimSection({ areaId, onClaimed }: AreaClaimSectionProps) {
  const [claimUserId, setClaimUserId] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  const handleClaim = async () => {
    if (!claimUserId) return;
    setClaimError('');
    try {
      await areasApi.claimWorker({ area_id: areaId, user_id: Number(claimUserId) });
      setClaimSuccess('Trabajador agregado al área');
      setClaimUserId('');
      onClaimed();
      setTimeout(() => setClaimSuccess(''), 3000);
    } catch (err) {
      setClaimError(err instanceof ApiError ? err.data.message : 'Error al reclamar trabajador');
    }
  };

  return (
    <FadeIn delay={0.05} className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Reclamar trabajador</h3>
      <AnimatePresence>
        {claimError && (
          <SlideDown>
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 p-2 text-sm text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-200 dark:ring-red-800">
              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {claimError}
            </div>
          </SlideDown>
        )}
        {claimSuccess && (
          <SlideDown>
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 p-2 text-sm text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-200 dark:ring-green-800">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {claimSuccess}
            </div>
          </SlideDown>
        )}
      </AnimatePresence>
      <div className="flex gap-3">
        <input
          type="number"
          value={claimUserId}
          onChange={(e) => setClaimUserId(e.target.value)}
          placeholder="ID del trabajador"
          className="flex-1 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button type="button" onClick={handleClaim} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]">
          Reclamar
        </button>
      </div>
    </FadeIn>
  );
}
