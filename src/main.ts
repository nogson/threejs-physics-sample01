import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  createFloor,
  createMainCharacter,
  updateObjects,
} from "./utils/object";
import { createDefaultMaterial } from "./utils/material";
import { getNormal } from "./utils/util";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const objectProps = {
  speed: 0,
  quaternion: 0,
  friction: 0.98,
};

/*
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
  alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Sizes
 */
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-3, 3, 5);
camera.lookAt(0, 0, 0);
scene.add(camera);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
scene.add(directionalLight);

/**
 * Physics
 */

const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
// 地球の重力加速度（重力）は 9.8 m/s2
world.gravity.set(0, -9.82, 0);

// Material
const { defaultMaterial, defaultMaterialContactMaterial } =
  createDefaultMaterial();
world.addContactMaterial(defaultMaterialContactMaterial);

// Floor
const floor = createFloor(defaultMaterial);
world.addBody(floor.body);
scene.add(floor.mesh);

// Main Character
const mainCharacter = createMainCharacter(defaultMaterial);
world.addBody(mainCharacter.body);
scene.add(mainCharacter.mesh);

/**
 * Controls
 */
window.addEventListener("keydown", (e) => move(e));
window.addEventListener("keyup", (e) => move(e));

function move(e: KeyboardEvent) {
  if (e.type === "keydown") {
    if (e.code === "ArrowUp") {
      objectProps.speed += 0.01;
    }
    if (e.code === "ArrowDown") {
      objectProps.speed -= 0.01;
    }
    if (e.code === "ArrowRight") {
      objectProps.quaternion += 0.1;
    }
    if (e.code === "ArrowLeft") {
      objectProps.quaternion -= 0.1;
    }
    if (e.code === "Space") {
      mainCharacter.body.velocity.y = 5; // y方向に5の速度でジャンプ
    }
  }
}
/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update controls
  //controls.update();

  // Update physics world
  world.step(1 / 60, deltaTime, 3);
  updateObjects(mainCharacter, objectProps);

  objectProps.speed *= objectProps.friction;
  objectProps.quaternion *= objectProps.friction;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
