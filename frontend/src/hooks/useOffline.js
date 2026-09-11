import { useOfflineInternal } from '../context/OfflineContext';

export function useOffline() {
  return useOfflineInternal();
}