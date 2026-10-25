/* Hero background: a slow, mouse-reactive aurora rendered with raw WebGL. */
(function () {
  const canvas = document.querySelector('.hero__gl');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { hero.classList.add('no-gl'); return; }

  const vert = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.05;

      vec2 pm = p + (m - p) * 0.08;
      vec2 q = vec2(fbm(pm * 1.3 + t), fbm(pm * 1.3 - t + 5.2));
      vec2 r = vec2(fbm(pm * 1.1 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4),
                    fbm(pm * 1.1 + 3.0 * q + vec2(8.3, 2.8) - t));
      float f = fbm(pm * 1.2 + 2.6 * r);

      vec3 col = vec3(0.012, 0.012, 0.022);
      vec3 blue = vec3(0.10, 0.30, 1.0);
      vec3 cyan = vec3(0.20, 0.80, 1.0);
      vec3 violet = vec3(0.62, 0.26, 0.97);
      vec3 pink = vec3(1.0, 0.30, 0.64);

      col = mix(col, blue * 0.62, smoothstep(0.38, 0.82, f));
      col = mix(col, violet * 0.62, smoothstep(0.52, 0.95, r.x) * 0.75);
      col = mix(col, pink * 0.55, smoothstep(0.6, 0.98, q.y) * 0.5);
      col += cyan * 0.1 * pow(f, 3.0);

      float md = length(p - m);
      col += cyan * 0.16 * exp(-md * md * 5.0);

      float vign = smoothstep(1.35, 0.15, length(p * vec2(0.75, 1.15)));
      col *= vign;
      col *= mix(0.25, 1.0, smoothstep(0.0, 0.55, uv.y));

      col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.018;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { hero.classList.add('no-gl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.classList.add('no-gl'); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  // Render at reduced resolution: the image is soft by nature and this keeps it cheap.
  const SCALE = 0.5;
  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
    const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  const mouse = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6 };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = 1 - (e.clientY - r.top) / r.height;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    resize();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform1f(uTime, reduce ? 12.0 : (now - start) / 1000 + 12.0);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
})();
