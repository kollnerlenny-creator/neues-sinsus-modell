import {
  Cpu,
  GitFork,
  Landmark,
  ShieldAlert,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { MilieuId } from '../data/milieus';

export const MILIEU_ICONS: Record<MilieuId, LucideIcon> = {
  avantgarde: Cpu,
  konservativ: Landmark,
  digital_adaptiv: Zap,
  erodierte_mitte: GitFork,
  senioren: Users,
  prekariat: ShieldAlert,
};

export function getMilieuIcon(id: MilieuId): LucideIcon {
  return MILIEU_ICONS[id] ?? Cpu;
}
