type PhysicsObjectType = {
  mesh: THREE.Object3D<THREE.Object3DEventMap>;
  body: CANNON.Body;
  mixer?: THREE.AnimationMixer;
};
