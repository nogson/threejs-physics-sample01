import * as THREE from "three";
import * as CANNON from "cannon-es";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import CannonDebugger from "cannon-es-debugger";

import {
  createFloor,
  createMainCharacter,
  updateObjects,
  createBlock,
} from "./utils/object";
import { createDefaultMaterial } from "./utils/material";
import { initPhysics } from "./utils/physics";
import { initLight } from "./utils/light";

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
  // camera.aspect = sizes.width / sizes.height;
  cameraResize();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function cameraResize() {
  const frustumSize = 10;
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = (frustumSize * aspect) / -2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
}

/**
 * Camera
 */
// Base camera
// const camera = new THREE.PerspectiveCamera(
//   75,
//   sizes.width / sizes.height,
//   0.1,
//   100
// );
const camera = new THREE.OrthographicCamera(
  0.1, // near
  1000 // far
);
cameraResize();
scene.add(camera);

// OrbitControlsの設定
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // 慣性を有効にする

/**
 * Lights
 */
const { ambientLight, directionalLight, spotLight } = initLight(scene);

/**
 * Physics
 */

const world = initPhysics();

// CannonDebuggerの設定
const cannonDebugger = CannonDebugger(scene, world, {
  color: 0xff0000, // デバッグ用のボディの色
});

// Material
const { defaultMaterial, defaultMaterialContactMaterial } =
  createDefaultMaterial();
world.addContactMaterial(defaultMaterialContactMaterial);

// Floor
const floor = createFloor(defaultMaterial);
world.addBody(floor.body);
scene.add(floor.mesh);

// Main Character
const mainCharacter = await createMainCharacter(defaultMaterial);
world.addBody(mainCharacter.body);
scene.add(mainCharacter.mesh);

// Block
const blockLength = 10;
const blocks: any = [];
for (let i = 0; i < blockLength; i++) {
  const size = 0.5;
  const x = (i % 5) * 0.5;
  const y = Math.floor(i / 5) + 1;
  blocks.push(
    createBlock({
      scene,
      world,
      size: new THREE.Vector3(size, size, size),
      position: new THREE.Vector3(x, y, 5),
      bodyMaterial: defaultMaterial,
    })
  );
}

/**
 * Controls
 */
window.addEventListener("keydown", (e) => move(e));
window.addEventListener("keyup", (e) => move(e));

const pressedKeys = new Set<string>();

function move(e: KeyboardEvent) {
  mainCharacter.body.wakeUp(); // ボディをアクティブにする

  if (e.type === "keydown") {
    pressedKeys.add(e.code);
  } else if (e.type === "keyup") {
    pressedKeys.delete(e.code);
  }

  // 押されているキーを処理
  if (pressedKeys.has("ArrowUp")) {
    objectProps.speed += 0.01;
  }
  if (pressedKeys.has("ArrowDown")) {
    objectProps.speed -= 0.01;
  }
  if (pressedKeys.has("Space")) {
    mainCharacter.body.velocity.y += 2;
  }
  // 回転
  if (objectProps.speed !== 0) {
    if (pressedKeys.has("ArrowRight")) {
      objectProps.quaternion = -0.05;
    }
    if (pressedKeys.has("ArrowLeft")) {
      objectProps.quaternion = +0.05;
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
  updateObjects({
    mainCharacter,
    speed: objectProps.speed,
    quaternion: objectProps.quaternion,
  });

  // block
  blocks.forEach((block: any) => {
    block.mesh.position.copy(block.body.position);
    block.mesh.quaternion.copy(block.body.quaternion);
  });

  objectProps.speed *= objectProps.friction;
  objectProps.quaternion *= objectProps.friction;

  if (pressedKeys.size === 0) {
    if (objectProps.speed < 0.005 && objectProps.speed > -0.005) {
      objectProps.speed = 0;
    }
  }

  // カメラをmainCharacter.meshの位置に合わせて移動
  camera.position.x = mainCharacter.mesh.position.x + 5;
  camera.position.y = mainCharacter.mesh.position.y + 5; // 少し上から見る
  camera.position.z = mainCharacter.mesh.position.z + 5; // 少し後ろから見る
  camera.lookAt(mainCharacter.mesh.position);

  spotLight.position.set(
    mainCharacter.mesh.position.x,
    mainCharacter.mesh.position.y + 8,
    mainCharacter.mesh.position.z + 8
  );

  if (objectProps.speed !== 0) {
    mainCharacter.mixer.update(deltaTime);
  }

  cannonDebugger.update(); // Update the CannonDebugger meshes

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
