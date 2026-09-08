// `StudioConnection` é um alias de `SavedConnection` (fonte única em
// `@/lib/connections/types`). O Studio e o SQL Workbench agora enxergam
// exatamente a mesma lista de conexões — ver `src/lib/connections/repository.ts`.
export type { SavedConnection as StudioConnection } from '@/lib/connections/types';
