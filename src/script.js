// ...existing code...
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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


// Lights
const scene = new THREE.Scene();
const color = 'rgb(201, 201, 201)';
scene.background = new THREE.Color(color);

// نور نقطه‌ای و PointLightHelper (بعد از تعریف scene)
const pointLight = new THREE.PointLight('#ff6a00', 10, 5, 10); // شدت و شعاع نور بیشتر شد
pointLight.position.set(5, 0, 9);
scene.add(pointLight);
const pointLightHelper = new THREE.PointLightHelper(pointLight, 20); // نمایش بزرگ‌تر برای کمک بصری
pointLightHelper.visible = false;
scene.add(pointLightHelper);

//Models 
const gltfLoader = new GLTFLoader()

let mixer = null

gltfLoader.load(
    '/models/box/cupe4.glb',
    (gltf) => {
        mixer = new THREE.AnimationMixer(gltf.scene);
        let action = null;
        if (gltf.animations && gltf.animations.length > 0) {
            action = mixer.clipAction(gltf.animations[0]);
            action.play();
            console.log(action)
        } else {
            console.warn('No animations found in GLB.');
        }

        // تغییر رنگ همه متریال‌های مدل به قرمز
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color = new THREE.Color('#d3d3d3'); // لایت گری
                child.material.opacity = 0.2; // اوپسیتی کم
                child.material.transparent = true;
                child.material.needsUpdate = true;
            }
        });
        scene.add(gltf.scene)

        // پیدا کردن آبجکت اصلی متحرک (در صورت وجود)
        let animatedObject = null;
        if (gltf.scene.children && gltf.scene.children.length > 0) {
            animatedObject = gltf.scene.children[0];
            animatedObject.visible = false;
        }
        // ذخیره آبجکت برای استفاده در حلقه انیمیشن
        window.animatedObject = animatedObject;
    }
)





/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
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

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update mixer
    if (mixer !== null) {
        mixer.update(deltaTime)

        // همگام‌سازی موقعیت pointLight با آبجکت متحرک
        if (window.animatedObject) {
            pointLight.position.copy(window.animatedObject.position);
            pointLightHelper.update();
        }
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()