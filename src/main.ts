import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import CannonDebugger from "cannon-es-debugger";
import { updateObjects } from "./utils/object";
import {
  createFloor,
  createMainCharacter,
  createPointItems,
  createBlocks,
  createTree,
} from "./utils/objectCreate";
import { createPhysicsMaterial } from "./utils/material";
import { initPhysics } from "./utils/physics";
import { initLight } from "./utils/light";
import { initGameState } from "./components/GameState";
import { globalState } from "./models/globalState";
import { isObjectTippedOver, playSound } from "./utils/util";
import enginSound from "./assets/sound/engine.mp3";

initGameState();

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
const defaultMaterial = createPhysicsMaterial();
world.addContactMaterial(defaultMaterial.materialContactMaterial);

// Floor
const floor = createFloor(defaultMaterial.material);
world.addBody(floor.body);
scene.add(floor.mesh);

// Main Character
const mainCharacter = await createMainCharacter();
world.addBody(mainCharacter.body);
scene.add(mainCharacter.mesh);

// Block
const blockItems = createBlocks({
  scene,
  world,
});

const trees = await createTree({ scene, world });

// Passing point
const pointItems = createPointItems({ scene, world });

// pointItems.forEach((point) => {
//   point.body.addEventListener("collide", (e: any) => {
//     if (e.body.name === "mainCharacter") {
//       console.log(isObjectTippedOver(point.body));

//       // if (isObjectTippedOver(point.body) && point.body.isActive) {
//       //   globalState.score += 1;
//       //   point.body.isActive = false;
//       //   point.body.removeEventListener("collide");
//       // }
//     }
//   });
// });

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
    // playSound(enginSound);
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
    //mainCharacter.body.velocity.y += 2;
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
    objects: [blockItems, pointItems, trees],
    speed: objectProps.speed,
    quaternion: objectProps.quaternion,
  });

  objectProps.speed *= objectProps.friction;
  objectProps.quaternion *= objectProps.friction * 0.95;

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
    mainCharacter.body.position.x,
    mainCharacter.body.position.y + 8,
    mainCharacter.body.position.z
  );

  if (objectProps.speed !== 0) {
    mainCharacter.mixer.update(deltaTime);
  }

  pointItems.forEach((point) => {
    if (isObjectTippedOver(point.body) && point.body.isActive) {
      globalState.score += 1;
      point.body.isActive = false;
    }
  });

  cannonDebugger.update(); // Update the CannonDebugger meshes

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
