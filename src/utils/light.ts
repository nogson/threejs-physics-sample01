import * as THREE from "three";

export function initLight(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  // 影のカメラ設定を調整
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.position.set(0, 10, 0); // ライトの位置を設定
  scene.add(directionalLight);

  // スポットライトの追加
  const spotLight = new THREE.SpotLight(0xffffff, 150);
  spotLight.position.set(0, 8, 8);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 1; // 陰影の柔らかさ
  spotLight.decay = 2; // 光の減衰率
  spotLight.distance = 200; // 光の届く距離

  scene.add(spotLight);

  return { ambientLight, directionalLight, spotLight };
}
