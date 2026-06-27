import { useState } from "react";
import BlackHoleSimulation, {
  SimulationSettings,
} from "./components/BlackHoleSimulation";
import NavigationBar from "./components/NavigationBar";
import "./App.css";

function App() {
  const [settings, setSettings] = useState<SimulationSettings>({
    accretion_disk: false,
    animate: true,
    speed: 0.01,
    max_iterations: 400,
  });

  const [isPaused, setIsPaused] = useState(false);

  const handleSettingsChange = (
    key: keyof SimulationSettings,
    value: SimulationSettings[keyof SimulationSettings],
  ) => {
    setSettings((prev: SimulationSettings) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRestart = () => {
    setSettings({
      accretion_disk: false,
      animate: true,
      speed: 0.01,
      max_iterations: 400,
    });
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="App">
      <NavigationBar
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onRestart={handleRestart}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
      />
      <BlackHoleSimulation
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isPaused={isPaused}
      />
    </div>
  );
}
