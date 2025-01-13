import * as THREE from "three";
import * as CANNON from "cannon-es";
import { rotateBox } from "./util";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

function loadCharacter(): Promise<GLTF> {
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(
      "src/assets/models/motorcycle.glb",
      (gltf) => {
        resolve(gltf);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
  });
}

function getMeshSize(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size;
}

export async function createMainCharacter(bodyMaterial: CANNON.Material) {
  const gltf = await loadCharacter();
  const mesh = gltf.scene;
  const size = getMeshSize(mesh);
  const scale = 1 / size.y;

  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  mesh.scale.set(scale, scale, scale);
  const meshSize = getMeshSize(mesh);

  // アニメーションミキサーを作成
  const mixer = new THREE.AnimationMixer(mesh);

  // アニメーションクリップを取得
  const clips = gltf.animations;

  // アニメーションアクションを作成して再生
  clips.forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.play();
  });

  // CANNON.Boxのコンストラクタは、ボックスの半径を受け取るため /2 している
  // xは / 2すると倒れやすくなるので、yとzだけ / 2 している
  const shape = new CANNON.Box(
    new CANNON.Vec3(meshSize.x, meshSize.y / 2, meshSize.z / 2)
  );
  const body = new CANNON.Body({
    mass: 5,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: bodyMaterial,
  });
  return { mesh, body, mixer };
}

export const createFloor = (bodyMaterial: CANNON.Material) => {
  const shape = new CANNON.Plane();
  const body = new CANNON.Body({
    mass: 0,
    shape: shape,
    material: bodyMaterial,
  });

  body.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.4,
      color: 0x8fffa2,
    })
  );
  mesh.receiveShadow = true;
  mesh.rotation.x = -Math.PI * 0.5;

  return { mesh, body };
};

const moveInNormalDirection = (body: CANNON.Body, distance: number) => {
  const forward = new CANNON.Vec3(0, 0, 1); // 前方向のベクトル
  const quaternion = body.quaternion;
  const moveDirection = forward.clone();
  quaternion.vmult(moveDirection, moveDirection); // 法線方向に回転を適用

  return moveDirection.scale(distance, moveDirection); // 移動距離を適用
};

export function updateObjects({
  mainCharacter,
  speed,
  quaternion,
}: {
  mainCharacter: PhysicsObjectType;
  speed: number;
  quaternion: number;
}) {
  const position = moveInNormalDirection(mainCharacter.body, speed); // 法線方向に移動

  mainCharacter.mesh.position.copy(mainCharacter.body.position);
  mainCharacter.mesh.quaternion.copy(mainCharacter.body.quaternion);
  mainCharacter.body.position.vadd(position, mainCharacter.body.position);
  rotateBox(mainCharacter.body, new CANNON.Vec3(0, 1, 0), quaternion);
}

export function createBlock({
  scene,
  world,
  position,
  size,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
  position: THREE.Vector3;
  size: THREE.Vector3;
}) {
  
  const shape = new CANNON.Box(
    new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 0, 5),
    shape: shape,
  });

  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(body.position);

  world.addBody(body);
  scene.add(mesh);

  return { mesh, body };
}
