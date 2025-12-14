import * as THREE from 'three'
import { WEBGL } from './webgl'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';


if (WEBGL.isWebGLAvailable()) {
    // 여기다 코드
    // 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// 조명 추가
//const ambientLight = new THREE.AmbientLight(0xffffff, 0.35); // 은은한 전체 조명 (중간 밝기)
//scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.0); // 방향성 조명 (중간 밝기)
pointLight.position.set(0, 2, 12);
scene.add(pointLight);

// 카메라
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 2;


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

// 텍스쳐 추가
const textureLoader = new THREE.TextureLoader();
const textureBaseColor = textureLoader.load('./static/img/Stone_Path_008_basecolor.jpg');
const texturenNormalColor = textureLoader.load('./static/img/Stone_Path_008_normal.jpg');
const textureHeightColor = textureLoader.load('./static/img/Stone_Path_008_height.png');
const textureRoughnessColor = textureLoader.load('./static/img/Stone_Path_008_roughness.jpg');

// 도형 추가
const geometry = new THREE.SphereGeometry(0.3, 32, 16); 
//const geometry = new THREE.PlaneGeometry(1, 1); 

const material01 = new THREE.MeshStandardMaterial({
    map: textureBaseColor,
});
const obj01 = new THREE.Mesh(geometry, material01);
obj01.position.x = -1.5;
scene.add(obj01);

// 매쉬
const material02 = new THREE.MeshStandardMaterial({
    map: textureBaseColor,
    normalMap: texturenNormalColor,
});
const obj02 = new THREE.Mesh(geometry, material02);
obj02.position.x = -0.5;
scene.add(obj02);

// 매쉬
const material03 = new THREE.MeshStandardMaterial({
    map: textureBaseColor,
    normalMap: texturenNormalColor,
    displacementMap: textureHeightColor,
    displacementScale: 0.03,
});
const obj03 = new THREE.Mesh(geometry, material03);
obj03.position.x = 0.5;
scene.add(obj03);

// 매쉬
const material04 = new THREE.MeshStandardMaterial({
    map: textureBaseColor,
    normalMap: texturenNormalColor,
    displacementMap: textureHeightColor,
    displacementScale: 0.03,
    roughnessMap: textureRoughnessColor,
    roughness: 0.8,
});
const obj04 = new THREE.Mesh(geometry, material04);
obj04.position.x = 1.5;
scene.add(obj04);



function render(time) {
  time *= 0.0005;  // convert time to seconds
 
  //obj01.rotation.y += 0.01;
  //obj02.rotation.y += 0.01;
  //obj03.rotation.y += 0.01;


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
