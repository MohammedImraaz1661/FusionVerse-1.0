"use client";

import React, { useEffect, useRef } from "react";

// ==========================================
// SHADER SOURCES
// ==========================================

const vertShaderSource = `
    precision mediump float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 u_vertex_texel;

    void main () {
        vUv = aPosition * .5 + .5;
        vL = vUv - vec2(u_vertex_texel.x, 0.);
        vR = vUv + vec2(u_vertex_texel.x, 0.);
        vT = vUv + vec2(0., u_vertex_texel.y);
        vB = vUv - vec2(0., u_vertex_texel.y);
        gl_Position = vec4(aPosition, 0., 1.);
    }
`;

// Simplified advection — uses LINEAR hw filtering so no manual bilerp needed
const fragShaderAdvectionSource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D u_velocity_txr;
    uniform sampler2D u_input_txr;
    uniform vec2 u_vertex_texel;
    uniform vec2 u_output_textel;
    uniform float u_dt;
    uniform float u_dissipation;

    void main () {
        vec2 coord = vUv - u_dt * texture2D(u_velocity_txr, vUv).xy * u_vertex_texel;
        gl_FragColor = u_dissipation * texture2D(u_input_txr, coord);
        gl_FragColor.a = 1.;
    }
`;

const fragShaderDivergenceSource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_velocity_txr;

    void main () {
        float L = texture2D(u_velocity_txr, vL).x;
        float R = texture2D(u_velocity_txr, vR).x;
        float T = texture2D(u_velocity_txr, vT).y;
        float B = texture2D(u_velocity_txr, vB).y;

        float div = .5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0., 0., 1.);
    }
`;

const fragShaderPressureSource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_pressure_txr;
    uniform sampler2D u_divergence_txr;

    void main () {
        float L = texture2D(u_pressure_txr, vL).x;
        float R = texture2D(u_pressure_txr, vR).x;
        float T = texture2D(u_pressure_txr, vT).x;
        float B = texture2D(u_pressure_txr, vB).x;
        float divergence = texture2D(u_divergence_txr, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0., 0., 1.);
    }
`;

const fragShaderGradientSubtractSource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_pressure_txr;
    uniform sampler2D u_velocity_txr;

    void main () {
        float L = texture2D(u_pressure_txr, vL).x;
        float R = texture2D(u_pressure_txr, vR).x;
        float T = texture2D(u_pressure_txr, vT).x;
        float B = texture2D(u_pressure_txr, vB).x;
        vec2 velocity = texture2D(u_velocity_txr, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0., 1.);
    }
`;

const fragShaderPointSource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D u_input_txr;
    uniform float u_ratio;
    uniform vec3 u_point_value;
    uniform vec2 u_point;
    uniform float u_point_size;

    void main () {
        vec2 p = vUv - u_point.xy;
        p.x *= u_ratio;
        vec3 splat = exp(-dot(p, p) / u_point_size) * u_point_value;
        vec3 base = texture2D(u_input_txr, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.);
    }
`;

const fragShaderDisplaySource = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D u_output_texture;

    void main () {
        vec3 C = texture2D(u_output_texture, vUv).rgb;
        C = C * 0.6;
        gl_FragColor = vec4(C, 1.);
    }
`;

// ==========================================
// HELPERS
// ==========================================

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth <= 768 ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * LiquidBackground — renders the WebGL fluid simulation as a
 * transparent overlay canvas.  Designed to sit behind page content.
 *
 * Props:
 *  - color   {object}  { r, g, b }  values 0–1 (default subtle violet)
 *  - style   {object}  extra inline styles merged onto the canvas wrapper
 */
export default function LiquidBackground({
  color = { r: 0.42, g: 0.35, b: 0.9 },
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mobile = isMobileDevice();

    // ── Always render at 1x DPR — this is a blurry background effect,
    //    no visual benefit from higher resolution ──
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // ── Aggressively tuned parameters ──
    const params = {
      SIM_RESOLUTION: mobile ? 32 : 64,
      DYE_RESOLUTION: mobile ? 128 : 256,
      DENSITY_DISSIPATION: 0.995,
      VELOCITY_DISSIPATION: 0.9,
      PRESSURE_ITERATIONS: mobile ? 2 : 4,
      SPLAT_RADIUS: (mobile ? 8 : 5) / window.innerHeight,
      color,
    };

    // Target ~30fps — skip every other frame for the simulation
    const TARGET_MS = mobile ? 50 : 33; // 20fps mobile, 30fps desktop

    const pointer = {
      x: 0.65 * window.innerWidth,
      y: 0.5 * window.innerHeight,
      dx: 0,
      dy: 0,
      moved: false,
      firstMove: false,
    };

    let prevTimestamp = performance.now();
    let animationFrameId;
    let accumulator = 0;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    // ── Prefer half-float textures (much faster on most GPUs) ──
    const halfFloatExt = gl.getExtension("OES_texture_half_float");
    const floatExt = gl.getExtension("OES_texture_float");
    const texType = halfFloatExt
      ? halfFloatExt.HALF_FLOAT_OES
      : floatExt
        ? gl.FLOAT
        : gl.FLOAT;

    // Enable linear filtering for float/half-float textures
    gl.getExtension("OES_texture_half_float_linear");
    gl.getExtension("OES_texture_float_linear");

    function createShader(sourceCode, type) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createShaderProgram(vs, fs) {
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program error: " + gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }

    function getUniforms(program) {
      const uniforms = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = gl.getActiveUniform(program, i).name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      return uniforms;
    }

    function createProgram(fragSource) {
      const shader = createShader(fragSource, gl.FRAGMENT_SHADER);
      if (!shader || !vertexShader) return null;
      const program = createShaderProgram(vertexShader, shader);
      if (!program) return null;
      return { program, uniforms: getUniforms(program) };
    }

    const vertexShader = createShader(vertShaderSource, gl.VERTEX_SHADER);
    if (!vertexShader) return;

    const splatProgram = createProgram(fragShaderPointSource);
    const divergenceProgram = createProgram(fragShaderDivergenceSource);
    const pressureProgram = createProgram(fragShaderPressureSource);
    const gradientSubtractProgram = createProgram(fragShaderGradientSubtractSource);
    const advectionProgram = createProgram(fragShaderAdvectionSource);
    const displayProgram = createProgram(fragShaderDisplaySource);

    // ── Single shared vertex + index buffer ──
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // ------------------------
    // FBO Utils — using LINEAR filtering + half-float
    // ------------------------

    function createFBO(w, h, internalFormat = gl.RGBA) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, internalFormat, texType, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        fbo, width: w, height: h,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(w, h, type = gl.RGBA) {
      let fbo1 = createFBO(w, h, type);
      let fbo2 = createFBO(w, h, type);
      return {
        width: w, height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        read: () => fbo1,
        write: () => fbo2,
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
      };
    }

    function getResolution(resolution) {
      let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (ar < 1) ar = 1.0 / ar;
      const min = Math.round(resolution);
      const max = Math.round(resolution * ar);
      return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    }

    let outputColor, velocity, divergenceFBO, pressureFBO;

    function initFBOs() {
      const simRes = getResolution(params.SIM_RESOLUTION);
      const dyeRes = getResolution(params.DYE_RESOLUTION);
      outputColor = createDoubleFBO(dyeRes.width, dyeRes.height);
      velocity = createDoubleFBO(simRes.width, simRes.height);
      divergenceFBO = createFBO(simRes.width, simRes.height, gl.RGB);
      pressureFBO = createDoubleFBO(simRes.width, simRes.height, gl.RGB);
    }

    function blit(target) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // ------------------------
    // Interaction & Render
    // ------------------------

    initFBOs();

    setTimeout(() => { pointer.firstMove = true; }, 300);

    function render(now) {
      if (!gl || !splatProgram || !divergenceProgram || !pressureProgram ||
          !gradientSubtractProgram || !advectionProgram || !displayProgram) return;

      animationFrameId = requestAnimationFrame(render);

      // ── Frame throttle ──
      const elapsed = now - prevTimestamp;
      if (elapsed < TARGET_MS) return; // skip this frame
      prevTimestamp = now;
      const dt = Math.min(elapsed / 1000, 0.05); // cap to avoid instability

      // ── Auto-animation ──
      const shouldAutoAnimate = mobile || !pointer.firstMove;

      if (shouldAutoAnimate) {
        pointer.moved = true;
        const t = now * 0.001;

        if (mobile) {
          const newX = (0.5 + 0.45 * Math.sin(t * 0.7) * Math.cos(t * 0.3) + 0.15 * Math.cos(t * 1.3)) * window.innerWidth;
          const newY = (0.5 + 0.45 * Math.cos(t * 0.5) * Math.sin(t * 0.4) + 0.15 * Math.sin(t * 1.1)) * window.innerHeight;
          pointer.dx = 12 * (newX - pointer.x);
          pointer.dy = 12 * (newY - pointer.y);
          pointer.x = newX;
          pointer.y = newY;
        } else {
          const newX = (0.65 + 0.2 * Math.cos(t * 0.6) * Math.sin(t * 0.8)) * window.innerWidth;
          const newY = (0.5 + 0.12 * Math.sin(t)) * window.innerHeight;
          pointer.dx = 10 * (newX - pointer.x);
          pointer.dy = 10 * (newY - pointer.y);
          pointer.x = newX;
          pointer.y = newY;
        }
      }

      // ── Splat ──
      if (pointer.moved) {
        pointer.moved = false;

        gl.useProgram(splatProgram.program);
        gl.uniform1i(splatProgram.uniforms.u_input_txr, velocity.read().attach(0));
        gl.uniform1f(splatProgram.uniforms.u_ratio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.u_point, pointer.x / canvas.width, 1 - pointer.y / canvas.height);
        gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 1);
        gl.uniform1f(splatProgram.uniforms.u_point_size, params.SPLAT_RADIUS);
        blit(velocity.write());
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.u_input_txr, outputColor.read().attach(0));
        gl.uniform3f(splatProgram.uniforms.u_point_value, params.color.r, params.color.g, params.color.b);
        blit(outputColor.write());
        outputColor.swap();
      }

      // ── Divergence ──
      gl.useProgram(divergenceProgram.program);
      gl.uniform2f(divergenceProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
      blit(divergenceFBO);

      // ── Pressure solve ──
      gl.useProgram(pressureProgram.program);
      gl.uniform2f(pressureProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.u_divergence_txr, divergenceFBO.attach(0));
      for (let i = 0; i < params.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.u_pressure_txr, pressureFBO.read().attach(1));
        blit(pressureFBO.write());
        pressureFBO.swap();
      }

      // ── Gradient subtract ──
      gl.useProgram(gradientSubtractProgram.program);
      gl.uniform2f(gradientSubtractProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradientSubtractProgram.uniforms.u_pressure_txr, pressureFBO.read().attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms.u_velocity_txr, velocity.read().attach(1));
      blit(velocity.write());
      velocity.swap();

      // ── Advection ──
      gl.useProgram(advectionProgram.program);
      gl.uniform2f(advectionProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform2f(advectionProgram.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
      gl.uniform1i(advectionProgram.uniforms.u_input_txr, velocity.read().attach(0));
      gl.uniform1f(advectionProgram.uniforms.u_dt, dt);
      gl.uniform1f(advectionProgram.uniforms.u_dissipation, params.VELOCITY_DISSIPATION);
      blit(velocity.write());
      velocity.swap();

      gl.uniform2f(advectionProgram.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
      gl.uniform1i(advectionProgram.uniforms.u_input_txr, outputColor.read().attach(1));
      gl.uniform1f(advectionProgram.uniforms.u_dissipation, params.DENSITY_DISSIPATION);
      blit(outputColor.write());
      outputColor.swap();

      // ── Display ──
      gl.useProgram(displayProgram.program);
      gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(0));
      blit();
    }

    // ------------------------
    // Event Listeners
    // ------------------------

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        params.SPLAT_RADIUS = (mobile ? 8 : 5) / window.innerHeight;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        initFBOs(); // re-create FBOs at new size
      }, 250);
    };

    const handleClick = (e) => {
      if (mobile) return;
      pointer.dx = 10;
      pointer.dy = 10;
      pointer.x = e.pageX;
      pointer.y = e.pageY;
      pointer.firstMove = true;
    };

    const handleMouseMove = (e) => {
      if (mobile) return;
      pointer.moved = true;
      pointer.dx = 5 * (e.pageX - pointer.x);
      pointer.dy = 5 * (e.pageY - pointer.y);
      pointer.x = e.pageX;
      pointer.y = e.pageY;
      pointer.firstMove = true;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);

    // Start render loop (using rAF timestamp)
    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
}
