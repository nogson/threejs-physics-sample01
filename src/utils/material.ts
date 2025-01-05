import * as CANNON from "cannon-es";

export function createDefaultMaterial() {
  const defaultMaterial = new CANNON.Material("default");

  const defaultMaterialContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.2,
      restitution: 0.5,
    }
  );

  return { defaultMaterial, defaultMaterialContactMaterial };
}
