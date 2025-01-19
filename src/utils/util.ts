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
  const quaternion = body.quaternion;
  const euler = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
  );

  // Check if the object's tilt exceeds the threshold
  return Math.abs(euler.x) > threshold || Math.abs(euler.z) > threshold;
}

export function playSound(sound: string | undefined) {
  const audio = new Audio(sound);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
