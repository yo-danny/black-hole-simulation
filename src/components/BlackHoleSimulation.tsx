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

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);
  }, [settings.animate, settings.speed, isPaused, onSettingsChange]);

  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
}, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const aspect = w / h;

    const fov = 50;
    const near = 0.1;
    const far = 1000;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 1;
    cameraRef.current = camera;

    const fov_y = camera.position.z * Math.tan(degreeToRadian(fov) / 2) * 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    redererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const canvas_geo = new THREE.PlaneGeometry(fov_y * camera.aspect, fov_y);

    const createProcedureTexture = (
      scene: THREE.Scene,
      camera: THREE.Camera,
      renderer: THREE.WebGLRenderer,
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext("2d")!;
      const gradient = context.createRadialGradient(512, 512, 0, 512, 512, 512);
      gradient.addColorStop(0, "001a33");
      gradient.addColorStop(1, "000000");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1024, 1024);
      context.fillStyle = "white";
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 2 + 0.5;
        context.globalAlpha = Math.random() * 0.8 + 0.2;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1.0;
      const fallbackTexture = new THREE.CanvasTexture(canvas);
    }
