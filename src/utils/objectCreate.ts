import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createPhysicsMaterial } from "./material";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
const basePath = import.meta.env.BASE_URL;
console.log(basePath);
const colors = [0xffee80, 0xff2be6, 0xff2b2e, 0x2b2bff, 0x2bff2b];

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

function loadFont(url: string): Promise<any> {
  const loader = new FontLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (font) => resolve(font),
      undefined,
      (error) => reject(error)
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
  const gltf = await loadModel(`${basePath}glb/motorcycle.glb`);
  const mesh = gltf.scene;
  const size = getMeshSize(mesh);
  const scale = 1 / size.y;
  const bodyMaterial = createPhysicsMaterial({
    friction: 0.5,
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
    mass: 50,
    position: new CANNON.Vec3(0, meshSize.y / 2, 0),
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
    friction: 0.5,
    restitution: 2,
  });

  const items: PhysicsObjectType[] = [];

  for (let i = 0; i < 5; i++) {
    const size = 0.5;
    const z = (i % 5) * size;
    const y = Math.floor(i / 5) / 2 + size / 2;
    const block = createBlock({
      size: new THREE.Vector3(size / 2, size, size),
      position: new THREE.Vector3(3, y, z),
      bodyMaterial: bodyMaterial.material,
    });
    items.push(block);
    world.addBody(block.body);
    scene.add(block.mesh);
  }

  for (let i = 0; i < 16; i++) {
    const size = 0.5;
    const x = -7;
    const y = Math.floor(i / 8) * size + size / 2;
    const z = (i % 8) * size - 4;

    const block = createBlock({
      size: new THREE.Vector3(((2 - Math.floor(i / 8)) * size) / 2, size, size),
      position: new THREE.Vector3(x, y, z),
      bodyMaterial: bodyMaterial.material,
    });
    items.push(block);
    world.addBody(block.body);
    scene.add(block.mesh);
  }

  for (let i = 0; i < 10; i++) {
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

function createSphere({
  position,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
  position: CANNON.Vec3;
}) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 0.3 + 0.05;
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const bodyMaterial = createPhysicsMaterial({
    friction: 0.1,
    restitution: 0.5,
  });
  const shape = new CANNON.Sphere(size);
  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    material: bodyMaterial.material,
    position: position,
  }) as CANNON.Body & { name: string; isActive: boolean }; // nameを追加したいので、型を拡張

  return { mesh, body };
}

export function createSpheres({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const items: PhysicsObjectType[] = [];

  for (let i = 0; i < 20; i++) {
    const position = new CANNON.Vec3(getPosition(), 0.5, getPosition());
    const sphere = createSphere({ scene, world, position });

    items.push(sphere);
    scene.add(sphere.mesh);
    world.addBody(sphere.body);
  }

  return items;
}

function createPoint({
  bodyMaterial,
  mesh,
  position,
}: {
  bodyMaterial: CANNON.Material;
  position: CANNON.Vec3;
  mesh: THREE.Object3D<THREE.Object3DEventMap>;
}) {
  const shape = new CANNON.Cylinder(0.2, 0.2, 1, 32);

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

export async function createPointItems({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const items: PhysicsObjectType[] = [];
  const bodyMaterial = createPhysicsMaterial({
    friction: 10,
    restitution: 1,
  });

  const gltf = await loadModel(`${basePath}models/point.glb`);

  const itemLength = 10;
  for (let i = 0; i < itemLength; i++) {
    const mesh = gltf.scene.clone();
    const size = getMeshSize(mesh);
    const scale = 1 / size.y;
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    mesh.scale.set(scale, scale, scale);

    const position = new CANNON.Vec3(getPosition(), size.y / 2, getPosition());
    const item = createPoint({
      bodyMaterial: bodyMaterial.material,
      position,
      mesh: mesh,
    });
    item.body.name = "point" + i;
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
  const gltf = await loadModel(`${basePath}glb/tree.glb`);
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

export async function createTextObject({
  scene,
  world,
  text,
  position,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
  text: string;
  position: { x: number; y: number; z: number };
}) {
  const textArr = text.split("");

  const font = await loadFont(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
  );
  const meshes: THREE.Mesh[] = [];
  const items: PhysicsObjectType[] = [];
  const fontSize = 0.5;

  textArr.forEach((text) => {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: fontSize,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });
    // バウンディングボックスを計算して中心を原点に合わせる
    textGeometry.computeBoundingBox();
    const boundingBox = textGeometry.boundingBox;
    const center = new THREE.Vector3();
    boundingBox?.getCenter(center);
    textGeometry.translate(-center.x, -center.y, -center.z);

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.castShadow = true;
    textMesh.receiveShadow = true;
    meshes.push(textMesh);
  });

  meshes.forEach((mesh, index) => {
    const beforeMesh = meshes[index - 1];
    const shape = new CANNON.Box(
      new CANNON.Vec3(fontSize / 2, fontSize / 2, 0.1)
    ); // テキストの物理形状を適当に設定
    const body = new CANNON.Body({
      mass: 1,
      shape: shape,
    });
    if (beforeMesh) {
      const size = getMeshSize(beforeMesh);
      body.position.copy(
        new CANNON.Vec3(
          beforeMesh.position.x + size.x / 2 + getMeshSize(mesh).x / 2 + 0.4,
          size.y / 2,
          position.z
        )
      );
    } else {
      const size = getMeshSize(mesh);
      body.position.copy(new CANNON.Vec3(position.x, size.y / 2, position.z));
    }

    mesh.position.copy(body.position);

    world.addBody(body);
    scene.add(mesh);
    items.push({ mesh, body });
  });

  return items;
}

export async function createCar({
  scene,
  world,
}: {
  scene: THREE.Scene;
  world: CANNON.World;
}) {
  const items = [];
  const gltf = await loadModel(`${basePath}glb/car.glb`);
  const mesh = gltf.scene;
  const size = getMeshSize(mesh);
  const bodyMaterial = createPhysicsMaterial({
    friction: 1.5,
    restitution: 0.1,
  });

  const scale = 1 / size.y;

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
    position: new CANNON.Vec3(-2, meshSize.y / 2, -5),
    shape: shape,
    material: bodyMaterial.material,
  }) as CANNON.Body & { name: string }; // nameを追加したいので、型を拡張

  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);

  scene.add(mesh);
  world.addBody(body);
  items.push({ mesh, body });

  return items;
}
