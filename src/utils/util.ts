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
