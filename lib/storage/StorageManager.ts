// LocalStorage Persistence & Scenario Play File Management

import { PlayFile } from '../types/street';
import { DEFAULT_SCENARIOS, SCENARIO_COMPLETE_STREET } from './defaultScenarios';

const STORAGE_ACTIVE_PLAYFILE_KEY = 'simple_street_planner_active_playfile_v6';
const STORAGE_CUSTOM_PLAYFILES_KEY = 'simple_street_planner_custom_playfiles_v6';

export class StorageManager {
  /**
   * Load active play file from localStorage, or return default 4-way metropolis scenario
   */
  static loadActivePlayFile(): PlayFile {
    if (typeof window === 'undefined') return SCENARIO_COMPLETE_STREET;
    try {
      const data = localStorage.getItem(STORAGE_ACTIVE_PLAYFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as PlayFile;
        const hasNS = parsed.ingressPoints?.some((i) => i.side === 'north' || i.side === 'south');
        const hasTurnLanes = parsed.demandRoutes?.some((r) => r.id.startsWith('r_turn_left_'));
        if (hasNS && hasTurnLanes && parsed.street?.worldWidth) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load active play file from localStorage:', e);
    }
    return SCENARIO_COMPLETE_STREET;
  }

  /**
   * Save active play file to localStorage
   */
  static saveActivePlayFile(playFile: PlayFile): void {
    if (typeof window === 'undefined') return;
    try {
      playFile.lastModified = new Date().toISOString();
      localStorage.setItem(STORAGE_ACTIVE_PLAYFILE_KEY, JSON.stringify(playFile));
    } catch (e) {
      console.error('Failed to save active play file to localStorage:', e);
    }
  }

  /**
   * Get all available scenarios (built-in + user-saved custom ones)
   */
  static getAllPlayFiles(): PlayFile[] {
    if (typeof window === 'undefined') return DEFAULT_SCENARIOS;
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_PLAYFILES_KEY);
      const customFiles: PlayFile[] = data ? JSON.parse(data) : [];
      const map = new Map<string, PlayFile>();
      for (const def of DEFAULT_SCENARIOS) map.set(def.id, def);
      for (const cust of customFiles) map.set(cust.id, cust);
      return Array.from(map.values());
    } catch (e) {
      console.warn('Failed to load custom play files:', e);
      return DEFAULT_SCENARIOS;
    }
  }

  /**
   * Save a custom play file
   */
  static saveCustomPlayFile(playFile: PlayFile): void {
    if (typeof window === 'undefined') return;
    try {
      const files = this.getAllPlayFiles().filter((f) => !DEFAULT_SCENARIOS.some((d) => d.id === f.id));
      const idx = files.findIndex((f) => f.id === playFile.id);
      if (idx >= 0) {
        files[idx] = playFile;
      } else {
        files.push(playFile);
      }
      localStorage.setItem(STORAGE_CUSTOM_PLAYFILES_KEY, JSON.stringify(files));
      this.saveActivePlayFile(playFile);
    } catch (e) {
      console.error('Failed to save custom play file:', e);
    }
  }

  /**
   * Export play file as downloadable JSON
   */
  static exportPlayFileJSON(playFile: PlayFile): void {
    const jsonStr = JSON.stringify(playFile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playFile.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_scenario.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse uploaded JSON into PlayFile
   */
  static parsePlayFileJSON(jsonText: string): PlayFile {
    const parsed = JSON.parse(jsonText);
    if (!parsed.street || !parsed.street.lanes) {
      throw new Error('Invalid play file format: missing street and lane definitions.');
    }
    return parsed as PlayFile;
  }
}
