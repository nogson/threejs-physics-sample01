import * as THREE from "three";
import * as CANNON from "cannon-es";
import { rotateBox } from "./util";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function loadCharacter() {
  const loader = new GLTFLoader();

  return new Promise<THREE.Group>((resolve) => {
    loader.load(
      "src/assets/models/motorcycle.glb",
      (gltf) => {
        resolve(gltf.scene);
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
  const mesh = await loadCharacter();
  console.log(mesh);
  const size = getMeshSize(mesh);
  const scale = 1 / size.y;

  mesh.castShadow = true;
  mesh.scale.set(scale, scale, scale);
  const meshSize = getMeshSize(mesh);

  const shape = new CANNON.Box(
    new CANNON.Vec3(meshSize.x, meshSize.y, meshSize.z)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: bodyMaterial,
  });
  return { mesh, body };
}

// export const createMainCharacter = (bodyMaterial: CANNON.Material) => {
//   const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
//   const body = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0, 3, 0),
//     shape: shape,
//     material: bodyMaterial,
//   });

//   const geometry = new THREE.BoxGeometry(1, 1, 1);
//   geometry.computeVertexNormals;

//   const materials = [
//     new THREE.MeshBasicMaterial({ color: 0x666666 }), // Front
//     new THREE.MeshBasicMaterial({ color: 0x666666 }), // Back
//     new THREE.MeshBasicMaterial({ color: 0x666666 }), // Top
//     new THREE.MeshBasicMaterial({ color: 0x666666 }), // Bottom
//     new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Right
//     new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Left
//   ];

//   const mesh = new THREE.Mesh(geometry, materials);

//   return { mesh, body };
// };

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

export function updateObjects(
  mainCharacter: { mesh: THREE.Mesh; body: CANNON.Body },
  { speed, quaternion }: { speed: number; quaternion: number }
) {
  const position = moveInNormalDirection(mainCharacter.body, speed); // 法線方向に移動

  mainCharacter.mesh.position.copy(mainCharacter.body.position);
  mainCharacter.mesh.quaternion.copy(mainCharacter.body.quaternion);
  mainCharacter.body.position.vadd(position, mainCharacter.body.position);
  rotateBox(mainCharacter.body, new CANNON.Vec3(0, 1, 0), quaternion);
}
