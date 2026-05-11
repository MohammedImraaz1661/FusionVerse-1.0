import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import _vantaEffect from './vanta.fog.min.js';

/**
 * VantaFog Component - Stable Layered Version
 */
export default function VantaFog({ 
  className = "", 
  highlightColor = 0xffbb4d,
  midtoneColor = 0xff3f00,
  lowlightColor = 0x1d0000,
  baseColor = 0xffffff,
  blurFactor = 0.6,
  speed = 1.0,
  zoom = 1.0
}) {
  const vantaRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    window.THREE = THREE;
    const effectInit = typeof _vantaEffect === 'function' 
      ? _vantaEffect 
      : (window.VANTA && window.VANTA.FOG);

    if (!effectRef.current && effectInit && vantaRef.current) {
      try {
        effectRef.current = effectInit({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor,
          midtoneColor,
          lowlightColor,
          baseColor,
          blurFactor,
          speed,
          zoom,
        });
      } catch (err) {
        console.error("Vanta initialization failed:", err);
      }
    }
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, [highlightColor, midtoneColor, lowlightColor, baseColor, blurFactor, speed, zoom]);

  return (
    <div 
      ref={vantaRef} 
      className={`vanta-container ${className}`} 
      style={{ width: '100%', height: '100%', minHeight: '100vh' }} 
    />
  );
}
