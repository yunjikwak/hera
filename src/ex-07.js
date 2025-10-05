import * as THREE from 'three'
import { WEBGL } from './webgl'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';


if (WEBGL.isWebGLAvailable()) {
    // 여기다 코드
    // 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// 카메라
const fov = 100;
const aspect = window.innerWidth / window.innerHeight; // 화면 비율
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 
//     0.1, 1000);
camera.position.set(0, 0, 1);
// camera.position.x = 0;
// camera.position.y = 2;
// camera.position.z = 1;
//camera.lookAt(new THREE.Vector3(0,0,0));

// 렌더러
const renderer = new THREE.WebGLRenderer({
    alpha: true, // 배경 투명도
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 카메라 이후에 등장 필요
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.update();


// 도형 추가
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); 

const material = new THREE.MeshStandardMaterial({
    color: 0xFF7F00,
});
const cube = new THREE.Mesh(geometry, material);
cube.rotation.y = 0.5;
scene.add(cube);

// 바닥 추가
// const planeGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
// const planeMaterial = new THREE.MeshStandardMaterial({
//     color: 0xeeeeee,
// });
// const plane = new THREE.Mesh(planeGeometry, planeMaterial);
// plane.rotation.x = -0.5 * Math.PI; // -90도 회전
// plane.position.y = -0.5;
// scene.add(plane);

// 조명
const pointLight = new THREE.PointLight(0xffffbb, 1.0); // 방향성 조명 (중간 밝기)
pointLight.position.set(0, 2, 12);
scene.add(pointLight);

function render(time) {
  time *= 0.0005;  // convert time to seconds

  renderer.render(scene, camera);
 
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// 반응형 처리
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; // 화면 비율 재설정
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기 재설
}
window.addEventListener('resize', onWindowResize); // 창 크기 변경시 이벤트 발생

  
} else {
    var warning = WEBGL.getWebGLErrorMessage()
    document.body.appendChild(warning)
}
