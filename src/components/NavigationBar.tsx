import React, { useState } from "react";
import "./NavigationBar.css";

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

      <div
        className="nav-dropdown"
        onMouseEnter={() => setActiveSection("physics")}
        onMouseLeave={() => setActiveSection(null)}
      >
        <button className="nav-button dropdown-trigger">
          Physics Settings
        </button>

        {activeSection === "physics" && (
          <div className="dropdown-content">
            <div className="dropdown-section">
              <div className="param-group">
                <label>Max Interactions: {settings.max_iterations}</label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={settings.max_iterations}
                  onChange={(e) =>
                    handleSliderChange(
                      "max_iterations",
                      parseInt(e.target.value),
                    )
                  }
                  className="dropdown-slider"
                />
              </div>

              <div className="param-group">
                <label>Animation Speed: {settings.speed.toFixed(3)}</label>
                <input
                  type="range"
                  min="0.001"
                  max="1"
                  step="0.001"
                  value={settings.speed}
                  onChange={(e) =>
                    handleSliderChange("speed", parseFloat(e.target.value))
                  }
                  className="dropdown-slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="nav-dropdown"
        onMouseEnter={() => setActiveSection("visuals")}
        onMouseLeave={() => setActiveSection(null)}
      >
        <button className="nav-button dropdown-trigger">🎨 Visuals</button>

        {activeSection === "visuals" && (
          <div className="dropdown-content">
            <div className="dropdown-section">
              <div className="param-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.accretion_disk}
                    onChange={(e) =>
                      onSettingsChange("accretion_disk", e.target.checked)
                    }
                    className="dropdown-checkbox"
                  />
                  <span>Show Accretion Disk</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="nav-dropdown"
        onMouseEnter={() => setActiveSection("help")}
        onMouseLeave={() => setActiveSection(null)}
      >
        <button className="nav-button dropdown-trigger">❓ Help</button>

        {activeSection === "help" && (
          <div className="dropdown-content">
            <div className="dropdown-section">
              <p className="help-text">
                <strong>Controls:</strong>
                <br />
                • Mouse wheel to zoom in/out
                <br />
                • Adjust physics parameters in real-time
                <br />
                • Toggle accretion disk visualization
                <br />• Auto-animate for dynamic camera movement
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
