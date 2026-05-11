"use client";

import React, { useRef, useEffect } from "react";
import {
  Scene, WebGLRenderer, OrthographicCamera, TextureLoader, LinearFilter,
  DataTexture, RGBAFormat, FloatType, ShaderMaterial, DoubleSide,
  PlaneGeometry, Mesh, Vector4, Vector2
} from 'three';

const vertexShader = /* glsl */ `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uDataTexture; // The Physics Texture
  uniform sampler2D uTexture;     // The Image
  uniform vec4 resolution;        // Container Aspect Ratio
  uniform vec2 imageResolution;   // Image Aspect Ratio
  
  varying vec2 vUv;

  void main() {
    // 1. Calculate "Object-Fit: Cover" UVs
    // This ensures the image is never stretched, regardless of container size
    vec2 rs = resolution.xy;
    vec2 is = imageResolution;
    vec2 ratio = vec2(
        min((rs.x / rs.y) / (is.x / is.y), 1.0),
        min((rs.y / rs.x) / (is.y / is.x), 1.0)
    );
    vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // 2. Sample the physics texture (The "Liquid" Map)
    vec4 offset = texture2D(uDataTexture, vUv);

    // 3. Apply Displacement with RGB Split (Chromatic Aberration)
    // We offset Red, Green, and Blue channels slightly differently based on velocity
    float r = texture2D(uTexture, uv - 0.02 * offset.rg).r;
    float g = texture2D(uTexture, uv - 0.015 * offset.rg).g; // Less displacement
    float b = texture2D(uTexture, uv - 0.01 * offset.rg).b;  // Even less

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

const GridDistortion = ({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = "",
}) => {
  const containerRef = useRef(null);

  // Three.js Refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const planeRef = useRef(null);
  const materialRef = useRef(null);

  // State Refs
  const animationIdRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // --- SETUP ---
    const scene = new Scene();
    sceneRef.current = scene;

    const renderer = new WebGLRenderer({
      antialias: false, // Turn off for performance, usually not needed for this effect
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    // --- TEXTURES & DATA ---
    const uniforms = {
      time: { value: 0 },
      resolution: { value: new Vector4() },
      imageResolution: { value: new Vector2(1, 1) }, // Default
      uTexture: { value: null },
      uDataTexture: { value: null },
    };

    // Load Image
    const textureLoader = new TextureLoader();
    textureLoader.load(imageSrc, (texture) => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      // Set aspect ratio for the "cover" logic
      uniforms.imageResolution.value.set(
        texture.image.width,
        texture.image.height
      );
      uniforms.uTexture.value = texture;
      handleResize(); // Trigger resize to fit image correctly
    });

    // Initialize Physics Data (The "Grid")
    const size = grid;
    const count = size * size;
    const data = new Float32Array(4 * count);

    // Fill with zeroes (neutral state)
    for (let i = 0; i < count; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }

    const dataTexture = new DataTexture(
      data,
      size,
      size,
      RGBAFormat,
      FloatType
    );
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    // --- MESH ---
    const material = new ShaderMaterial({
      side: DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new Mesh(geometry, material);
    planeRef.current = plane;
    scene.add(plane);

    // --- EVENTS & LOGIC ---

    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

    const handleMouseMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Normalize mouse to 0..1 relative to the container
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height; // Invert Y for WebGL

      // Calculate Velocity
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;

      mouseState.x = x;
      mouseState.y = y;
      mouseState.prevX = x;
      mouseState.prevY = y;
    };

    const handleMouseLeave = () => {
      // Optional: Reset velocity on leave
      mouseState.vX = 0;
      mouseState.vY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!container || !renderer || !camera || !plane) return;

      const width = container.offsetWidth;
      const height = container.offsetHeight;

      renderer.setSize(width, height);

      // Update Uniforms for shader aspect ratio math
      uniforms.resolution.value.set(width, height, 1, 1);

      // Update Plane Scale to fill container
      const containerAspect = width / height;
      // Since it's orthographic and we want full screen,
      // we match the frustum to the aspect ratio
      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      plane.scale.set(containerAspect, 1, 1);
    };

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
      resizeObserverRef.current = resizeObserver;
    } else {
      window.addEventListener("resize", handleResize);
    }

    // Initial resize
    handleResize();

    // --- ANIMATION LOOP ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!materialRef.current || !dataTexture) return;

      const time = materialRef.current.uniforms.time.value += 0.05;

      // 1. RELAXATION (Dampen the forces)
      const data = dataTexture.image.data;
      for (let i = 0; i < count; i++) {
        data[i * 4] *= relaxation;
        data[i * 4 + 1] *= relaxation;
      }

      // 2. ADD FORCE
      // If mobile (or no mouse movement), add some dynamic movement
      const isMobile = window.matchMedia("(pointer: coarse)").matches;
      
      if (isMobile) {
        // Auto-move virtual mouse in a circle or figure-8
        mouseState.x = 0.5 + 0.2 * Math.cos(time * 0.2);
        mouseState.y = 0.5 + 0.2 * Math.sin(time * 0.3);
        mouseState.vX = mouseState.x - mouseState.prevX;
        mouseState.vY = mouseState.y - mouseState.prevY;
        mouseState.prevX = mouseState.x;
        mouseState.prevY = mouseState.y;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * mouse;
      const distSqThreshold = maxDist * maxDist;

      if (Math.abs(mouseState.vX) > 0.001 || Math.abs(mouseState.vY) > 0.001) {
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const distSq = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
            if (distSq < distSqThreshold) {
              const index = 4 * (i + size * j);
              const power = maxDist / Math.sqrt(distSq);
              data[index] += strength * 100 * mouseState.vX * power;
              data[index + 1] += strength * 100 * mouseState.vY * power;
            }
          }
        }
      }
      
      // Reset velocity for desktop if mouse stopped moving
      if (!isMobile) {
        mouseState.vX *= 0.9;
        mouseState.vY *= 0.9;
      }

      // 3. UPDATE TEXTURE
      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // --- CLEANUP ---
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);

      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }

      // Dispose Three.js resources
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (dataTexture) dataTexture.dispose();
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
    };
  }, [grid, mouse, strength, relaxation, imageSrc]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
    />
  );
};

export default GridDistortion;
