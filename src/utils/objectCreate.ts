import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createPhysicsMaterial } from "./material";

function loadModel(src: string): Promise<GLTF> {
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(
      src,
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

export async function createMainCharacter() {
  const gltf = await loadModel("src/assets/models/motorcycle.glb");
  const mesh = gltf.scene;
  const size = getMeshSize(mesh);
  const scale = 1 / size.y;
  const bodyMaterial = createPhysicsMaterial({
    friction: 1.5,
    restitution: 0.1,
  });

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
    new CANNON.Vec3(meshSize.x / 2, meshSize.y / 2, meshSize.z / 2)
  );
  const body = new CANNON.Body({
    mass: 20,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: bodyMaterial.material,
  }) as CANNON.Body & { name: string }; // nameを追加したいので、型を拡張

  body.name = "mainCharacter";

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
    new THREE.PlaneGeometry(50, 50),
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

export function createBlock({
  position,
  size,
  bodyMaterial,
}: {
  position: THREE.Vector3;
  size: THREE.Vector3;
  bodyMaterial: CANNON.Material;
}) {
  const shape = new CANNON.Box(
    new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: shape,
    material: bodyMaterial,
  });

  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffee80,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(body.position);

  return { mesh, body };
}

export function createBlocks({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const bodyMaterial = createPhysicsMaterial({
    friction: 0.1,
    restitution: 0.5,
  });

  const blockLength = 10;
  const items: PhysicsObjectType[] = [];
  for (let i = 0; i < blockLength; i++) {
    const size = 0.5;
    const x = (i % 5) * size;
    const y = Math.floor(i / 5) / 2 + size / 2;
    const block = createBlock({
      size: new THREE.Vector3(size, size, size / 2),
      position: new THREE.Vector3(x, y, 5),
      bodyMaterial: bodyMaterial.material,
    });
    items.push(block);
    world.addBody(block.body);
    scene.add(block.mesh);
  }
  return items;
}

function createPoint({
  bodyMaterial,
  position,
}: {
  bodyMaterial: CANNON.Material;
  position: CANNON.Vec3;
}) {
  const geometry = new THREE.ConeGeometry(0.25, 1, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const shape = new CANNON.Cylinder(0.25, 0.25, 1, 32);

  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    material: bodyMaterial,
    position: position,
  }) as CANNON.Body & { name: string; isActive: boolean }; // nameを追加したいので、型を拡張

  body.isActive = true;

  mesh.position.copy(body.position);

  return { mesh, body };
}

function getPosition() {
  const pos = Math.random() * 30 - 15;
  return pos > 0 ? pos + 2 : pos - 2;
}

export function createPointItems({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const items: PhysicsObjectType[] = [];
  const bodyMaterial = createPhysicsMaterial({
    friction: 0.1,
    restitution: 0.5,
  });

  const itemLength = 10;
  for (let i = 0; i < itemLength; i++) {
    const position = new CANNON.Vec3(getPosition(), 0.5, getPosition());
    const item = createPoint({ bodyMaterial: bodyMaterial.material, position });

    world.addBody(item.body);
    scene.add(item.mesh);
    items.push(item);
  }

  return items;
}

export async function createTree({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const treesLength = 10;
  const trees = [];
  const gltf = await loadModel("src/assets/models/tree.glb");
  const mesh = gltf.scene;
  const size = getMeshSize(mesh);
  const bodyMaterial = createPhysicsMaterial({
    friction: 1.5,
    restitution: 0.1,
  });

  for (let i = 0; i < treesLength; i++) {
    const mesh = gltf.scene.clone();
    const scale = (Math.random() * 2 + 1) / size.y;

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    mesh.scale.set(scale, scale, scale);
    const meshSize = getMeshSize(mesh);

    // CANNON.Boxのコンストラクタは、ボックスの半径を受け取るため /2 している
    const shape = new CANNON.Box(
      new CANNON.Vec3(meshSize.x / 2, meshSize.y / 2, meshSize.z / 2)
    );
    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(getPosition(), meshSize.y / 2, getPosition()),
      shape: shape,
      material: bodyMaterial.material,
    }) as CANNON.Body & { name: string }; // nameを追加したいので、型を拡張

    body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, -1, 0),
      Math.PI * (Math.random() * 4)
    );

    scene.add(mesh);
    world.addBody(body);
    trees.push({ mesh, body });
  }

  return trees;
}
