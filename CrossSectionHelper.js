import * as THREE from 'three';

class CrossSectionHelper extends THREE.Object3D {
  constructor(boundBox) {
    super();

    this._boundBox = boundBox.clone();
    let size = new THREE.Vector3();
    boundBox.getSize(size);
    this._sizeX = size.x;
    this._sizeY = size.y;
    this._sizeZ = size.z;

    this.buildHelper();
  }

  buildHelper() {
    let planeMat = new THREE.MeshBasicMaterial({
      color: 'blue',
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    let planeLineMat = new THREE.LineBasicMaterial({ color: 'black' });

    /*
     *   Plane XY
     */
    this._planeXYHelper = new THREE.Group();

    let planeXYGeom = new THREE.PlaneBufferGeometry(this._sizeX, this._sizeY);
    planeXYGeom.translate(this._sizeX / 2, this._sizeY / 2, 0);
    let planeXYMesh = new THREE.Mesh(planeXYGeom, planeMat);

    this._planeXYHelper.add(planeXYMesh);

    let planeXYLineGeom = new THREE.BufferGeometry();
    planeXYLineGeom.vertices = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this._sizeX, 0, 0),
      new THREE.Vector3(this._sizeX, this._sizeY, 0),
      new THREE.Vector3(0, this._sizeY, 0),
      new THREE.Vector3(0, 0, 0),
    ];

    let planeXYLine = new THREE.Line(planeXYLineGeom, planeLineMat);
    this._planeXYHelper.add(planeXYLine);

    /*
     *   Plane YZ
     */
    this._planeYZHelper = new THREE.Group();

    let planeYZGeom = new THREE.PlaneBufferGeometry(this._sizeZ, this._sizeY);
    planeYZGeom.translate(this._sizeZ / 2, this._sizeY / 2, 0);
    planeYZGeom.rotateY(-Math.PI / 2);
    let planeYZMesh = new THREE.Mesh(planeYZGeom, planeMat);

    this._planeYZHelper.add(planeYZMesh);

    let planeYZLineGeom = new THREE.BufferGeometry();
    planeYZLineGeom.vertices = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, this._sizeZ),
      new THREE.Vector3(0, this._sizeY, this._sizeZ),
      new THREE.Vector3(0, this._sizeY, 0),
      new THREE.Vector3(0, 0, 0),
    ];

    let planeYZLine = new THREE.Line(planeYZLineGeom, planeLineMat);
    this._planeYZHelper.add(planeYZLine);

    /*
     *   Plane XZ
     */
    this._planeXZHelper = new THREE.Group();

    let planeXZGeom = new THREE.PlaneBufferGeometry(this._sizeX, this._sizeZ);
    planeXZGeom.translate(this._sizeX / 2, this._sizeZ / 2, 0);
    planeXZGeom.rotateX(Math.PI / 2);
    let planeXZMesh = new THREE.Mesh(planeXZGeom, planeMat);

    this._planeXZHelper.add(planeXZMesh);

    let planeXZLineGeom = new THREE.BufferGeometry();
    planeXZLineGeom.vertices = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, this._sizeZ),
      new THREE.Vector3(this._sizeX, 0, this._sizeZ),
      new THREE.Vector3(this._sizeX, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ];

    let planeXZLine = new THREE.Line(planeXZLineGeom, planeLineMat);
    this._planeXZHelper.add(planeXZLine);

    // Compile planes
    this.add(this._planeXYHelper, this._planeXZHelper, this._planeYZHelper);
  }

  moveYZ(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    this._planeYZHelper.position.x = this._sizeX * scale;
  }

  moveXZ(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    this._planeXZHelper.position.y = this._sizeY * scale;
  }

  moveXY(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    this._planeXYHelper.position.z = this._sizeZ * scale;
  }
}

export default CrossSectionHelper;
