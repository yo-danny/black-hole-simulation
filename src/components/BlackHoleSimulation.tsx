import React, { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

export interface SimulationSettings {
  accretion_disk: boolean;
  animate: boolean;
  speed: number;
  max_iterations: number;
}

interface BlackHoleSimulationProps {
  settings: SimulationSettings;
  onSettingsChange: (
    key: keyof SimulationSettings,
    value: SimulationSettings[keyof SimulationSettings],
  ) => void;
  isPaused: boolean;
}

const BlackHoleSimulation: React.FC<BlackHoleSimulationProps> = ({
  settings,
  onSettingsChange,
  isPaused,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const redererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const canvasRef = useRef<THREE.Mesh | null>(null);
  const canvasMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const offsetCameraPosition = useRef(new THREE.Vector3(0, 0, 0));

  const startAnimation = useCallback(() => {
    if (animationIdRef.current) return;

    const animate = () => {
      if (!settings.animate || isPaused) return;

      offsetCameraPosition.current.x += settings.speed;

      if (
        offsetCameraPosition.current.x > 4 ||
        offsetCameraPosition.current.x <= -4
      ) {
        onSettingsChange("speed", settings.speed * -1);
      }
    };
  });
};
