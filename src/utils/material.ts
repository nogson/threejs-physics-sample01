import * as CANNON from "cannon-es";

export function createPhysicsMaterial({
  friction = 10,
  restitution = 0.0,
}: {
  friction?: number;
  restitution?: number;
} = {}) {
  const material = new CANNON.Material("default");

  const materialContactMaterial = new CANNON.ContactMaterial(
    material,
    material,
    {
      friction,
      restitution,
    }
  );

  return { material, materialContactMaterial };
}
