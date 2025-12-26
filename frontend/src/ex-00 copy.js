import * as THREE from 'three'
import { WEBGL } from './webgl'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';


if (WEBGL.isWebGLAvailable()) {
    // 여기다 코드
    // 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// 카메라
const fov = 100;
const aspect = window.innerWidth / window.innerHeight; // 화면 비율
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 
//     0.1, 1000);
camera.position.set(1, 1, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
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


// 폼 UI 생성
const formContainer = document.createElement('div');
formContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-family: Arial, sans-serif;
    min-width: 300px;
`;

const title = document.createElement('h3');
title.textContent = '거주지 크기 설정';
title.style.cssText = 'margin: 0 0 15px 0; text-align: center; color: #333;';

const inputGroup = document.createElement('div');
inputGroup.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

// Width 입력 필드
const widthGroup = document.createElement('div');
widthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
widthGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">너비 (W) (cm):</label>
    <input type="number" id="width" min="50" max="2000" step="10" 
           placeholder="0~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

// Height 입력 필드
const heightGroup = document.createElement('div');
heightGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
heightGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">높이 (H) (cm):</label>
    <input type="number" id="height" min="50" max="2000" step="10" 
           placeholder="0~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

// Depth 입력 필드
const depthGroup = document.createElement('div');
depthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
depthGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">깊이 (D) (cm):</label>
    <input type="number" id="depth" min="50" max="2000" step="10" 
           placeholder="0~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

// 확인 버튼 추가
const submitButton = document.createElement('button');
submitButton.textContent = '확인';
submitButton.style.cssText = `
    width: 100%;
    padding: 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    transition: background 0.3s;
`;
submitButton.addEventListener('mouseenter', () => {
    submitButton.style.background = '#0056b3';
});
submitButton.addEventListener('mouseleave', () => {
    submitButton.style.background = '#007bff';
});

inputGroup.appendChild(widthGroup);
inputGroup.appendChild(heightGroup);
inputGroup.appendChild(depthGroup);
inputGroup.appendChild(submitButton);
formContainer.appendChild(title);
formContainer.appendChild(inputGroup);
document.body.appendChild(formContainer);

// 3D 좌표계 레이아웃 생성
let floor, wall1, wall2; // 바닥과 벽면들
let moduleSpace; // 모듈 설치 공간 표시
let layoutCreated = false; // 레이아웃 생성 여부
let borderLines; // 테두리 라인들
let modules = []; // 모듈들
let moduleContainer; // 모듈 컨테이너
let placedModules = []; // 박스 안에 배치된 모듈들
let clickedModules = new Set(); // 클릭된 모듈들 (중복 방지)
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;
let draggedModule = null;
let infoModal; // 모듈 정보 모달
let boxDimensions = { width: 0, height: 0, depth: 0 }; // 박스 크기 저장

// 모듈 데이터 정의
const moduleData = [
    { name: "사이클 운동기구", width: 0.65, height: 1.91, depth: 0.69 },
    { name: "트레드밀", width: 0.65, height: 1.91, depth: 0.69 },
    { name: "저항 운동기구", width: 0.65, height: 1.91, depth: 0.69 },
    { name: "개방형 사교 공간 / 훈련실", width: 2.59, height: 2.59, depth: 2.59 },
    { name: "다목적 테이블", width: 1.91, height: 1.41, depth: 1.91 },
    { name: "화장실 (폐기물 수거)", width: 0.65, height: 1.49, depth: 0.69 },
    { name: "위생 공간 (세척)", width: 1.21, height: 2.51, depth: 1.43 },
    { name: "임시 저장 공간", width: 0.98, height: 2.31, depth: 2.02 },
    { name: "컴퓨터 워크스테이션", width: 0.65, height: 1.91, depth: 0.65 },
    { name: "유지보수 작업대", width: 2.02, height: 1.91, depth: 0.98 },
    { name: "주방 (음식 준비)", width: 1.15, height: 1.91, depth: 1.15 },
    { name: "주방 보조 작업대", width: 1.41, height: 1.66, depth: 1.41 },
    { name: "의료용 컴퓨터", width: 0.65, height: 1.49, depth: 0.65 },
    { name: "의료 처치 공간", width: 2.0, height: 2.0, depth: 1.45 },
    { name: "관제 및 모니터링", width: 0.65, height: 1.91, depth: 0.65 },
    { name: "개인 업무 공간 / 외래 진료", width: 2.92, height: 1.91, depth: 2.92 },
    { name: "개인 거주 (수면 및 휴식)", width: 2.24, height: 2.78, depth: 2.24 },
    { name: "폐기물 관리", width: 0.65, height: 3.16, depth: 1.83 }
];

// 그리드 라인 생성 함수
function createGridLines(width, height, depth, divisions = 10) {
    const gridGroup = new THREE.Group();
    
    // 바닥면 그리드 (X-Z 평면)
    const floorGridGeometry = new THREE.BufferGeometry();
    const floorGridPoints = [];
    
    // X축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const x = (i / divisions - 0.5) * width;
        floorGridPoints.push(new THREE.Vector3(x, 0, -depth/2));
        floorGridPoints.push(new THREE.Vector3(x, 0, depth/2));
    }
    
    // Z축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const z = (i / divisions - 0.5) * depth;
        floorGridPoints.push(new THREE.Vector3(-width/2, 0, z));
        floorGridPoints.push(new THREE.Vector3(width/2, 0, z));
    }
    
    floorGridGeometry.setFromPoints(floorGridPoints);
    const floorGridMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
    const floorGrid = new THREE.LineSegments(floorGridGeometry, floorGridMaterial);
    gridGroup.add(floorGrid);
    
    // 앞면 그리드 (X-Y 평면)
    const frontGridGeometry = new THREE.BufferGeometry();
    const frontGridPoints = [];
    
    // X축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const x = (i / divisions - 0.5) * width;
        frontGridPoints.push(new THREE.Vector3(x, 0, depth/2));
        frontGridPoints.push(new THREE.Vector3(x, height, depth/2));
    }
    
    // Y축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const y = (i / divisions) * height;
        frontGridPoints.push(new THREE.Vector3(-width/2, y, depth/2));
        frontGridPoints.push(new THREE.Vector3(width/2, y, depth/2));
    }
    
    frontGridGeometry.setFromPoints(frontGridPoints);
    const frontGrid = new THREE.LineSegments(frontGridGeometry, floorGridMaterial);
    gridGroup.add(frontGrid);
    
    // 옆면 그리드 (Y-Z 평면)
    const sideGridGeometry = new THREE.BufferGeometry();
    const sideGridPoints = [];
    
    // Z축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const z = (i / divisions - 0.5) * depth;
        sideGridPoints.push(new THREE.Vector3(width/2, 0, z));
        sideGridPoints.push(new THREE.Vector3(width/2, height, z));
    }
    
    // Y축 방향 그리드 라인
    for (let i = 0; i <= divisions; i++) {
        const y = (i / divisions) * height;
        sideGridPoints.push(new THREE.Vector3(width/2, y, -depth/2));
        sideGridPoints.push(new THREE.Vector3(width/2, y, depth/2));
    }
    
    sideGridGeometry.setFromPoints(sideGridPoints);
    const sideGrid = new THREE.LineSegments(sideGridGeometry, floorGridMaterial);
    gridGroup.add(sideGrid);
    
    return gridGroup;
}

// 3D 좌표계 축 생성 함수
function createAxes(width, height, depth) {
    const axesGroup = new THREE.Group();
    
    // X축 (빨간색) - 정면을 향하도록 Z축 방향으로 회전
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, depth * 0.8)
    ]);
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    axesGroup.add(xAxis);
    
    // Y축 (초록색)
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, height * 0.8, 0)
    ]);
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    axesGroup.add(yAxis);
    
    // Z축 (파란색) - 정면을 향하도록 X축 방향으로 회전
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(width * 0.8, 0, 0)
    ]);
    const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
    const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
    axesGroup.add(zAxis);
    
    return axesGroup;
}

// 3D 좌표계 테두리 생성 함수
function createBorderLines(width, height, depth) {
    const borderGroup = new THREE.Group();
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    
    // 바닥면 테두리 (X-Z 평면)
    const floorBorderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width/2, 0, -depth/2),
        new THREE.Vector3(width/2, 0, -depth/2),
        new THREE.Vector3(width/2, 0, depth/2),
        new THREE.Vector3(-width/2, 0, depth/2),
        new THREE.Vector3(-width/2, 0, -depth/2)
    ]);
    const floorBorder = new THREE.Line(floorBorderGeometry, borderMaterial);
    borderGroup.add(floorBorder);
    
    // 앞면 테두리 (X-Y 평면) - 뒤쪽에 위치
    const frontBorderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width/2, 0, -depth/2),
        new THREE.Vector3(width/2, 0, -depth/2),
        new THREE.Vector3(width/2, height, -depth/2),
        new THREE.Vector3(-width/2, height, -depth/2),
        new THREE.Vector3(-width/2, 0, -depth/2)
    ]);
    const frontBorder = new THREE.Line(frontBorderGeometry, borderMaterial);
    borderGroup.add(frontBorder);
    
    // 왼쪽 옆면 테두리 (Y-Z 평면)
    const leftSideBorderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width/2, 0, -depth/2),
        new THREE.Vector3(-width/2, 0, depth/2),
        new THREE.Vector3(-width/2, height, depth/2),
        new THREE.Vector3(-width/2, height, -depth/2),
        new THREE.Vector3(-width/2, 0, -depth/2)
    ]);
    const leftSideBorder = new THREE.Line(leftSideBorderGeometry, borderMaterial);
    borderGroup.add(leftSideBorder);
    
    return borderGroup;
}

// cm를 m로 변환하는 함수
function cmToMeters(cm) {
    return cm / 100;
}

// 카메라 위치 자동 조정 함수
function adjustCameraPosition(width, height, depth) {
    // 박스의 대각선 길이 계산 (3D 공간에서 원점에서 가장 먼 점까지의 거리)
    const maxDimension = Math.max(width, height, depth);
    const diagonal = Math.sqrt(width * width + height * height + depth * depth);
    
    // 카메라 거리 계산 (박스가 잘리지 않도록 여유를 두고)
    const cameraDistance = diagonal * 0.5;
    
    // 카메라 위치 설정 (대각선 방향으로)
    camera.position.set(cameraDistance, cameraDistance, cameraDistance);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // 카메라 업데이트
    camera.updateProjectionMatrix();
}

// 18개 모듈 생성 함수 (작은 크기로 표시)
function createModules() {
    // 기존 모듈들 제거
    if (moduleContainer) {
        scene.remove(moduleContainer);
    }
    
    moduleContainer = new THREE.Group();
    modules = [];
    
    // 모듈 크기 (작은 표시용 5cm = 0.05m)
    const moduleSize = 0.05;
    const spacing = 0.08; // 모듈 간격
    
    // 18개 모듈 생성 (3x6 배치)
    for (let i = 0; i < 18; i++) {
        const geometry = new THREE.BoxGeometry(moduleSize, moduleSize, moduleSize);
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(i / 18, 0.7, 0.6), // 각각 다른 색상
            transparent: true,
            opacity: 0.8
        });
        const module = new THREE.Mesh(geometry, material);
        
        // 3x6 배치로 위치 설정
        const row = Math.floor(i / 6);
        const col = i % 6;
        
        module.position.set(
            (col - 2.5) * spacing, // X 위치
            moduleSize / 2, // Y 위치 (바닥 위)
            (row - 1) * spacing // Z 위치
        );
        
        // 모듈 데이터 저장
        module.userData = {
            index: i,
            name: moduleData[i].name,
            originalSize: {
                width: moduleData[i].width,
                height: moduleData[i].height,
                depth: moduleData[i].depth
            }
        };
        
        moduleContainer.add(module);
        modules.push(module);
    }
    
    // 모듈 컨테이너를 3D 씬에 추가
    scene.add(moduleContainer);
}

// 모듈이 박스에 맞는지 확인하는 함수
function canModuleFitInBox(moduleInfo) {
    return moduleInfo.width <= boxDimensions.width && 
           moduleInfo.height <= boxDimensions.height && 
           moduleInfo.depth <= boxDimensions.depth;
}

// 두 모듈이 충돌하는지 확인하는 함수
function checkModuleCollision(module1, module2) {
    const pos1 = module1.position;
    const pos2 = module2.position;
    
    const size1 = {
        width: module1.geometry.parameters.width,
        height: module1.geometry.parameters.height,
        depth: module1.geometry.parameters.depth
    };
    
    const size2 = {
        width: module2.geometry.parameters.width,
        height: module2.geometry.parameters.height,
        depth: module2.geometry.parameters.depth
    };
    
    // X축 충돌 체크
    const xOverlap = Math.abs(pos1.x - pos2.x) < (size1.width + size2.width) / 2;
    
    // Y축 충돌 체크
    const yOverlap = Math.abs(pos1.y - pos2.y) < (size1.height + size2.height) / 2;
    
    // Z축 충돌 체크
    const zOverlap = Math.abs(pos1.z - pos2.z) < (size1.depth + size2.depth) / 2;
    
    return xOverlap && yOverlap && zOverlap;
}

// 특정 위치에 모듈을 배치할 수 있는지 확인하는 함수
function canPlaceModuleAt(position, moduleSize, excludeModule = null) {
    // 박스 경계 체크
    const maxX = (boxDimensions.width / 2) - (moduleSize.width / 2);
    const minX = -(boxDimensions.width / 2) + (moduleSize.width / 2);
    const maxZ = (boxDimensions.depth / 2) - (moduleSize.depth / 2);
    const minZ = -(boxDimensions.depth / 2) + (moduleSize.depth / 2);
    const maxY = boxDimensions.height - (moduleSize.height / 2);
    const minY = moduleSize.height / 2;
    
    if (position.x < minX || position.x > maxX ||
        position.z < minZ || position.z > maxZ ||
        position.y < minY || position.y > maxY) {
        return false;
    }
    
    // 다른 모듈과의 충돌 체크
    for (let i = 0; i < placedModules.length; i++) {
        const existingModule = placedModules[i];
        
        // 제외할 모듈이면 스킵
        if (excludeModule && existingModule === excludeModule) {
            continue;
        }
        
        // 임시로 위치를 설정하여 충돌 체크
        const originalPos = { ...existingModule.position };
        const tempModule = {
            position: position,
            geometry: { parameters: moduleSize }
        };
        
        if (checkModuleCollision(tempModule, existingModule)) {
            return false;
        }
    }
    
    return true;
}

// 모듈이 박스에 설치 가능한지 확인하는 함수 (공간 포함)
function canModuleBeInstalled(moduleIndex) {
    const moduleInfo = moduleData[moduleIndex];
    
    // 이미 설치된 모듈이면 false
    if (clickedModules.has(moduleIndex)) {
        return false;
    }
    
    // 박스 크기 체크
    if (!canModuleFitInBox(moduleInfo)) {
        return false;
    }
    
    // 충돌하지 않는 위치가 있는지 확인
    const moduleSize = {
        width: moduleInfo.width,
        height: moduleInfo.height,
        depth: moduleInfo.depth
    };
    
    const maxAttempts = 20; // 충돌 체크 시도 횟수
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 랜덤 위치 생성 (박스 내에서)
        const x = (Math.random() - 0.5) * (boxDimensions.width - moduleInfo.width);
        const z = (Math.random() - 0.5) * (boxDimensions.depth - moduleInfo.depth);
        const y = moduleInfo.height / 2;
        
        const position = { x, y, z };
        
        if (canPlaceModuleAt(position, moduleSize)) {
            return true;
        }
    }
    
    return false;
}

// 모듈 버튼 상태 업데이트 함수
function updateModuleButtonStates() {
    const moduleButtons = document.querySelectorAll('[data-module-index]');
    
    moduleButtons.forEach(button => {
        const moduleIndex = parseInt(button.getAttribute('data-module-index'));
        const moduleInfo = moduleData[moduleIndex];
        
        // 이미 설치된 모듈
        if (clickedModules.has(moduleIndex)) {
            button.style.background = 'linear-gradient(45deg, #28a745, #20c997)'; // 녹색
            button.style.color = 'white';
            button.style.opacity = '0.8';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
        }
        // 박스 크기에 맞지 않는 모듈
        else if (!canModuleFitInBox(moduleInfo)) {
            button.style.background = '#cccccc';
            button.style.color = '#666666';
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
        }
        // 공간 부족으로 설치할 수 없는 모듈
        else if (!canModuleBeInstalled(moduleIndex)) {
            button.style.background = '#cccccc'; // 회색
            button.style.color = '#666666';
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
        }
        // 설치 가능한 모듈
        else {
            button.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
            button.style.color = 'white';
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        }
    });
}

// 모듈을 박스 안에 실제 크기로 배치하는 함수
function placeModuleInBox(moduleIndex) {
    const moduleInfo = moduleData[moduleIndex];
    
    // 박스 크기 체크
    if (!canModuleFitInBox(moduleInfo)) {
        console.log(`${moduleInfo.name}은 거주지보다 큽니다. 설치할 수 없습니다.`);
        return false;
    }
    
    // 실제 크기로 모듈 생성
    const geometry = new THREE.BoxGeometry(moduleInfo.width, moduleInfo.height, moduleInfo.depth);
const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(moduleIndex / 18, 0.7, 0.6),
        transparent: true,
        opacity: 0.7
    });
    const placedModule = new THREE.Mesh(geometry, material);
    
    // 모듈 정보 저장
    placedModule.userData = {
        index: moduleIndex,
        name: moduleInfo.name,
        isPlaced: true,
        isDraggable: true
    };
    
    // 충돌하지 않는 위치 찾기
    const moduleSize = {
        width: moduleInfo.width,
        height: moduleInfo.height,
        depth: moduleInfo.depth
    };
    
    let placed = false;
    const maxAttempts = 50; // 최대 시도 횟수
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 랜덤 위치 생성 (박스 내에서)
        const x = (Math.random() - 0.5) * (boxDimensions.width - moduleInfo.width);
        const z = (Math.random() - 0.5) * (boxDimensions.depth - moduleInfo.depth);
        const y = moduleInfo.height / 2;
        
        const position = { x, y, z };
        
        if (canPlaceModuleAt(position, moduleSize)) {
            placedModule.position.set(x, y, z);
            placed = true;
            break;
        }
    }
    
    if (!placed) {
        console.log(`${moduleInfo.name}을 배치할 충돌하지 않는 공간을 찾을 수 없습니다.`);
        return false;
    }
    
    scene.add(placedModule);
    placedModules.push(placedModule);
    
    // 버튼 상태 업데이트
    updateModuleButtonStates();
    
    console.log(`${moduleInfo.name}이 거주지 안에 배치되었습니다. 크기: ${moduleInfo.width}m x ${moduleInfo.height}m x ${moduleInfo.depth}m`);
    return true;
}

// 마우스 이벤트 처리 함수들
function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(placedModules);
    
    if (intersects.length > 0) {
        draggedModule = intersects[0].object;
        isDragging = true;
        draggedModule.material.opacity = 0.5; // 드래그 중 반투명
        
        // 드래그 중에는 OrbitControls 비활성화
        controls.enabled = false;
    }
}

function onMouseMove(event) {
    if (!isDragging || !draggedModule) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // 바닥면과의 교차점 계산
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
        // 모듈 크기 가져오기
        const moduleWidth = draggedModule.geometry.parameters.width;
        const moduleDepth = draggedModule.geometry.parameters.depth;
        const moduleHeight = draggedModule.geometry.parameters.height;
        
        // 박스 경계 내로 제한
        const maxX = (boxDimensions.width / 2) - (moduleWidth / 2);
        const minX = -(boxDimensions.width / 2) + (moduleWidth / 2);
        const maxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
        const minZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
        
        // 위치 제한 적용
        const clampedX = Math.max(minX, Math.min(maxX, intersection.x));
        const clampedZ = Math.max(minZ, Math.min(maxZ, intersection.z));
        const clampedY = moduleHeight / 2;
        
        // 충돌 체크를 위한 임시 위치
        const tempPosition = { x: clampedX, y: clampedY, z: clampedZ };
        const moduleSize = {
            width: moduleWidth,
            height: moduleHeight,
            depth: moduleDepth
        };
        
        // 충돌 체크 (현재 드래그 중인 모듈은 제외)
        const canPlace = canPlaceModuleAt(tempPosition, moduleSize, draggedModule);
        
        // 모듈을 바닥 위에 배치
        draggedModule.position.x = clampedX;
        draggedModule.position.z = clampedZ;
        draggedModule.position.y = clampedY;
        
        // 충돌 시 시각적 피드백
        if (canPlace) {
            draggedModule.material.opacity = 0.5; // 드래그 중 정상
            draggedModule.material.color.setHex(0x00ff00); // 초록색으로 표시
        } else {
            draggedModule.material.opacity = 0.3; // 충돌 시 더 투명
            draggedModule.material.color.setHex(0xff0000); // 빨간색으로 표시
        }
    }
}

function onMouseUp(event) {
    if (isDragging && draggedModule) {
        // 최종 위치에서 충돌 체크
        const finalPosition = {
            x: draggedModule.position.x,
            y: draggedModule.position.y,
            z: draggedModule.position.z
        };
        
        const moduleSize = {
            width: draggedModule.geometry.parameters.width,
            height: draggedModule.geometry.parameters.height,
            depth: draggedModule.geometry.parameters.depth
        };
        
        const canPlace = canPlaceModuleAt(finalPosition, moduleSize, draggedModule);
        
        if (canPlace) {
            // 충돌하지 않으면 원래 색상으로 복원
            const originalColor = new THREE.Color().setHSL(draggedModule.userData.index / 18, 0.7, 0.6);
            draggedModule.material.color.copy(originalColor);
            draggedModule.material.opacity = 0.7;
        } else {
            // 충돌하면 이전 위치로 되돌리기 (임시로 중앙으로)
            draggedModule.position.set(0, moduleSize.height / 2, 0);
            const originalColor = new THREE.Color().setHSL(draggedModule.userData.index / 18, 0.7, 0.6);
            draggedModule.material.color.copy(originalColor);
            draggedModule.material.opacity = 0.7;
            console.log('충돌로 인해 모듈이 이전 위치로 되돌아갔습니다.');
        }
        
        isDragging = false;
        draggedModule = null;
        
        // 드래그 종료 시 OrbitControls 다시 활성화
        controls.enabled = true;
    }
}

function onRightClick(event) {
    event.preventDefault();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(placedModules);
    
    if (intersects.length > 0) {
        const moduleToRemove = intersects[0].object;
        const moduleIndex = moduleToRemove.userData.index;
        
        // 3D 씬에서 제거
        scene.remove(moduleToRemove);
        placedModules.splice(placedModules.indexOf(moduleToRemove), 1);
        
        // 클릭된 모듈 목록에서 제거
        clickedModules.delete(moduleIndex);
        
        // 버튼 상태 업데이트
        updateModuleButtonStates();
        
        console.log(`${moduleToRemove.userData.name}이 제거되었습니다.`);
    }
}

// 모듈 정보 모달 생성 함수
function createInfoModal() {
    // 기존 모달 제거
    if (infoModal) {
        document.body.removeChild(infoModal);
    }
    
    infoModal = document.createElement('div');
    infoModal.style.cssText = `
        position: fixed;
        left: 20px;
        top: 40%;
        transform: translateY(-50%);
        width: 300px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        font-family: Arial, sans-serif;
        display: none;
        padding: 20px;
    `;
    
    // 모달 내용
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
        <h3 id="modal-title" style="margin: 0 0 15px 0; color: #333; text-align: center;">모듈 정보</h3>
        <div id="modal-info" style="color: #666; line-height: 1.6;">
            <p><strong>이름:</strong> <span id="module-name">-</span></p>
            <p><strong>크기:</strong> <span id="module-size">-</span></p>
            <p><strong>설명:</strong> <span id="module-description">-</span></p>
        </div>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 12px; color: #666;">
            <strong>💡 사용법:</strong><br>
            • 모듈을 드래그하여 이동<br>
            • <strong>우클릭</strong>으로 실행 취소
        </div>
        <button id="close-modal" style="
            width: 100%;
            padding: 10px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
            font-weight: bold;
        ">닫기</button>
    `;
    
    infoModal.appendChild(modalContent);
    document.body.appendChild(infoModal);
    
    // 닫기 버튼 이벤트
    document.getElementById('close-modal').addEventListener('click', () => {
        infoModal.style.display = 'none';
    });
}

// 모듈 정보 표시 함수
function showModuleInfo(moduleIndex) {
    const module = moduleData[moduleIndex];
    
    document.getElementById('module-name').textContent = module.name;
    document.getElementById('module-size').textContent = `${module.width}m × ${module.height}m × ${module.depth}m`;
    document.getElementById('module-description').textContent = '모듈에 대한 상세 설명이 여기에 표시됩니다.';
    
    infoModal.style.display = 'block';
}

// 모듈 영역 UI 생성 함수
function createModuleArea() {
    // 모듈 영역 컨테이너
    const moduleArea = document.createElement('div');
    moduleArea.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-family: Arial, sans-serif;
        min-width: 80%;
        max-width: 90%;
    `;
    
    // 제목
    const moduleTitle = document.createElement('h4');
    moduleTitle.textContent = '모듈 선택 (18개)';
    moduleTitle.style.cssText = 'margin: 0 0 10px 0; text-align: center; color: #333;';
    
    // 상태 설명 영역
    const statusLegend = document.createElement('div');
    statusLegend.style.cssText = `
        background: #f8f9fa;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
        font-size: 11px;
        color: #666;
    `;
    statusLegend.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px; color: #333;">📋 모듈 상태</div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 2px;"></div>
                <span>설치 가능</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(45deg, #28a745, #20c997); border-radius: 2px;"></div>
                <span>설치됨</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: #cccccc; border-radius: 2px;"></div>
                <span>설치 불가</span>
            </div>
        </div>
    `;
    
    // 스크롤 가능한 모듈 그리드
    const moduleGrid = document.createElement('div');
    moduleGrid.style.cssText = `
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 10px 0;
        max-width: 100%;
        scrollbar-width: thin;
    `;
    
    // 18개 모듈 버튼 생성
    for (let i = 0; i < 18; i++) {
        const moduleButton = document.createElement('div');
        const moduleInfo = moduleData[i];
        
        moduleButton.style.cssText = `
            min-width: 100px;
            height: 60px;
            border: none;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            transition: transform 0.2s, box-shadow 0.2s;
            flex-shrink: 0;
            text-align: center;
            padding: 10px;
        `;
        
        // 모듈 이름만 표시
        moduleButton.textContent = moduleInfo.name;
        
        // 호버 효과
        moduleButton.addEventListener('mouseenter', () => {
            moduleButton.style.transform = 'scale(1.05)';
            moduleButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        moduleButton.addEventListener('mouseleave', () => {
            moduleButton.style.transform = 'scale(1)';
            moduleButton.style.boxShadow = 'none';
        });
        
        // 모듈 인덱스 데이터 속성 추가
        moduleButton.setAttribute('data-module-index', i);
        
        // 클릭 이벤트 (모듈을 박스 안에 배치)
        moduleButton.addEventListener('click', () => {
            // 이미 설치된 모듈이면 클릭 불가
            if (clickedModules.has(i)) {
                console.log('이미 설치된 모듈입니다.');
                return;
            }
            
            // 박스 크기에 맞지 않는 모듈은 클릭 불가
            if (!canModuleFitInBox(moduleInfo)) {
                console.log('이 모듈은 거주지보다 큽니다.');
                return;
            }
            
            // 공간 부족으로 설치할 수 없는 모듈은 클릭 불가
            if (!canModuleBeInstalled(i)) {
                console.log('이 모듈을 설치할 공간이 부족합니다.');
                return;
            }
            
            // 클릭된 모듈 목록에 추가
            clickedModules.add(i);
            
            // 모듈 정보 모달 표시
            showModuleInfo(i);
            
            // 모듈을 박스 안에 실제 크기로 배치
            const success = placeModuleInBox(i);
            if (!success) {
                // 설치 실패 시 버튼 상태 복원
                clickedModules.delete(i);
                updateModuleButtonStates();
            }
        });
        
        moduleGrid.appendChild(moduleButton);
    }
    
    moduleArea.appendChild(moduleTitle);
    moduleArea.appendChild(statusLegend);
    moduleArea.appendChild(moduleGrid);
    document.body.appendChild(moduleArea);
    
    // 버튼 상태 초기화
    updateModuleButtonStates();
}

// 모듈 하이라이트 함수
function highlightModule(index) {
    // 모든 모듈의 하이라이트 제거
    modules.forEach(module => {
        module.material.emissive.setHex(0x000000);
    });
    
    // 선택된 모듈 하이라이트
    if (modules[index]) {
        modules[index].material.emissive.setHex(0x444444);
    }
}

// 3D 레이아웃 생성 함수
function createLayout() {
    if (layoutCreated) return; // 이미 생성된 경우 중복 생성 방지
    
    // cm 입력값을 가져오고, 빈 값이면 기본값(200cm) 사용
    const widthCm = parseFloat(document.getElementById('width').value) || 200;
    const heightCm = parseFloat(document.getElementById('height').value) || 200;
    const depthCm = parseFloat(document.getElementById('depth').value) || 200;
    
    const width = cmToMeters(widthCm);
    const height = cmToMeters(heightCm);
    const depth = cmToMeters(depthCm);
    
    // 박스 크기 저장
    boxDimensions = { width, height, depth };
    
    // 3D 좌표계 테두리 생성
    borderLines = createBorderLines(width, height, depth);
    scene.add(borderLines);
    
    // 3D 좌표계 축 생성
    const axes = createAxes(width, height, depth);
    scene.add(axes);
    
    // 모듈 영역 UI 생성 (3D 모듈은 생성하지 않음)
    createModuleArea();
    
    // 모듈 정보 모달 생성
    createInfoModal();
    
    // 카메라 위치 자동 조정
    adjustCameraPosition(width, height, depth);
    
    // 마우스 이벤트 리스너 추가
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', onRightClick);
    
    layoutCreated = true;
}

// 레이아웃 크기 업데이트 함수
function updateLayoutSize() {
    if (!layoutCreated) return; // 레이아웃가 생성되지 않은 경우 무시
    
    // cm 입력값을 가져오고, 빈 값이면 기본값(200cm) 사용
    const widthCm = parseFloat(document.getElementById('width').value) || 200;
    const heightCm = parseFloat(document.getElementById('height').value) || 200;
    const depthCm = parseFloat(document.getElementById('depth').value) || 200;
    
    const width = cmToMeters(widthCm);
    const height = cmToMeters(heightCm);
    const depth = cmToMeters(depthCm);
    
    // 기존 테두리 제거
    scene.remove(borderLines);
    
    // 새로운 테두리 생성
    borderLines = createBorderLines(width, height, depth);
    scene.add(borderLines);
    
    // 카메라 위치 자동 조정
    adjustCameraPosition(width, height, depth);
}

// 확인 버튼 클릭 이벤트
submitButton.addEventListener('click', () => {
    createLayout();
    // 폼 숨기기
    formContainer.style.display = 'none';
});

// 입력 필드에 이벤트 리스너 추가 (레이아웃이 생성된 후에만 작동)
document.getElementById('width').addEventListener('input', updateLayoutSize);
document.getElementById('height').addEventListener('input', updateLayoutSize);
document.getElementById('depth').addEventListener('input', updateLayoutSize);

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
const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // 환경광
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

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
