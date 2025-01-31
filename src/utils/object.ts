import * as THREE from "three";
import * as CANNON from "cannon-es";
import { rotateBox } from "./util";

const moveInNormalDirection = (body: CANNON.Body, distance: number) => {
  const forward = new CANNON.Vec3(0, 0, 1); // 前方向のベクトル
  const quaternion = body.quaternion;
  const moveDirection = forward.clone();
  quaternion.vmult(moveDirection, moveDirection); // 法線方向に回転を適用

  return moveDirection.scale(distance, moveDirection); // 移動距離を適用
};

export function updateObjects({
  mainCharacter,
  objects,
  speed,
  radian,
}: {
  mainCharacter: PhysicsObjectType;
  objects: PhysicsObjectType[][];
  speed: number;
  radian: number;
}) {
  const position = moveInNormalDirection(mainCharacter.body, speed); // 法線方向に移動
  const items = objects.flat();

  rotateBox(mainCharacter.body, new CANNON.Vec3(0, 1, 0), radian);
  mainCharacter.mesh.position.copy(mainCharacter.body.position);
  mainCharacter.mesh.quaternion.copy(mainCharacter.body.quaternion);

  mainCharacter.body.position.vadd(position, mainCharacter.body.position);

  items.forEach((object) => {
    //console.log(object.body.name);
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  });
}
