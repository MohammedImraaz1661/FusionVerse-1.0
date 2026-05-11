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

    // 2. Sample the physics texture
    vec4 offset = texture2D(uDataTexture, vUv);

    // 3. Apply Displacement with RGB Split (Harder look)
    float r = texture2D(uTexture, uv - 0.04 * offset.rg).r;
    float g = texture2D(uTexture, uv - 0.02 * offset.rg).g;
    float b = texture2D(uTexture, uv - 0.01 * offset.rg).b;

    // Use a high alpha to ensure visibility against the background
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

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
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
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
      imageResolution: { value: new Vector2(1, 1) },
      uTexture: { value: null },
      uDataTexture: { value: null },
    };

    // Load Image
    const textureLoader = new TextureLoader();
    textureLoader.load(imageSrc, (texture) => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      uniforms.imageResolution.value.set(
        texture.image.width,
        texture.image.height
      );
      uniforms.uTexture.value = texture;
      handleResize();
    });

    // Initialize Physics Data
    const size = grid;
    const count = size * size;
    const data = new Float32Array(4 * count);

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
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;

      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mousePos.prevY; // Wait, typo check: mouseState.prevY

      mouseState.x = x;
      mouseState.y = y;
      mouseState.prevX = x;
      mouseState.prevY = y;
    };

    // Fixed typo in local mouse handler
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      mouseState.x = x;
      mouseState.y = y;
      mouseState.prevX = x;
      mouseState.prevY = y;
    };

    window.addEventListener("mousemove", onMouseMove);

    const handleResize = () => {
      if (!container || !renderer || !camera || !plane) return;
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.set(width, height, 1, 1);
      const containerAspect = width / height;
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
    }
    handleResize();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (!materialRef.current || !dataTexture) return;

      const data = dataTexture.image.data;
      for (let i = 0; i < count; i++) {
        data[i * 4] *= relaxation;
        data[i * 4 + 1] *= relaxation;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * mouse;
      const distSqThreshold = maxDist * maxDist;

      if (Math.abs(mouseState.vX) > 0.001 || Math.abs(mouseState.vY) > 0.001) {
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const dx = gridMouseX - i;
            const dy = gridMouseY - j;
            const distSq = dx*dx + dy*dy;
            if (distSq < distSqThreshold) {
              const index = 4 * (i + size * j);
              const power = maxDist / Math.sqrt(distSq);
              data[index] += strength * 100 * mouseState.vX * power;
              data[index + 1] += strength * 100 * mouseState.vY * power;
            }
          }
        }
      }
      
      mouseState.vX *= 0.9;
      mouseState.vY *= 0.9;
      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (dataTexture) dataTexture.dispose();
    };
  }, [grid, mouse, strength, relaxation, imageSrc]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      className={`relative overflow-hidden ${className}`}
    />
  );
};

export default GridDistortion;
