export interface MovementMode {
  id: string;
  label: string;
  category: 'endurance' | 'cycles' | 'fitness' | 'outdoor' | 'court' | 'water';
  icon: string;
  calPerHour: number;
  metricType: 'pace' | 'speed' | 'cadence' | 'floors';
  telemetryBadge: string;
}

export const MOVEMENT_MODES: MovementMode[] = [
  // Endurance & Running
  { id: 'run', label: 'Outdoor Run', category: 'endurance', icon: 'fitness-outline', calPerHour: 680, metricType: 'pace', telemetryBadge: 'GPS • IMU' },
  { id: 'trail_run', label: 'Trail Run', category: 'endurance', icon: 'earth-outline', calPerHour: 740, metricType: 'pace', telemetryBadge: 'GPS • BARO' },
  { id: 'treadmill', label: 'Treadmill', category: 'endurance', icon: 'speedometer-outline', calPerHour: 620, metricType: 'pace', telemetryBadge: 'PEDO • IMU' },
  { id: 'track_run', label: 'Track 400m', category: 'endurance', icon: 'stopwatch-outline', calPerHour: 710, metricType: 'pace', telemetryBadge: 'RTK GPS' },
  { id: 'walk', label: 'Power Walk', category: 'endurance', icon: 'walk-outline', calPerHour: 320, metricType: 'pace', telemetryBadge: 'GPS • STEP' },
  { id: 'stairs', label: 'Stair Climber', category: 'endurance', icon: 'stats-chart-outline', calPerHour: 590, metricType: 'floors', telemetryBadge: 'BARO • STEP' },

  // Cycles & Wheels
  { id: 'ride', label: 'Road Cycling', category: 'cycles', icon: 'bicycle-outline', calPerHour: 550, metricType: 'speed', telemetryBadge: 'GPS SPEED' },
  { id: 'mountain_bike', label: 'Mountain Bike', category: 'cycles', icon: 'bicycle', calPerHour: 680, metricType: 'speed', telemetryBadge: 'GPS • ELEV' },
  { id: 'gravel_bike', label: 'Gravel Bike', category: 'cycles', icon: 'compass-outline', calPerHour: 590, metricType: 'speed', telemetryBadge: 'GPS • CAD' },
  { id: 'indoor_cycling', label: 'Spin & Trainer', category: 'cycles', icon: 'reload-circle-outline', calPerHour: 510, metricType: 'speed', telemetryBadge: 'WATTS • CAD' },
  { id: 'ebike', label: 'E-Bike Assist', category: 'cycles', icon: 'flash-outline', calPerHour: 340, metricType: 'speed', telemetryBadge: 'GPS SPEED' },
  { id: 'skating', label: 'Inline Skating', category: 'cycles', icon: 'disc-outline', calPerHour: 480, metricType: 'speed', telemetryBadge: 'GPS • CAD' },
  { id: 'skateboard', label: 'Skateboarding', category: 'cycles', icon: 'layers-outline', calPerHour: 380, metricType: 'speed', telemetryBadge: 'GPS SPEED' },

  // Outdoor & Mountains
  { id: 'hike', label: 'Alpine Hike', category: 'outdoor', icon: 'trail-sign-outline', calPerHour: 460, metricType: 'pace', telemetryBadge: 'GPS • ALT' },
  { id: 'nordic_ski', label: 'Cross-Country Ski', category: 'outdoor', icon: 'snow-outline', calPerHour: 680, metricType: 'speed', telemetryBadge: 'GPS • ELEV' },
  { id: 'snowboard', label: 'Snowboarding', category: 'outdoor', icon: 'diamond-outline', calPerHour: 420, metricType: 'speed', telemetryBadge: 'GPS • SPEED' },

  // Water Sports
  { id: 'pool_swim', label: 'Pool Swimming', category: 'water', icon: 'boat-outline', calPerHour: 530, metricType: 'pace', telemetryBadge: 'LAP • STROKE' },
  { id: 'open_swim', label: 'Open Water Swim', category: 'water', icon: 'water-outline', calPerHour: 580, metricType: 'pace', telemetryBadge: 'GPS DRIFT' },
  { id: 'rowing', label: 'Indoor Rowing', category: 'water', icon: 'git-commit-outline', calPerHour: 540, metricType: 'cadence', telemetryBadge: 'STROKES' },
  { id: 'kayak', label: 'Kayak & Canoe', category: 'water', icon: 'navigate-outline', calPerHour: 410, metricType: 'speed', telemetryBadge: 'GPS SPEED' },
  { id: 'sup', label: 'Paddleboard', category: 'water', icon: 'body-outline', calPerHour: 360, metricType: 'speed', telemetryBadge: 'GPS SPEED' },

  // Fitness & Gym
  { id: 'hiit', label: 'HIIT Cardio', category: 'fitness', icon: 'flame-outline', calPerHour: 620, metricType: 'cadence', telemetryBadge: 'HEART • IMU' },
  { id: 'strength', label: 'Strength Workout', category: 'fitness', icon: 'barbell-outline', calPerHour: 390, metricType: 'cadence', telemetryBadge: 'LOAD • SETS' },
  { id: 'calisthenics', label: 'Calisthenics', category: 'fitness', icon: 'person-outline', calPerHour: 430, metricType: 'cadence', telemetryBadge: 'BODYWEIGHT' },
  { id: 'crossfit', label: 'WOD / Crossfit', category: 'fitness', icon: 'hardware-chip-outline', calPerHour: 670, metricType: 'cadence', telemetryBadge: 'POWER • METS' },
  { id: 'yoga', label: 'Vinyasa Yoga', category: 'fitness', icon: 'leaf-outline', calPerHour: 240, metricType: 'cadence', telemetryBadge: 'HEART • FLOW' },
  { id: 'pilates', label: 'Mat Pilates', category: 'fitness', icon: 'radio-button-on-outline', calPerHour: 290, metricType: 'cadence', telemetryBadge: 'CORE TONE' },
  { id: 'jump_rope', label: 'Jump Rope', category: 'fitness', icon: 'timer-outline', calPerHour: 760, metricType: 'cadence', telemetryBadge: 'RPM • REPS' },
  { id: 'boxing', label: 'Boxing Sparring', category: 'fitness', icon: 'hand-left-outline', calPerHour: 690, metricType: 'cadence', telemetryBadge: 'PUNCH SPEED' },
  { id: 'martial_arts', label: 'Martial Arts', category: 'fitness', icon: 'shield-checkmark-outline', calPerHour: 640, metricType: 'cadence', telemetryBadge: 'IMU IMPACT' },

  // Court & Team Sports
  { id: 'tennis', label: 'Tennis Match', category: 'court', icon: 'tennisball-outline', calPerHour: 520, metricType: 'pace', telemetryBadge: 'GPS • RALLY' },
  { id: 'basketball', label: 'Basketball Game', category: 'court', icon: 'basketball-outline', calPerHour: 610, metricType: 'pace', telemetryBadge: 'SPRINT • JUMP' },
  { id: 'soccer', label: 'Soccer Match', category: 'court', icon: 'football-outline', calPerHour: 650, metricType: 'pace', telemetryBadge: 'GPS SPRINT' },
  { id: 'badminton', label: 'Badminton', category: 'court', icon: 'trophy-outline', calPerHour: 450, metricType: 'pace', telemetryBadge: 'AGILITY' },
];
