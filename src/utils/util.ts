import * as CANNON from "cannon-es";
import * as THREE from "three";

export function rotateBox(
  targetBody: CANNON.Body,
  axis: CANNON.Vec3,
  angle: number
) {
  const quaternion = new CANNON.Quaternion();
  quaternion.setFromAxisAngle(axis, angle);
  targetBody.quaternion.mult(quaternion, targetBody.quaternion);
}

export function getNormal(mesh: THREE.Mesh, faceIndex: number) {
  const normal = new THREE.Vector3();
  const normalAttribute = mesh.geometry.attributes.normal;
  normal.fromBufferAttribute(normalAttribute, faceIndex);
  return normal;
}

export function isObjectTippedOver(
  body: CANNON.Body,
  threshold: number = Math.PI / 4
): boolean {
  // クォータニオンの正規化
  const quaternion = body.quaternion;
  // const normalizedQuaternion = new THREE.Quaternion(
  //   quaternion.x,
  //   quaternion.y,
  //   quaternion.z,
  //   quaternion.w
  // ).normalize();

  // オイラー角の順序を確認
  // const euler = new THREE.Euler().setFromQuaternion(
  //   normalizedQuaternion,
  //   "XYZ"
  // );

  // オブジェクトの傾きが閾値を超えているかをチェック
  // return Math.abs(euler.x) > threshold || Math.abs(euler.z) > threshold;
  // TOD0 何故か値がおかしいので、固定値で判定する
  return (
    (quaternion.x < -threshold && quaternion.x < 0) ||
    (quaternion.x > threshold && quaternion.x > 0) ||
    (quaternion.z < -threshold && quaternion.z < 0) ||
    (quaternion.z > threshold && quaternion.z > 0)
  );
}

export function playSound(sound: string | undefined) {
  const audio = new Audio(sound);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
