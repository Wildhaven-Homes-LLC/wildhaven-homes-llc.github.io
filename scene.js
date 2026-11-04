// Wildhaven Hearth diorama: a little home builds itself, then breathes. Respects reduced motion; pauses off screen.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
const host = document.getElementById("scene");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
r.toneMapping = THREE.ACESFilmicToneMapping; host.appendChild(r.domElement);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a6a4a, 1.6));
const sun = new THREE.DirectionalLight(0xffe2c4, 2.4); sun.position.set(6, 10, 4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
const world = new THREE.Group(); scene.add(world);
const parts = [];
function add(mesh, x, y, z, delay, base = [1, 1, 1]) { mesh.position.set(x, y, z);
  mesh.traverse(m => { m.castShadow = m.receiveShadow = true; });
  mesh.userData = { y, delay, base }; world.add(mesh); parts.push(mesh); return mesh; }
const box = (w, h, d, c, rad = .06) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, rad), M(c));
add(box(9, .6, 7, 0xe9dcc8, .25), 0, -.3, 0, 0);
add(box(8.6, .12, 6.6, 0x9fb07a, .06), 0, .06, 0, .1);
add(box(1.1, .06, 3, 0xd8c3a5, .03), .2, .14, 2, .25);
add(box(3.2, 2, 2.6, 0xf3ece2), .2, 1.1, -.4, .35);
const rs = new THREE.Shape(); rs.moveTo(-1.55, 0); rs.lineTo(1.55, 0); rs.lineTo(0, 1.25); rs.lineTo(-1.55, 0);
const roofG = new THREE.ExtrudeGeometry(rs, { depth: 3.6, bevelEnabled: false }); roofG.translate(0, 0, -1.8); roofG.rotateY(Math.PI / 2);
add(new THREE.Mesh(roofG, M(0xc8642c)), .2, 2.1, -.4, .5);
add(box(.5, 1.3, .5, 0x8a7563), 1.2, 3.1, -.9, .6);
add(box(.7, 1.2, .08, 0x6b4a33, .03), .2, .7, .92, .65);
const glow = new THREE.MeshStandardMaterial({ color: 0xffc27a, emissive: 0xff9d3d, emissiveIntensity: 1.4 });
add(new THREE.Mesh(new RoundedBoxGeometry(.7, .6, .08, 2, .03), glow), -.9, 1.3, .92, .7);
add(new THREE.Mesh(new RoundedBoxGeometry(.7, .6, .08, 2, .03), glow), 1.3, 1.3, .92, .72);
const lamp = new THREE.PointLight(0xffa84f, 6, 6); lamp.position.set(.2, 1.2, 1.8); world.add(lamp);
[[-3.4, -2], [-3.1, 1.6], [3.4, -2.2], [3.2, 1.9], [-2.2, -2.6], [2.4, 2.6]].forEach(([x, z], i) => {
  const t = new THREE.Group(); const h = 1.2 + (i % 3) * .35;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, .5, 8), M(0x7a5a40)); trunk.position.y = .25;
  const top = new THREE.Mesh(new THREE.ConeGeometry(.6, h, 8), M(i % 2 ? 0x5e7f52 : 0x6f8f5c)); top.position.y = .5 + h / 2;
  t.add(trunk, top); add(t, x, .12, z, .8 + i * .08); });
for (let i = 0; i < 5; i++) add(box(.12, .5, .12, 0xd9c2a0, .03), -1.6 + i * .5, .37, 2.8, 1.2 + i * .04);
const smoke = [...Array(5)].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xf2ece4, transparent: true, opacity: .8 })); world.add(s); return s; });
function size() { const w = host.clientWidth, h = host.clientHeight, a = w / h, v = 5.6;
  Object.assign(cam, { left: -v * a, right: v * a, top: v, bottom: -v }); cam.updateProjectionMatrix(); r.setSize(w, h); }
size(); addEventListener("resize", size);
const pop = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
let t0 = null, on = false;
new IntersectionObserver(e => { const was = on; on = e[0].isIntersecting; if (on && t0 === null) t0 = performance.now();
  if (on && !was) loop(); }, { threshold: .2 }).observe(host);
function frame(now) {
  const t = still ? 99 : (now - (t0 ?? now)) / 1000;
  parts.forEach(p => { const k = Math.max(pop((t - p.userData.delay) / .55), .0001), b = p.userData.base;
    p.scale.set(b[0] * k, b[1] * k, b[2] * k); p.position.y = p.userData.y + (1 - Math.min(k, 1)) * .6; });
  const ang = still ? .7 : .7 + t * .12;
  cam.position.set(Math.sin(ang) * 14, 10, Math.cos(ang) * 14); cam.lookAt(0, .9, 0);
  glow.emissiveIntensity = 1.3 + Math.sin(t * 2.1) * .15 + Math.sin(t * 5.3) * .05;
  smoke.forEach((s, i) => { const u = (t * .35 + i / smoke.length) % 1, vis = t > 1.6 ? 1 : 0;
    s.position.set(1.2 + Math.sin(u * 6 + i) * .15, 3.9 + u * 2.2, -.9); s.scale.setScalar((.5 + u) * vis + .0001);
    s.material.opacity = .75 * (1 - u); });
  r.render(scene, cam);
}
function loop(now = performance.now()) { frame(now); if (on && !still) requestAnimationFrame(loop); }
frame(performance.now());
