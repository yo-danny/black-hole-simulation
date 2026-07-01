import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import canvasFragmentShader from "../shaders/canvasFragmentShader";
import canvasVertexShader from "../shaders/canvasVertexShader";
import { degreeToRadian, mapping } from "../utils/math";
import skyTextureUrl from "../assets/sky_texture.jpg";

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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const canvasRef = useRef<THREE.Mesh | null>(null);
  const canvasMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

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

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      setWebglError(null);
    } catch (error) {
      console.error("Unable to initialize WebGL renderer:", error);
      setWebglError(
        "WebGL não está disponível neste navegador ou foi bloqueado. Ative a aceleração por hardware para visualizar a simulação.",
      );
      return;
    }

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
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
      if (canvasMaterialRef.current) {
        canvasMaterialRef.current.uniforms.u_CanvasTexture.value =
          fallbackTexture;
        if (rendererRef.current) {
          rendererRef.current.render(scene, camera);
        }
      }
    };

    const loader = new THREE.TextureLoader();
    const canvasTexture = loader.load(
      skyTextureUrl,
      (texture) => {
        if (canvasMaterialRef.current) {
          canvasMaterialRef.current.uniforms.u_CanvasTexture.value = texture;
          if (rendererRef.current) {
            rendererRef.current.render(scene, camera);
          }
        }
      },
      undefined,
      () => {
        if (rendererRef.current) {
          createProcedureTexture(scene, camera, rendererRef.current);
        }
      },
    );

    const canvas_mat = new THREE.ShaderMaterial({
      uniforms: {
        u_AccretionDisk: { value: settings.accretion_disk ? 1 : 0 },
        u_Resolution: { value: new THREE.Vector2(w, h) },
        u_CanvasTexture: { value: canvasTexture },
        uMaxIterations: { value: settings.max_iterations },
        uPov: { value: 75.0 },
        uStepSize: { value: 2.5 / settings.max_iterations },
        u_CameraTranslate: { value: offsetCameraPosition.current },
      },
      vertexShader: canvasVertexShader,
      fragmentShader: canvasFragmentShader,
    });

    canvasMaterialRef.current = canvas_mat;

    const canvas = new THREE.Mesh(canvas_geo, canvas_mat);
    canvasRef.current = canvas;
    scene.add(canvas);

    const handleWheel = (event: WheelEvent) => {
      offsetCameraPosition.current.z +=
        mapping(event.deltaY, -h, h, -10, 10) * 0.3;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const container = containerRef.current;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;

      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(newW, newH);

      if (canvasMaterialRef.current) {
        canvasMaterialRef.current.uniforms.u_Resolution.value =
          new THREE.Vector2(newW, newH);
      }

      rendererRef.current.render(scene, camera);
    };

    window.addEventListener("wheel", handleWheel);
    window.addEventListener("resize", handleResize);

    renderer.render(scene, camera);

    return () => {
      const container = containerRef.current;
      stopAnimation();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);

      if (
        container &&
        renderer.domElement &&
        renderer.domElement.parentNode === container
      ) {
        container.removeChild(renderer.domElement);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (canvasMaterialRef.current) {
      canvasMaterialRef.current.uniforms.u_AccretionDisk.value =
        settings.accretion_disk ? 1 : 0;
      canvasMaterialRef.current.uniforms.uMaxIterations.value =
        settings.max_iterations;
      canvasMaterialRef.current.uniforms.uStepSize.value =
        2.5 / settings.max_iterations;

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [settings.accretion_disk, settings.max_iterations]);

  useEffect(() => {
    if (settings.animate && !isPaused) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [settings.animate, isPaused, startAnimation, stopAnimation]);

  if (webglError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          textAlign: "center",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        {webglError}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default BlackHoleSimulation;
