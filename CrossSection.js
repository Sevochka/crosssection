import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import CrossSectionHelper from './CrossSectionHelper';

class CrossSection extends THREE.Object3D {
  constructor(model) {
    super();

    this.name = '__CrossSection';
    this._boundBox = new THREE.Box3();
    this._boundBox.setFromObject(model);

    this._sizes = new THREE.Vector3();
    this._boundBox.getSize(this._sizes);
    let longestSide = Math.max(this._sizes.y, this._sizes.x);
    longestSide = Math.max(longestSide, this._sizes.z);

    this._planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), this._boundBox.min.x),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), this._boundBox.min.y),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), this._boundBox.min.z),
    ];

    /*
     *   Merge each BufferGeometry from model in one
     */
    let bufGeoms = [];
    model.traverse((n) => {
      if (n.type === 'Mesh' && n.material !== undefined) {
        let bufGeom = n.geometry.clone();
        n.updateWorldMatrix(true, true);
        n.renderOrder = 6;
        n.material.clippingPlanes = this._planes;
        bufGeom.applyMatrix4(n.matrixWorld);
        bufGeoms.push(bufGeom);
      } else if (n.type === 'LineSegments') {
        n.material.clippingPlanes = this._planes;
      }
    });

    let solidGeom = BufferGeometryUtils.mergeBufferGeometries(bufGeoms);

    let object = new THREE.Group();
    object.name = '__StencilGroups';
    this.add(object);

    this._planeObjects = [];
    let planeGeom = new THREE.PlaneBufferGeometry(
      longestSide * 2,
      longestSide * 2,
    );
    for (let i = 0; i < 3; i++) {
      let poGroup = new THREE.Group();
      let plane = this._planes[i];
      let stencilGroup = this.createPlaneStencilGroup(solidGeom, plane, i + 1);
      stencilGroup.name = '__StencilGroup' + i;

      // plane is clipped by the other clipping planes
      let planeMat = new THREE.MeshStandardMaterial({
        color: '#5c5c5c',
        clippingPlanes: this._planes.filter((p) => p !== plane),
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      });
      let po = new THREE.Mesh(planeGeom, planeMat);
      po.onAfterRender = function (renderer) {
        renderer.clearStencil();
      };
      po.renderOrder = i + 1.1;
      object.add(stencilGroup);
      poGroup.add(po);
      poGroup.name = '__Caps' + i;
      this._planeObjects.push(po);
      this.add(poGroup);
    }

    this._update();

    this._helper = new CrossSectionHelper(this._boundBox);
    this._helper.position.copy(this._boundBox.min);

    this.add(this._helper);

    this._negate = {
      x: false,
      y: false,
      z: false,
    };

    this.visible = false;
  }

  createPlaneStencilGroup(geometry, plane, renderOrder) {
    let group = new THREE.Group();
    let baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    let mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementStencilOp;
    mat0.stencilZFail = THREE.IncrementStencilOp;
    mat0.stencilZPass = THREE.IncrementStencilOp;

    let mesh0 = new THREE.Mesh(geometry, mat0);
    mesh0.renderOrder = renderOrder;

    group.add(mesh0);

    // front faces
    let mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [plane];
    mat1.stencilFail = THREE.DecrementStencilOp;
    mat1.stencilZFail = THREE.DecrementStencilOp;
    mat1.stencilZPass = THREE.DecrementStencilOp;

    let mesh1 = new THREE.Mesh(geometry, mat1);
    mesh1.renderOrder = renderOrder;

    group.add(mesh1);

    return group;
  }

  _update() {
    for (let i = 0; i < this._planeObjects.length; i++) {
      let plane = this._planes[i];
      let po = this._planeObjects[i];
      plane.coplanarPoint(po.position);
      po.lookAt(
        po.position.x - plane.normal.x,
        po.position.y - plane.normal.y,
        po.position.z - plane.normal.z,
      );
    }
  }

  moveYZ(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    if (!this._negate.x) {
      this._planes[0].constant = scale * this._sizes.x + this._boundBox.min.x;
    } else {
      this._planes[0].constant =
        (1 - scale) * this._sizes.x - this._boundBox.max.x;
    }

    this._helper.moveYZ(scale);
    this._update();
  }

  negateYZ() {
    this._planes[0].negate();
    this._negate.x = !this._negate.x;
    this._update();
  }

  moveXZ(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    if (!this._negate.y) {
      this._planes[1].constant = scale * this._sizes.y + this._boundBox.min.y;
    } else {
      this._planes[1].constant =
        (1 - scale) * this._sizes.y - this._boundBox.max.y;
    }

    this._helper.moveXZ(scale);
    this._update();
  }

  negateXZ() {
    this._planes[1].negate();
    this._negate.y = !this._negate.y;
    this._update();
  }

  moveXY(scale) {
    if (scale > 1) scale = 1;
    if (scale < 0) scale = 0;

    if (!this._negate.z) {
      this._planes[2].constant = scale * this._sizes.z + this._boundBox.min.z;
    } else {
      this._planes[2].constant =
        (1 - scale) * this._sizes.z - this._boundBox.max.z;
    }

    this._helper.moveXY(scale);
    this._update();
  }

  negateXY() {
    this._planes[2].negate();
    this._negate.z = !this._negate.z;
    this._update();
  }

  toggleHelper(active) {
    if (active) this._helper.visible = active;
    else this._helper.visible = !this._helper.visible;
  }
}

export default CrossSection;
