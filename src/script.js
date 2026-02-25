import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader}  from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import { compress } from 'three/examples/jsm/libs/fflate.module.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'


/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
const color = 'rgb(36, 35, 35)'
scene.background = new THREE.Color(color)

//texture
const textureLoader = new THREE.TextureLoader()

//floor texture
const floorAlphaTexture = textureLoader.load('/models/floor/alpha.jpg')


//Models 
const gltfLoader = new GLTFLoader()

let mixer = null

gltfLoader.load(
    '/models/box/cupe4.glb',
    (gltf) =>
    {
        mixer = new THREE.AnimationMixer(gltf.scene);
        const action = mixer.clipAction(gltf.animations[0]);

        action.play();
        console.log(action)

        scene.add(gltf.scene)
        
    }
)



/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        alphaMap: floorAlphaTexture,
        transparent: true,
        color: '#ddddddff',
        opacity: 0.7,
        metalness:  0,
        roughness: 0.5,
        side: THREE.DoubleSide
    })
)
floor.position.y = -1
floor.receiveShadow = true
floor.rotation.y =  THREE.MathUtils.degToRad(45)
floor.receiveShadow = true


scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0x86cdff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.8)
directionalLight.castShadow = true

directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

//light pointLight
const pointLight = new THREE.PointLight('#f70000ff', 10, 100 )
pointLight.position.set(0, 0, 0)
pointLight.castShadow = true
scene.add(pointLight)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3, 0.5, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update mixer
    if(mixer !== null)
        {
          mixer.update(deltaTime)
    }
  

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()