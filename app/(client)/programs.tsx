import { ClientProgramsTabContent } from '@/components/client/ClientProgramsTabContent';

/** Hidden route: same experience as Workout tab (`workout.tsx`). Deep links may still target `/(client)/programs`. */
export default function ClientPrograms() {
  return <ClientProgramsTabContent />;
}
