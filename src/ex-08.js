import * as THREE from 'three'
import { WEBGL } from './webgl'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';


if (WEBGL.isWebGLAvailable()) {
    // 여기다 코드
    // 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// 카메라
const fov = 120;
const aspect = window.innerWidth / window.innerHeight; // 화면 비율
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 
//     0.1, 1000);

camera.position.x = 0;
camera.position.y = 1;
camera.position.z = 1.8;
camera.lookAt(new THREE.Vector3(0,0,0));

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
const geometry = new THREE.SphereGeometry(0.5, 32, 16); 

const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
});
const cube = new THREE.Mesh(geometry, material);
cube.rotation.y = 0.5;
cube.position.y = 0.2;
scene.add(cube);

// 바닥 추가
const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI; // -90도 회전
plane.position.y = -0.2;
scene.add(plane);

// 조명
const ambientLight = new THREE.AmbientLight(0xffa500, 0.1); // 방향성 조명 (중간 밝기)
//scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 방향성 조명 (중간 밝기)
directionalLight.position.set(1, 1, 1);
const dlHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2,
    0x0000ff
); // 조명 위치 확인용
// scene.add(dlHelper);
// scene.add(directionalLight);    

const hemisphereLight = new THREE.HemisphereLight(0x0000ff, 0xff0000, 1); // 하늘색, 땅색, 강도
//scene.add(hemisphereLight);   

const pointLight = new THREE.PointLight(0xffffff, 1.0); // 방향성 조명 (중간 밝기)
//scene.add(pointLight);
pointLight.position.set(-2, 0.5, 0.5);
const plHelper = new THREE.PointLightHelper(pointLight, 0.1); // 조명 위치 확인용
//scene.add(plHelper);

const pointLight2 = new THREE.PointLight(0xffffff, 1.0); // 방향성 조명 (중간 밝기)
//scene.add(pointLight2);
pointLight2.position.set(2, 0.5, 0.5);
const plHelper2 = new THREE.PointLightHelper(pointLight2, 0.1); // 조명 위치 확인용
//scene.add(plHelper2);

const rectLight = new THREE.RectAreaLight(0xffffff, 2, 1, 1); // 색상, 강도, 너비, 높이
//scene.add(rectLight);
rectLight.position.set(0.5, 0.5, 1);
rectLight.lookAt(0,0,0);

const spotLight = new THREE.SpotLight(0xffffff, 0.5); // 색상, 강도
scene.add(spotLight);



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
