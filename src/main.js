import './main.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { PointerLockControlsCannon } from './PointerLockControlsCannon.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js';

import nebula from '../public/assets/nebula.jpg'
import stars from '../public/assets/stars.jpg'
import stone from '../public/assets/HactoryStone.png'

import negx from '../public/assets/skybox/negx.jpg'
import negy from '../public/assets/skybox/negy.jpg'
import negz from '../public/assets/skybox/negz.jpg'
import posx from '../public/assets/skybox/posx.jpg'
import posy from '../public/assets/skybox/posy.jpg'
import posz from '../public/assets/skybox/posz.jpg'
import { normalize } from 'three/src/math/MathUtils.js'

/**
 * Base
 */
//Canvas
const canvas = document.querySelector('.webgl')

//Scene
const scene = new THREE.Scene()

//Camera
let camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 5000)
//position of camera above ground
camera.position.set(0, 8, 0)

//Objects
const objects = []

/**
 * Textures
 */
//Textures
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

scene.background = cubeTextureLoader.load([
  posx,
  negx,
  posy,
  negy,
  posz,
  negz
])

//Asset loader
const assetLoader = new GLTFLoader()

/*
//Import Blender Stuff
const monkeyUrl = new URL('../public/assets/monkey.glb', import.meta.url)
assetLoader.load(monkeyUrl.href, function (gltf) {
    const model = gltf.scene
    scene.add(model)
    model.position.set(0, 0, 0)
}, undefined, function (error) {
    console.error(error)
})
*/

//Multimaterial Box
const box2MultiMaterial = [
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) })
]

//Physics 
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0)
})

//world.broadphase = new CANNON.GridBroadphase(world);
//world.broadphase.useBoundingBoxes=true
//world.allowSleep=true

// Tweak contact properties.
// Contact stiffness - use to make softer/harder contacts
world.defaultContactMaterial.contactEquationStiffness = 1e9

// Stabilization time in number of timesteps
world.defaultContactMaterial.contactEquationRelaxation = 4

const solver = new CANNON.GSSolver()
solver.iterations = 10
solver.tolerance = 1e-7
world.solver = new CANNON.SplitSolver(solver)

const mainMaterial = new CANNON.Material()
const mainContactMat = new CANNON.ContactMaterial(mainMaterial, mainMaterial, {
  friction: 0.0003,
  restitution: 0,
})
world.addContactMaterial(mainContactMat)

//Fog or FogExp2 [fog grows exponetially] (color, near limit, far limit)
scene.fog = new THREE.Fog(0xFFFFFF, 400, 600)

/**
 * Lights
 */

//Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

//Directional Light
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 50
const dLightSize = 200
directionalLight.shadow.camera.left = - dLightSize
directionalLight.shadow.camera.top = dLightSize
directionalLight.shadow.camera.right = dLightSize
directionalLight.shadow.camera.bottom = - dLightSize
directionalLight.position.set(-5, 15, 10)
scene.add(directionalLight)

/*
//Directional Light Helpers
const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5)
scene.add(dLightHelper)
dLightHelper.update()
const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(dLightShadowHelper)
dLightShadowHelper.update()
*/

//FPS Indicator
const container = document.getElementById( 'container' )
const stats = new Stats()
stats.domElement.style.position = 'absolute'
stats.domElement.style.top = '0px'
container.appendChild( stats.domElement )

//Placeholder Block
const placeholderGeo = new THREE.BoxGeometry(5, 5, 5)
let placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
let placeholderMesh = new THREE.Mesh(placeholderGeo, placeholderMaterial)
scene.add(placeholderMesh)

const map = new THREE.TextureLoader().load(stone)
const cubeGeo = new THREE.BoxGeometry(5, 5, 5)
const cubeMat = new THREE.MeshLambertMaterial({ color: 0xfeb74c, map: map })

//TODO
//const voxelGrid = new THREE.BufferGeometry()
//const voxels = new Float32Array([])

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let isShiftDown = false

document.addEventListener( 'mousemove', ( event ) => {
    //camera.rotation.y -= event.movementX * 0.004 
    camera.rotation.x -= event.movementY * 0.00225
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))

} )

document.addEventListener('mousemove', onMouseMove)
document.addEventListener('mousedown', onMouseDown)
document.addEventListener('keydown', onkeydown)
document.addEventListener('keyup', onkeyup)

//move this outside a function, should continuously running
function onMouseMove(event) {
  
  mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(objects, false)
 
  if (intersects.length > 0) {

    const intersect = intersects[0]
    if (intersect.object.id !== 12){
      if (intersect.distance >= 25) {
        placeholderMesh.visible = false
      } if (intersect.distance <= 25) {
        placeholderMesh.visible = true
      }
   
      placeholderMesh.color = '#0xff0000'
      //(1/((intersect.distance/25)))*10
      console.log(placeholderMesh.color)
    //moves placeholder mesh
    
    placeholderMesh.position.copy(intersect.point).add(intersect.face.normal)
    placeholderMesh.position.divideScalar(5).floor().multiplyScalar(5).addScalar(2.5)

    renderer.render(scene, camera)
      
  }
  }
}

function onMouseDown(event) {

  mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)

  //camera.position.copy(playerBody.position)
  /*
  //Translates mouse position into 3d co-ords
  var vec = new THREE.Vector3()
  var pos = new THREE.Vector3()

  vec.set(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 )
  
  vec.unproject( camera )
 
  vec.sub( camera.position ).normalize()
  
  var distance = - camera.position.z / vec.z;
  
  pos.copy( camera.position ).add( vec.multiplyScalar( distance ) )

  console.log(camera.position)
  console.log(pos)
  console.log(playerBody.position)
  
  const raycast = new CANNON.Ray(pos, camera.position)

  console.log(raycast)
  const rayOptions = { from: pos, mode: 1, result: raycastResult, to: camera.position }
  var raycastResult = new CANNON.RaycastResult()
  const cannonIntersects = raycast.intersectWorld(world, rayOptions)
  */

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(objects, false)

  if (intersects.length > 0) {

    const intersect = intersects[0]
    //const cannonIntersect = raycastResult[0]
    // delete cube
    if ((intersect.object.id !== 12) && (intersect.distance <= 25)){
      
    if (event.button == 2) {

        scene.remove(intersect.object)

        objects.splice(objects.indexOf(intersect.object), 1)

        //world.removeBody(cannonIntersect)
      
      // create cube

    } else {

      const voxel = new THREE.Mesh(cubeGeo, cubeMat)

      const voxelBody = new CANNON.Body({
       type: CANNON.Body.STATIC,
       shape: new CANNON.Box(new CANNON.Vec3(5, 5, 5)),
       material: mainMaterial
      })

      voxel.position.copy(intersect.point).add(intersect.face.normal)
      voxel.position.divideScalar(5).floor().multiplyScalar(5).addScalar(2.5)
      scene.add(voxel)
      objects.push(voxel)

      //Voxel Mesh Merge
      voxelBody.position.copy(voxel.position)
      voxelBody.quaternion.copy(voxel.quaternion)

      world.addBody(voxelBody)
    }

    renderer.render(scene, camera)

  }
  }
}

function addVoxel (x, y, z, type) {

  const voxel = new THREE.Mesh(cubeGeo, cubeMat)

  const voxelBody = new CANNON.Body({
   type: CANNON.Body.STATIC,
   shape: new CANNON.Box(new CANNON.Vec3(5, 5, 5)),
   material: mainMaterial
  })

  voxel.position.set(x, y, z)
  voxel.position.divideScalar(5).floor().multiplyScalar(5).addScalar(2.5)
  scene.add(voxel)
  objects.push(voxel)

  voxelBody.position.copy(voxel.position)
  voxelBody.quaternion.copy(voxel.quaternion)

  world.addBody(voxelBody)
  physObjs.push(voxelBody)
  return voxelBody
}

function removeVoxel (x, y, z, type) {
  
    scene.remove(intersect.object)

    objects.splice(objects.indexOf(intersect.object), 1)

    world.removeBody(intersect.object.position)
  }


/**
 * World Generation
 */
let x
let y
let z

let generate = true

function generateWorld(x, y, z){
x *= 5
y *= 5
z *= 5

let value = noise.simplex3(x / 100, y / 100, z / 100);

  if (value < 0){
    generate = false
  } else if (value > 0) {
    generate = true
  } else {
    generate = false
  }

  if (generate){

  const voxel = new THREE.Mesh(cubeGeo, cubeMat)

  const voxelBody = new CANNON.Body({
   type: CANNON.Body.STATIC,
   shape: new CANNON.Box(new CANNON.Vec3(5, 5, 5)),
   material: mainMaterial
  })

  voxel.position.set(x,y,z)
  voxel.position.divideScalar(5).floor().multiplyScalar(5).addScalar(2.5)
  scene.add(voxel)

  objects.push(voxel)

  //Voxel Mesh Merge
  voxelBody.position.copy(voxel.position)
  voxelBody.quaternion.copy(voxel.quaternion)

  world.addBody(voxelBody)
} 
}

noise.seed(Math.random());
for (z = -30; z < 30; z++){
  for (x = -30; x < 30; x++) {
    for (y = -2; y < 0; y++) {
   
    generateWorld(x, y, z)

}}}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.shadowMap.enabled = true
//higher quality shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Create the user collision
const playerShape = new CANNON.Box(new CANNON.Vec3(1, 2, 1))
const playerBody = new CANNON.Body({ mass: 70, shape: playerShape, linearDamping: 0.25, material: mainMaterial })
playerBody.position.set(0, 10, 0)
world.addBody(playerBody)

const controls = new PointerLockControlsCannon(camera, playerBody)
scene.add(controls.getObject())
controls.enabled = true

window.addEventListener('click', (event) => {
  if (!controls.enabled) {
    return
  }
  document.body.requestPointerLock();
})

//Current Time
let time = Date.now()

//Physics Timestep
const timeStep = 1 / 60

//animation
const tick = () => {
  window.requestAnimationFrame(tick)
  //current time
  const currentTime = Date.now()
  const deltaTime = currentTime - time
  time = currentTime
  //delta time is miliseconds per frame

  //Grid vertex changes
  //plane.geometry.attributes.position.array[(Math.floor(((plane.geometry.attributes.position.array.length - 1) * Math.random())))] -= Math.sin(Math.random() / 10)
  //plane.geometry.attributes.position.needsUpdate = true

  //Physics (1 for the 3rd parameter makes it faster but lower quality)
  world.step(timeStep, deltaTime, 1)

  //Controls
  controls.update(deltaTime)
  renderer.render(scene, camera)
  stats.update()
}
tick()

window.addEventListener('resize', () => {

  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.render(scene, camera)
})

