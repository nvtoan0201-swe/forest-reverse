export const MAX_PLANT_SECONDS = 7200;
export const MAX_PLANT_SECONDS_THREE_HOURS = 10800;
export const MIN_PLANT_MINUTES = 5;
export const MAX_PLANT_MINUTES = 180;
export const CANCELABLE_WINDOW_MS = 10_000;
export const STOPPABLE_MIN_MS = 600_000;
export const TIME_CHANGE_TOLERANCE_MS = 2000;
export const TICK_INTERVAL_MS = 1000;
export const MAX_TREES_PER_PLANT = 4;
export const FREE_TREE_GIDS = [0, 6, 47, 81, 106] as const;
export const DEFAULT_PLANT_MINUTES = 25;
export const SESSION_SNAPSHOT_KEY = 'forest:session_snapshot';
export const SESSION_CLOSED_KEY = 'forest:session_closed';

/** Minutes slider steps offered by the PlantBall (slider is continuous + snaps to 5). */
export const PLANT_MINUTE_STEPS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180] as const;

/** Deep focus: leaving the tab more than this many minutes kills the tree (optional). */
export const EXCEED_KILL_MIN = 5;
