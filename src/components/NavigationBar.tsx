import React, { useState } from "react";

interface SimulationSettings {
  accretion_disk: boolean;
  animate: boolean;
  speed: number;
  max_iterations: number;
}

interface NavigationBarProps {
  settings: SimulationSettings;
  onSettingsChange: (
    key: keyof SimulationSettings,
    value: SimulationSettings[keyof SimulationSettings],
  ) => void;
  onRestart: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  settings,
  onSettingsChange,
  onRestart,
  onTogglePause,
  isPaused,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSliderChange = (key: keyof SimulationSettings, value: number) => {
    onSettingsChange(key, value);
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Black Hole Simulation</h1>
        </div>
      </div>

      <div className="nav-controls">
        <button
          onClick={onTogglePause}
          className={`nav-button ${isPaused ? "paused" : "running"}`}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button onClick={onRestart} className="nav-button restart-btn">
          Restart
        </button>
      </div>

      <div className="nav-section">
        <label className="nav-checkbox-label">
          <input
            type="checkbox"
            checked={settings.animate}
            onChange={(e) => onSettingsChange("animate", e.target.checked)}
            className="nav-checkbox"
          />
          <span>Auto-Animation Camera</span>
        </label>
      </div>
    </nav>
  );
};
