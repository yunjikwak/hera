import * as THREE from 'three'
import { WEBGL } from './webgl'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// CSS 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// 전역 변수
let difficultyLevel = 'beginner'; // 난이도 레벨 (beginner, advanced)
let environment = 'default'; // 환경 설정 (default, mars, lunar)
let submitButton; // 확인 버튼
let formContainer; // 폼 컨테이너

// 18개 모듈용 명확하게 구분되는 색상 배열
const getModuleColors = () => [
    0xff6b6b, // 빨강
    0x4ecdc4, // 청록
    0x45b7d1, // 파랑
    0x96ceb4, // 연두
    0xfeca57, // 노랑
    0xff9ff3, // 분홍
    0x54a0ff, // 밝은 파랑
    0x5f27cd, // 보라
    0x00d2d3, // 시안
    0xff9f43, // 주황
    0x10ac84, // 진한 초록
    0xee5a24, // 주황빨강
    0x0984e3, // 네이비
    0x6c5ce7, // 라벤더
    0x00b894, // 에메랄드
    0xe17055, // 코랄
    0x74b9ff, // 하늘색
    0xa29bfe  // 연보라
];

// 3D 관련 전역 변수
let scene, camera, renderer, controls;

// 모듈 회전 관련 변수
let selectedModule = null; // 현재 선택된 모듈
let moduleRotations = new Map(); // 각 모듈의 회전 상태 저장
let glowingModule = null; // 현재 빛나는 모듈
let glowOutline = null; // 빛나는 테두리 객체

// 난이도 선택 모달 생성 함수
function createDifficultyModal() {
    const modal = document.createElement('div');
    modal.id = 'difficulty-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
        ">
            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 28px;">🎯 Select Difficulty Level</h2>
            <p style="margin: 0 0 30px 0; color: #666; font-size: 16px;">Choose your preferred difficulty level for the residence design</p>
            
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <button id="beginner-btn" style="
                    flex: 1;
                    padding: 20px;
                    background: linear-gradient(45deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                ">🌱 Beginner</button>
                
                <button id="advanced-btn" style="
                    flex: 1;
                    padding: 20px;
                    background: linear-gradient(45deg, #FF6B6B, #ee5a52);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                ">🔥 Advanced</button>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <div style="flex: 1; text-align: left; padding: 15px; background: #f0f8f0; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2e7d32;">Beginner Mode</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                        <li>Module tags displayed</li>
                        <li>Minimum size requirements shown</li>
                        <li>Detailed module information</li>
                        <li>Helpful hints and guidance</li>
                    </ul>
                </div>
                
                <div style="flex: 1; text-align: left; padding: 15px; background: #fff0f0; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #c62828;">Advanced Mode</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                        <li>No module tags</li>
                        <li>No minimum size hints</li>
                        <li>Minimal information display</li>
                        <li>Challenge yourself!</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 버튼 이벤트 리스너
    document.getElementById('beginner-btn').addEventListener('click', () => {
        difficultyLevel = 'beginner';
        modal.remove();
        createForm();
    });

    document.getElementById('advanced-btn').addEventListener('click', () => {
        difficultyLevel = 'advanced';
        modal.remove();
        createEnvironmentModal();
    });

    // 호버 효과
    document.getElementById('beginner-btn').addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    document.getElementById('beginner-btn').addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });

    document.getElementById('advanced-btn').addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    document.getElementById('advanced-btn').addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

// 환경 선택 모달 생성 함수
function createEnvironmentModal() {
    const modal = document.createElement('div');
    modal.id = 'environment-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
        ">
            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 28px;">🌍 Select Environment</h2>
            <p style="margin: 0 0 30px 0; color: #666; font-size: 16px;">Choose the environment for your residence design</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px;">
                <button id="default-env-btn" style="
                    padding: 20px;
                    background: linear-gradient(45deg, #6c757d, #5a6268);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                    text-align: left;
                ">
                    <div style="font-size: 20px; margin-bottom: 5px;">🏠 Default</div>
                    <div style="font-size: 14px; opacity: 0.9;">Standard evaluation criteria</div>
                </button>
                
                <button id="mars-env-btn" style="
                    padding: 20px;
                    background: linear-gradient(45deg, #dc3545, #c82333);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                    text-align: left;
                ">
                    <div style="font-size: 20px; margin-bottom: 5px;">🔴 MARS</div>
                    <div style="font-size: 14px; opacity: 0.9;">Priority: Space Utilization > Comfortability > Efficiency</div>
                </button>
                
                <button id="lunar-env-btn" style="
                    padding: 20px;
                    background: linear-gradient(45deg, #17a2b8, #138496);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                    text-align: left;
                ">
                    <div style="font-size: 20px; margin-bottom: 5px;">🌙 LUNAR</div>
                    <div style="font-size: 14px; opacity: 0.9;">Priority: Efficiency > Space Utilization > Comfortability</div>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너 추가
    document.getElementById('default-env-btn').addEventListener('click', () => {
        environment = 'default';
        modal.remove();
        createForm();
    });

    document.getElementById('mars-env-btn').addEventListener('click', () => {
        environment = 'mars';
        modal.remove();
        createForm();
    });

    document.getElementById('lunar-env-btn').addEventListener('click', () => {
        environment = 'lunar';
        modal.remove();
        createForm();
    });

    // 호버 효과
    document.getElementById('default-env-btn').addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
    });
    document.getElementById('default-env-btn').addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });

    document.getElementById('mars-env-btn').addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
    });
    document.getElementById('mars-env-btn').addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });

    document.getElementById('lunar-env-btn').addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
    });
    document.getElementById('lunar-env-btn').addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

/*
// 폼 생성 함수
function createForm() {
    // 폼이 이미 존재하는지 확인
    if (formContainer && document.body.contains(formContainer)) {
        return; // 이미 폼이 있으면 중복 생성하지 않음
    }

    // 레이아웃 생성 상태 리셋
    layoutCreated = false;

    // 폼 UI 생성
    formContainer = document.createElement('div');
    formContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        min-width: 400px;
        font-family: Arial, sans-serif;
    `;

    // 제목
    const title = document.createElement('h2');
    title.textContent = 'Residence Size Input';
    title.style.cssText = 'text-align: center; margin: 0 0 20px 0; color: #333;';

    // 입력 그룹
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';

    // Width input field
    const widthGroup = document.createElement('div');
    widthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';

    const widthLabel = document.createElement('label');
    widthLabel.textContent = 'Width (cm)';
    widthLabel.style.cssText = 'margin-bottom: 5px; font-weight: bold; color: #555;';

    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.id = 'width';
    widthInput.placeholder = '0-1000';
    widthInput.style.cssText = `
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        transition: border-color 0.3s;
    `;

    widthGroup.appendChild(widthLabel);
    widthGroup.appendChild(widthInput);

    // Height input field
    const heightGroup = document.createElement('div');
    heightGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';

    const heightLabel = document.createElement('label');
    heightLabel.textContent = 'Height (cm)';
    heightLabel.style.cssText = 'margin-bottom: 5px; font-weight: bold; color: #555;';

    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.id = 'height';
    heightInput.placeholder = '0-1000';
    heightInput.style.cssText = `
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        transition: border-color 0.3s;
    `;

    heightGroup.appendChild(heightLabel);
    heightGroup.appendChild(heightInput);

    // Depth input field
    const depthGroup = document.createElement('div');
    depthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';

    const depthLabel = document.createElement('label');
    depthLabel.textContent = 'Depth (cm)';
    depthLabel.style.cssText = 'margin-bottom: 5px; font-weight: bold; color: #555;';

    const depthInput = document.createElement('input');
    depthInput.type = 'number';
    depthInput.id = 'depth';
    depthInput.placeholder = '0-1000';
    depthInput.style.cssText = `
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        transition: border-color 0.3s;
    `;

    depthGroup.appendChild(depthLabel);
    depthGroup.appendChild(depthInput);

    // 확인 버튼 추가
    submitButton = document.createElement('button');
    submitButton.textContent = 'Confirm';
    submitButton.style.cssText = `
        width: 100%;
        padding: 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        margin-top: 10px;
        transition: background 0.3s;
    `;

    // 입력 그룹에 추가
    inputGroup.appendChild(widthGroup);
    inputGroup.appendChild(heightGroup);
    inputGroup.appendChild(depthGroup);

    // 폼 컨테이너에 추가
    formContainer.appendChild(title);
    formContainer.appendChild(inputGroup);
    formContainer.appendChild(submitButton);

    // DOM에 추가
    document.body.appendChild(formContainer);

    // 확인 버튼 클릭 이벤트
    submitButton.addEventListener('click', () => {
        if (window.createLayout) {
            window.createLayout();
        }
        // 폼 숨기기
        formContainer.style.display = 'none';
    });
}
*/
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
    title.textContent = 'Residence Size Setup';
    title.style.cssText = 'margin: 0 0 15px 0; text-align: center; color: #333;';

    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';


    // Width 입력 필드
    const widthGroup = document.createElement('div');
    widthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
    widthGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Width (W) (cm):</label>
    <input type="number" id="width" min="50" max="2000" step="10" 
           placeholder="1~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

    // Height 입력 필드
    const heightGroup = document.createElement('div');
    heightGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
    heightGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Height (H) (cm):</label>
    <input type="number" id="height" min="50" max="2000" step="10" 
           placeholder="1~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

    // Depth 입력 필드
    const depthGroup = document.createElement('div');
    depthGroup.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
    depthGroup.innerHTML = `
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Depth (D) (cm):</label>
    <input type="number" id="depth" min="50" max="2000" step="10" 
           placeholder="1~2000" style="display: flex; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
`;

    // 확인 버튼 추가
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Confirm';
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
    let habitatDimensions = { x: 0, y: 0, z: 0 }; // 거주지 정보 (x=width, y=height, z=depth)
    let modulePlacements = []; // 각 모듈 위치 정보

    // 모듈 위치 정보를 modulePlacements에 추가하는 함수
    function addModulePlacement(moduleIndex, position, size) {
        const placement = {
            moduleId: moduleIndex + 1, // 1부터 시작하는 ID
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            size: {
                width: size.width,
                height: size.height,
                depth: size.depth
            },
            rotations: {x: 0, y: 0, z: 0}, // 회전 정보 (x, y, z축)
            orientation: 0 // 기존 호환성을 위해 유지
        };
        modulePlacements.push(placement);
        console.log('Module placement added:', placement);
    }

    // 모듈 위치 정보를 업데이트하는 함수
    function updateModulePlacement(moduleIndex, position) {
        console.log('Updating module placement for index:', moduleIndex, 'with position:', position);
        const placement = modulePlacements.find(p => p.moduleId === moduleIndex + 1);
        if (placement) {
            console.log('Before update:', placement.position);
            // 새로운 position 객체로 교체
            placement.position = {
                x: position.x,
                y: position.y,
                z: position.z
            };
            
            // 회전 정보 업데이트
            const module = placedModules.find(m => m.userData && m.userData.index === moduleIndex);
            if (module) {
                const rotations = moduleRotations.get(module) || {x: 0, y: 0, z: 0};
                placement.orientation = rotations.y; // 기존 호환성을 위해 y축 회전만 저장
                placement.rotations = rotations; // 전체 회전 정보 저장
            } else {
                // 모듈을 찾을 수 없는 경우 기본값 설정
                if (!placement.rotations) {
                    placement.rotations = {x: 0, y: 0, z: 0};
                }
            }
            
            console.log('After update:', placement.position, 'orientation:', placement.orientation);
            console.log('Module placement updated:', placement);
        } else {
            console.log('Module placement not found for moduleIndex:', moduleIndex);
            console.log('Available placements:', modulePlacements.map(p => p.moduleId));
        }
    }

    // 모든 모듈 위치 정보를 출력하는 함수
    function printModulePlacements() {
        console.log('All Module Placements:', modulePlacements);
        return modulePlacements;
    }

    // 모듈 데이터 (18개) - 최소 요구사항과 기본값
    /*
        { name: "사이클 운동기구", width: 0.65, depth: 0.69 },
        { name: "트레드밀", height: 1.91 },
        { name: "저항 운동기구", height: 1.91 },
        { name: "개방형 사교 공간 / 훈련실", depth: 1.59 },
        { name: "다목적 테이블", width: 1.91, height: 1.49, depth: 1.91 },
        { name: "화장실 (폐기물 수거)", width: 0.65, height: 1.49 },
        { name: "위생 공간 (세척)", width: 1.21, height: 2.51, depth: 1.43 },
        { name: "임시 저장 공간", width: 0.98, height: 2.31, depth: 2.02 },
        { name: "컴퓨터 워크스테이션", width: 0.65, height: 1.91 },
        { name: "유지보수 작업대", height: 2.31 },
        { name: "주방 (음식 준비)", height: 1.91 },
        { name: "주방 보조 작업대", width: 1.41, depth: 1.41 },
        { name: "의료용 컴퓨터", width: 0.65, height: 1.49 },
        { name: "의료 처치 공간", width: 2.0, height: 2.0, depth: 1.45 },
        { name: "관제 및 모니터링", height: 1.91 },
        { name: "개인 업무 공간 / 외래 진료", height: 1.91 },
        { name: "개인 거주 (수면 및 휴식)", width: 0.65 },
        { name: "폐기물 관리", width: 0.65 }
    */
   /*
const moduleData = [
    {
        "id": 1,
        "name": "사이클 운동기구",
        "displayName": "Cycle Ergometer",
        "volume": 3.38,
        "functions": [
            "Aerobic exercise using a cycle ergometer"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minWidth": 1.3, "minDepth": 1.38
    },
    {
        "id": 2,
        "name": "트레드밀",
        "displayName": "Treadmill",
        "volume": 6.12,
        "functions": [
            "Aerobic exercise using a treadmill",
            "Exercise for maintaining bone density (Bone loading)",
            "Sensorimotor conditioning training"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 3,
        "name": "저항 운동기구",
        "displayName": "Resistive Device",
        "volume": 3.92,
        "functions": [
            "Resistance training to prevent muscle loss"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 4,
        "name": "개방형 사교 공간",
        "displayName": "Open Area / Training",
        "volume": 18.20,
        "functions": [
            "Group recreation (e.g., exercise games)",
            "Team mission training (e.g., VR training)"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Sense of Openness Important", "tagCategory": "PERCEPTION" }
        ],
        "minDepth": 1.95
    },
    {
        "id": 5,
        "name": "다목적 테이블",
        "displayName": "Multi-purpose Table",
        "volume": 10.09,
        "functions": [
            "Crew meal space",
            "Table games, art activities, etc.",
            "Team meetings and mission planning"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 1.91, "minHeight": 1.49, "minDepth": 1.91
    },
    {
        "id": 6,
        "name": "화장실",
        "displayName": "Waste Collection",
        "volume": 2.36,
        "functions": [
            "Collection of liquid and solid waste (urine, feces)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minWidth": 0.65, "minHeight": 1.49
    },
    {
        "id": 7,
        "name": "위생 공간",
        "displayName": "Cleansing / Hygiene-1",
        "volume": 4.35,
        "functions": [
            "Full-body and hand washing",
            "Oral hygiene, shaving, nail care, etc."
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minWidth": 1.21, "minHeight": 2.51, "minDepth": 1.43
    },
    {
        "id": 8,
        "name": "임시 저장 공간",
        "displayName": "Temporary Stowage",
        "volume": 6.00,
        "functions": [
            "Packing and unpacking of goods",
            "Temporary storage of items"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" }
        ],
        "minWidth": 0.98, "minHeight": 2.31, "minDepth": 2.02
    },
    {
        "id": 9,
        "name": "컴퓨터 워크스테이션",
        "displayName": "Computer Workstation",
        "volume": 1.7,
        "functions": [
            "Equipment diagnostics and control",
            "EVA data management and communication"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minWidth": 0.65, "minHeight": 1.49
    },
    {
        "id": 10,
        "name": "유지보수 작업대",
        "displayName": "Work Surface",
        "volume": 4.82,
        "functions": [
            "Repair and maintenance of equipment",
            "Logistics inspection and repackaging",
            "Spacesuit component testing"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Possible Contamination", "tagCategory": "CLEANLINESS" }
        ],
        "minHeight": 2.31
    },
    {
        "id": 11,
        "name": "주방",
        "displayName": "Food Preparation",
        "volume": 4.35,
        "functions": [
            "Food rehydration, cooking, heating, etc."
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 12,
        "name": "주방 보조 작업대",
        "displayName": "Kitchen Work Surface",
        "volume": 3.30,
        "functions": [
            "Sorting food ingredients",
            "Hygiene management of dishes and utensils"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 1.41, "minDepth": 1.41
    },
    {
        "id": 13,
        "name": "의료용 컴퓨터",
        "displayName": "Medical Computer",
        "volume": 1.20,
        "functions": [
            "Medical data recording and management",
            "Telemedicine consultation with Earth medical staff (Private)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minWidth": 0.65, "minHeight": 1.49
    },
    {
        "id": 14,
        "name": "의료 처치 공간",
        "displayName": "Medical Care",
        "volume": 5.80,
        "functions": [
            "Emergency treatment and basic surgery",
            "Clinical diagnosis and dental care"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 2.0, "minHeight": 2.0, "minDepth": 1.45
    },
    {
        "id": 15,
        "name": "관제 및 모니터링",
        "displayName": "Computer/Command / Spacecraft Monitoring",
        "volume": 3.42,
        "functions": [
            "Control and operation of spacecraft systems",
            "Remote operation and crew communication"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 16,
        "name": "개인 업무공간",
        "displayName": "Individual Work Area / Ambulatory Care",
        "volume": 17.40,
        "functions": [
            "Personal work, study, private communication (4-person total)",
            "Basic self-treatment and medication (Outpatient care)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 17,
        "name": "개인 거주",
        "displayName": "Sleep & Relaxation / Non-Cleansing Hygiene-2",
        "volume": 13.96,
        "functions": [
            "Sleep",
            "Private rest and meditation",
            "Changing clothes and appearance management (non-cleansing hygiene)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 0.65
    },
    {
        "id": 18,
        "name": "폐기물 관리",
        "displayName": "Waste Management",
        "volume": 3.76,
        "functions": [
            "Waste packaging and compression",
            "Waste storage"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 0.65
    }
];*/
const moduleData = [
    {
        "id": 1,
        "name": "사이클 운동기구",
        "displayName": "Cycle Ergometer",
        "volume": 3.38,
        "functions": [
            "Aerobic exercise using a cycle ergometer"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minWidth": 0.65, "minDepth": 0.69
    },
    {
        "id": 2,
        "name": "트레드밀",
        "displayName": "Treadmill",
        "volume": 6.12,
        "functions": [
            "Aerobic exercise using a treadmill",
            "Exercise for maintaining bone density (Bone loading)",
            "Sensorimotor conditioning training"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 3,
        "name": "저항 운동기구",
        "displayName": "Resistive Device",
        "volume": 3.92,
        "functions": [
            "Resistance training to prevent muscle loss"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Health Maintenance", "tagCategory": "BENEFIT" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 4,
        "name": "개방형 사교 공간",
        "displayName": "Open Area / Training",
        "volume": 18.20,
        "functions": [
            "Group recreation (e.g., exercise games)",
            "Team mission training (e.g., VR training)"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Noise Generation Possible", "tagCategory": "IMPACT" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Sense of Openness Important", "tagCategory": "PERCEPTION" }
        ],
        "minDepth": 1.95
    },
    {
        "id": 5,
        "name": "다목적 테이블",
        "displayName": "Multi-purpose Table",
        "volume": 10.09,
        "functions": [
            "Crew meal space",
            "Table games, art activities, etc.",
            "Team meetings and mission planning"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 1.91, "minHeight": 1.49, "minDepth": 1.91
    },
    {
        "id": 6,
        "name": "화장실",
        "displayName": "Waste Collection",
        "volume": 2.36,
        "functions": [
            "Collection of liquid and solid waste (urine, feces)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minWidth": 0.65, "minHeight": 1.49
    },
    {
        "id": 7,
        "name": "위생 공간",
        "displayName": "Cleansing / Hygiene-1",
        "volume": 4.35,
        "functions": [
            "Full-body and hand washing",
            "Oral hygiene, shaving, nail care, etc."
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minWidth": 1.21, "minHeight": 2.51, "minDepth": 1.43
    },
    {
        "id": 8,
        "name": "임시 저장 공간",
        "displayName": "Temporary Stowage",
        "volume": 6.00,
        "functions": [
            "Packing and unpacking of goods",
            "Temporary storage of items"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" }
        ],
        "minWidth": 0.98, "minHeight": 2.31, "minDepth": 2.02
    },
    {
        "id": 9,
        "name": "컴퓨터 워크스테이션",
        "displayName": "Computer Workstation",
        "volume": 1.7,
        "functions": [
            "Equipment diagnostics and control",
            "EVA data management and communication"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minWidth": 0.65, "minHeight": 1.91
    },
    {
        "id": 10,
        "name": "유지보수 작업대",
        "displayName": "Work Surface",
        "volume": 4.82,
        "functions": [
            "Repair and maintenance of equipment",
            "Logistics inspection and repackaging",
            "Spacesuit component testing"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Possible Contamination", "tagCategory": "CLEANLINESS" }
        ],
        "minHeight": 2.31
    },
    {
        "id": 11,
        "name": "주방",
        "displayName": "Food Preparation",
        "volume": 4.35,
        "functions": [
            "Food rehydration, cooking, heating, etc."
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" },
            { "tagName": "Resource Consumption", "tagCategory": "RESOURCE" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 12,
        "name": "주방 보조 작업대",
        "displayName": "Kitchen Work Surface",
        "volume": 3.30,
        "functions": [
            "Sorting food ingredients",
            "Hygiene management of dishes and utensils"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 1.41, "minDepth": 1.41
    },
    {
        "id": 13,
        "name": "의료용 컴퓨터",
        "displayName": "Medical Computer",
        "volume": 1.20,
        "functions": [
            "Medical data recording and management",
            "Telemedicine consultation with Earth medical staff (Private)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minWidth": 0.65, "minHeight": 1.49
    },
    {
        "id": 14,
        "name": "의료 처치 공간",
        "displayName": "Medical Care",
        "volume": 5.80,
        "functions": [
            "Emergency treatment and basic surgery",
            "Clinical diagnosis and dental care"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 2.0, "minHeight": 2.0, "minDepth": 1.45
    },
    {
        "id": 15,
        "name": "관제 및 모니터링",
        "displayName": "Computer/Command / Spacecraft Monitoring",
        "volume": 3.42,
        "functions": [
            "Control and operation of spacecraft systems",
            "Remote operation and crew communication"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 16,
        "name": "개인 업무공간",
        "displayName": "Individual Work Area / Ambulatory Care",
        "volume": 17.40,
        "functions": [
            "Personal work, study, private communication (4-person total)",
            "Basic self-treatment and medication (Outpatient care)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Work Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" }
        ],
        "minHeight": 1.91
    },
    {
        "id": 17,
        "name": "개인 거주",
        "displayName": "Sleep & Relaxation / Non-Cleansing Hygiene-2",
        "volume": 13.96,
        "functions": [
            "Sleep",
            "Private rest and meditation",
            "Changing clothes and appearance management (non-cleansing hygiene)"
        ],
        "tags": [
            { "tagName": "Private Space", "tagCategory": "USAGE" },
            { "tagName": "Quiet Required", "tagCategory": "PRIVACY" },
            { "tagName": "Rest Space", "tagCategory": "USAGE" },
            { "tagName": "Clean Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 0.65
    },
    {
        "id": 18,
        "name": "폐기물 관리",
        "displayName": "Waste Management",
        "volume": 3.76,
        "functions": [
            "Waste packaging and compression",
            "Waste storage"
        ],
        "tags": [
            { "tagName": "Shared Space", "tagCategory": "USAGE" },
            { "tagName": "Contaminated Zone", "tagCategory": "CLEANLINESS" }
        ],
        "minWidth": 0.65
    }
];




    // 크기 입력 모달 변수
    let sizeModal;
    let currentModuleIndex = -1;

    // 완성 버튼 변수
    let completeButton;
    let evaluationModal;

    // 거주지 완성 정보 수집
    function getResidenceInfo() {
        const moduleCount = placedModules.length;
        const moduleNames = placedModules.map(m => {
            if (moduleData && moduleData[m.userData.moduleIndex] && moduleData[m.userData.moduleIndex].name) {
                return moduleData[m.userData.moduleIndex].name;
            }
            return '알 수 없는 모듈';
        });
        const uniqueTypes = new Set(placedModules.map(m => m.userData.moduleIndex));

        // 크기 검증 결과 수집
        const sizeValidationResults = validateAllModuleSizes();

        return {
            moduleCount: moduleCount,
            moduleNames: moduleNames,
            uniqueTypes: uniqueTypes.size,
            totalVolume: boxDimensions.width * boxDimensions.height * boxDimensions.depth,
            sizeValidation: sizeValidationResults
        };
    }

    // 모든 모듈의 크기 검증
    function validateAllModuleSizes() {
        const results = {
            isValid: true,
            errors: [],
            warnings: []
        };

        placedModules.forEach(module => {
            const moduleIndex = module.userData.moduleIndex;
            const moduleInfo = moduleData[moduleIndex];
            if (!moduleInfo) return;

            const validationErrors = validateModuleSize(moduleIndex, moduleInfo.width, moduleInfo.height, moduleInfo.depth);

            if (validationErrors.length > 0) {
                results.isValid = false;
                results.errors.push({
                    moduleName: moduleInfo.name,
                    errors: validationErrors
                });
            }
        });

        return results;
    }

    // 완성 버튼 생성
    function createCompleteButton() {
        completeButton = document.createElement('button');
        completeButton.textContent = 'Complete Residence';
        completeButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        display: none;
    `;

        // 호버 효과
        completeButton.addEventListener('mouseenter', () => {
            completeButton.style.transform = 'scale(1.05)';
            completeButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
        });

        completeButton.addEventListener('mouseleave', () => {
            completeButton.style.transform = 'scale(1)';
            completeButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });

        // 클릭 이벤트
        completeButton.addEventListener('click', () => {
            showEvaluationModal();
        });

        document.body.appendChild(completeButton);
    }

    // 평가 모달 생성
    function createEvaluationModal() {
        evaluationModal = document.createElement('div');
        evaluationModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        min-width: 500px;
        max-width: 600px;
        font-family: Arial, sans-serif;
        display: none;
        max-height: 80vh;
        overflow-y: auto;
    `;

        document.body.appendChild(evaluationModal);
    }

    // 평가 모달 표시
    function showEvaluationModal() {
        const info = getResidenceInfo();

        // 크기 검증 결과에 따른 메시지 설정
        let statusMessage = '';
        let statusEmoji = '';
        let statusColor = '';

        if (info.sizeValidation.isValid) {
            statusMessage = 'Residence design completed successfully';
            statusEmoji = '🎉';
            statusColor = '#28a745';
        } else {
            statusMessage = 'There are issues with the residence design';
            statusEmoji = '⚠️';
            statusColor = '#dc3545';
        }

        evaluationModal.innerHTML = `
        ${window.apiResponse ? `
        <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #555; font-size: 18px;">🏆 Evaluation Results</h3>
            ${window.apiResponse.data && window.apiResponse.data.successful ? `
            <!-- 성공한 경우 -->
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 8px; color: white;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">
                        ${window.apiResponse.data.scores ? window.apiResponse.data.scores.overallScore.toFixed(2) : 'N/A'}
                    </div>
                    <div style="font-size: 16px; opacity: 0.9;">
                        Overall Score
                    </div>
                </div>
                ${window.apiResponse.data.scores ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Detailed Scores</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Space Utilization:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.spaceUtilization.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Comfortability:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.comfortability.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Efficiency:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.efficiency.toFixed(2)}</span>
                    </div>
                </div>
                ` : ''}
                ${window.apiResponse.data.feedback && window.apiResponse.data.feedback.improvements ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Improvements</h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; opacity: 0.9;">
                        ${window.apiResponse.data.feedback.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : `
            <!-- 실패한 경우 -->
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; border-radius: 8px; color: white;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">
                        ❌
                    </div>
                    <div style="font-size: 16px; opacity: 0.9;">
                        Validation Failed
                    </div>
                </div>
                ${window.apiResponse.data && window.apiResponse.data.feedback && window.apiResponse.data.feedback.errors ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Errors</h4>
                    <div style="font-size: 14px; opacity: 0.9; line-height: 1.6;">
                        ${window.apiResponse.data.feedback.errors.map(error => {
                            // 에러 메시지에서 모듈 이름, 사용자 부피, 부족량 추출
                            const moduleMatch = error.match(/([^:]+):/);
                            const volumeMatch = error.match(/사용자부피=([0-9.]+)m³/);
                            const shortageMatch = error.match(/부족량=([0-9.]+)m/);
                            
                            if (moduleMatch && volumeMatch && shortageMatch) {
                                const moduleName = moduleMatch[1].trim();
                                const userVolume = volumeMatch[1];
                                const shortage = shortageMatch[1];
                                return `<div style="margin-bottom: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                                    <strong>${moduleName}</strong><br>
                                    사용자 부피: ${userVolume}m³, 부족량: ${shortage}m
                                </div>`;
                            } else {
                                return `<div style="margin-bottom: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                                    ${error}
                                </div>`;
                            }
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px; text-align: center;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Please try again</div>
                    <div style="font-size: 14px; opacity: 0.9;">Fix the validation errors and redesign your residence.</div>
                </div>
            </div>
            `}
        </div>
        ` : `
        <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #555; font-size: 18px;">🏆 Evaluation Results</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
                <div style="font-size: 16px; margin-bottom: 10px;">⏳ Evaluating your design...</div>
                <div style="font-size: 14px;">Please wait while we analyze your residence layout.</div>
            </div>
        </div>
        `}
        
        <div style="text-align: center;">
            <button id="close-evaluation" style="
                padding: 12px 30px;
                background: linear-gradient(45deg, #6c757d, #495057);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                margin-right: 10px;
            ">Close</button>
            <button id="restart-evaluation" style="
                padding: 12px 30px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">Redesign</button>
        </div>
    `;

        evaluationModal.style.display = 'block';

        // 자동으로 JSON 데이터 생성 및 API 전송
        exportResidenceData();

        // 이벤트 리스너
        document.getElementById('close-evaluation').addEventListener('click', () => {
            evaluationModal.style.display = 'none';
        });

        document.getElementById('restart-evaluation').addEventListener('click', () => {
            evaluationModal.style.display = 'none';
            restartDesign();
        });

        // 모달 외부 클릭 시 닫기
        evaluationModal.addEventListener('click', (e) => {
            if (e.target === evaluationModal) {
                evaluationModal.style.display = 'none';
            }
        });
    }

    // 거주지 데이터 내보내기 함수
    function exportResidenceData() {
        // JSON 데이터 생성
        const residenceData = {
            habitatDimensions: {
                x: habitatDimensions.x,
                y: habitatDimensions.y,
                z: habitatDimensions.z
            },
            modulePlacements: modulePlacements.map(placement => {
                // 회전 정보 가져오기 (기본값: 모든 축 0도)
                const rotations = placement.rotations || {x: 0, y: 0, z: 0};
                
                // 회전 값을 0, 90, 180, 270도 중 하나로 정규화
                const normalizeRotation = (angle) => {
                    const normalized = Math.round(angle / 90) * 90;
                    return ((normalized % 360) + 360) % 360; // 음수 처리
                };
                
                return {
                    moduleId: placement.moduleId,
                    position: {
                        x: placement.position.x,
                        y: placement.position.y,
                        z: placement.position.z
                    },
                    size: {
                        width: placement.size.width,
                        height: placement.size.height,
                        depth: placement.size.depth
                    },
                    rotation: {
                        x: normalizeRotation(rotations.x),
                        y: normalizeRotation(rotations.y),
                        z: 0 // z축은 항상 0도
                    }
                };
            })
        };

        // 고급 모드이고 환경이 선택된 경우 missionProfile 추가
        if (difficultyLevel === 'advanced' && environment !== 'default') {
            residenceData.missionProfile = environment.toUpperCase();
        }

        // JSON 문자열로 변환
        const jsonString = JSON.stringify(residenceData, null, 2);
        
        // 클립보드에 복사
        navigator.clipboard.writeText(jsonString).then(() => {
            console.log('JSON data copied to clipboard');
            console.log('Residence Data:', residenceData);
            
            // API로 전송
            sendToAPI(residenceData);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            // 클립보드 복사 실패 시 콘솔에 출력
            console.log('JSON Data:', jsonString);
            sendToAPI(residenceData);
        });
    }

    // API로 데이터 전송
    function sendToAPI(data) {
        const apiUrl = 'http://192.168.0.221:8080/api/v1/evaluate/layout';
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('API Response:', result);
            // API 응답을 전역 변수에 저장
            window.apiResponse = result;
            // 모달이 열려있다면 업데이트
            if (evaluationModal && evaluationModal.style.display === 'block') {
                updateEvaluationModal();
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            // API 오류 시 기본값 설정
            window.apiResponse = null;
            // 모달이 열려있다면 업데이트
            if (evaluationModal && evaluationModal.style.display === 'block') {
                updateEvaluationModal();
            }
        });
    }

    // 평가 모달 업데이트 함수
    function updateEvaluationModal() {
        if (!evaluationModal) return;
        
        const info = getResidenceInfo();

        evaluationModal.innerHTML = `
        ${window.apiResponse ? `
        <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #555; font-size: 18px;">🏆 Evaluation Results</h3>
            ${window.apiResponse.data && window.apiResponse.data.successful ? `
            <!-- 성공한 경우 -->
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 8px; color: white;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">
                        ${window.apiResponse.data.scores ? window.apiResponse.data.scores.overallScore.toFixed(2) : 'N/A'}
                    </div>
                    <div style="font-size: 16px; opacity: 0.9;">
                        Overall Score
                    </div>
                </div>
                ${window.apiResponse.data.scores ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Detailed Scores</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Space Utilization:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.spaceUtilization.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Comfortability:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.comfortability.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                        <span style="opacity: 0.9;">Efficiency:</span>
                        <span style="font-weight: bold;">${window.apiResponse.data.scores.efficiency.toFixed(2)}</span>
                    </div>
                </div>
                ` : ''}
                ${window.apiResponse.data.feedback && window.apiResponse.data.feedback.improvements ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Improvements</h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; opacity: 0.9;">
                        ${window.apiResponse.data.feedback.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : `
            <!-- 실패한 경우 -->
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; border-radius: 8px; color: white;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">
                        ❌
                    </div>
                    <div style="font-size: 16px; opacity: 0.9;">
                        Validation Failed
                    </div>
                </div>
                ${window.apiResponse.data && window.apiResponse.data.feedback && window.apiResponse.data.feedback.errors ? `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Errors</h4>
                    <div style="font-size: 14px; opacity: 0.9; line-height: 1.6;">
                        ${window.apiResponse.data.feedback.errors.map(error => {
                            // 에러 메시지에서 모듈 이름, 사용자 부피, 부족량 추출
                            const moduleMatch = error.match(/([^:]+):/);
                            const volumeMatch = error.match(/사용자부피=([0-9.]+)m³/);
                            const shortageMatch = error.match(/부족량=([0-9.]+)m/);
                            
                            if (moduleMatch && volumeMatch && shortageMatch) {
                                const moduleName = moduleMatch[1].trim();
                                const userVolume = volumeMatch[1];
                                const shortage = shortageMatch[1];
                                return `<div style="margin-bottom: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                                    <strong>${moduleName}</strong><br>
                                    사용자 부피: ${userVolume}m³, 부족량: ${shortage}m
                                </div>`;
                            } else {
                                return `<div style="margin-bottom: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                                    ${error}
                                </div>`;
                            }
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; margin-top: 15px; text-align: center;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Please try again</div>
                    <div style="font-size: 14px; opacity: 0.9;">Fix the validation errors and redesign your residence.</div>
                </div>
            </div>
            `}
        </div>
        ` : `
        <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #555; font-size: 18px;">🏆 Evaluation Results</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
                <div style="font-size: 16px; margin-bottom: 10px;">⏳ Evaluating your design...</div>
                <div style="font-size: 14px;">Please wait while we analyze your residence layout.</div>
            </div>
        </div>
        `}
        
        <div style="text-align: center;">
            <button id="close-evaluation" style="
                padding: 12px 30px;
                background: linear-gradient(45deg, #6c757d, #495057);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                margin-right: 10px;
            ">Close</button>
            <button id="restart-evaluation" style="
                padding: 12px 30px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">Redesign</button>
        </div>
    `;

        // 이벤트 리스너 재등록
        document.getElementById('close-evaluation').addEventListener('click', () => {
            evaluationModal.style.display = 'none';
        });

        document.getElementById('restart-evaluation').addEventListener('click', () => {
            evaluationModal.style.display = 'none';
            restartDesign();
        });

        // 모달 외부 클릭 시 닫기
        evaluationModal.addEventListener('click', (e) => {
            if (e.target === evaluationModal) {
                evaluationModal.style.display = 'none';
            }
        });
    }

    // 설계 다시 시작
    function restartDesign() {
        // 모든 설치된 모듈 제거
        placedModules.forEach(module => {
            scene.remove(module);
        });
        placedModules = [];
        clickedModules.clear();

        // 버튼 상태 업데이트
        updateModuleButtonStates();

        // 완성 버튼 숨기기
        completeButton.style.display = 'none';

        console.log('설계가 초기화되었습니다.');
    }



    // 최소/최대 요구사항 검증 함수
    function validateModuleSize(moduleIndex, width, height, depth) {
        const module = moduleData[moduleIndex];
        if (!module) {
            return ['Module information not found.'];
        }
        const errors = [];

    // 최소값 검증 (cm 단위로 표시)
    if (module.minWidth && width < module.minWidth) {
        errors.push(`Width must be at least ${(module.minWidth * 100).toFixed(0)}cm. (Current: ${(width * 100).toFixed(0)}cm)`);
    }
    if (module.minHeight && height < module.minHeight) {
        errors.push(`Height must be at least ${(module.minHeight * 100).toFixed(0)}cm. (Current: ${(height * 100).toFixed(0)}cm)`);
    }
    if (module.minDepth && depth < module.minDepth) {
        errors.push(`Depth must be at least ${(module.minDepth * 100).toFixed(0)}cm. (Current: ${(depth * 100).toFixed(0)}cm)`);
    }

    // 최대 높이 검증 (거주지 높이 제한)
    if (height > boxDimensions.height) {
        errors.push(`Height exceeds residence height. (Residence: ${(boxDimensions.height * 100).toFixed(0)}cm, Current: ${(height * 100).toFixed(0)}cm)`);
    }

        return errors;
    }

    // 크기 입력 모달 생성 함수
    function createSizeModal() {
        sizeModal = document.createElement('div');
        sizeModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        min-width: 400px;
        font-family: Arial, sans-serif;
        display: none;
    `;

        sizeModal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; text-align: center; color: #333;">Module Size Setup</h3>
        <div id="modal-module-name" style="text-align: center; margin-bottom: 20px; font-weight: bold; color: #666;"></div>
        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; color: #666; font-size: 14px;">
            <strong>Residence Size:</strong> ${(boxDimensions.width * 100).toFixed(0)}cm × ${(boxDimensions.height * 100).toFixed(0)}cm × ${(boxDimensions.depth * 100).toFixed(0)}cm
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; flex-direction: column; width: 100%;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Width (cm)</label>
                <input type="number" id="modal-width" placeholder="1~2000" min="1" max="2000" step="1" 
                       style="padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Height (cm)</label>
                <input type="number" id="modal-height" placeholder="1~2000" min="1" max="2000" step="1" 
                       style="padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Depth (cm)</label>
                <input type="number" id="modal-depth" placeholder="1~2000" min="1" max="2000" step="1" 
                       style="padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;">
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button id="modal-create" style="flex: 1; padding: 12px; background: linear-gradient(45deg, #28a745, #20c997); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">Create</button>
            <button id="modal-cancel" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">Cancel</button>
        </div>
    `;

        document.body.appendChild(sizeModal);

        // 이벤트 리스너
        document.getElementById('modal-create').addEventListener('click', createModuleWithSize);
        document.getElementById('modal-cancel').addEventListener('click', closeSizeModal);

        // 모달 외부 클릭 시 닫기
        sizeModal.addEventListener('click', (e) => {
            if (e.target === sizeModal) {
                closeSizeModal();
            }
        });
    }

    // 모달 열기 함수
    function openSizeModal(moduleIndex) {
        currentModuleIndex = moduleIndex;
        const moduleInfo = moduleData[moduleIndex];
        if (!moduleInfo) {
            alert('모듈 정보를 찾을 수 없습니다.');
            return;
        }

        document.getElementById('modal-module-name').textContent = moduleInfo.displayName || moduleInfo.name;

    // 입력 필드를 최솟값으로 초기화하고 제한 설정 (cm 단위)
    const widthInput = document.getElementById('modal-width');
    const heightInput = document.getElementById('modal-height');
    const depthInput = document.getElementById('modal-depth');
    
    // cm 단위로 변환하여 설정
    widthInput.value = moduleInfo.minWidth ? (moduleInfo.minWidth * 100).toFixed(0) : '';
    heightInput.value = moduleInfo.minHeight ? (moduleInfo.minHeight * 100).toFixed(0) : '';
    depthInput.value = moduleInfo.minDepth ? (moduleInfo.minDepth * 100).toFixed(0) : '';
    
    // 최솟값 제한 설정 (cm 단위)
    if (moduleInfo.minWidth) {
        widthInput.min = moduleInfo.minWidth * 100;
    }
    if (moduleInfo.minHeight) {
        heightInput.min = moduleInfo.minHeight * 100;
    }
    if (moduleInfo.minDepth) {
        depthInput.min = moduleInfo.minDepth * 100;
    }
    
    // 최대 높이를 거주지 높이로 제한 (cm 단위)
    heightInput.max = boxDimensions.height * 100;
    
    // 실시간 검증 제거 - 만들기 버튼 클릭 시에만 검증

        // 최소 요구사항 표시
        const minInfo = document.createElement('div');
        minInfo.id = 'min-requirements';
        minInfo.style.cssText = `
        background: #e3f2fd;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        font-size: 12px;
        color: #1976d2;
    `;
        // 최솟값이 있는 항목만 표시
    let minRequirements = [];
    if (moduleInfo.minWidth) {
        minRequirements.push(`Width: Min ${(moduleInfo.minWidth * 100).toFixed(0)}cm`);
    }
    if (moduleInfo.minHeight) {
        minRequirements.push(`Height: Min ${(moduleInfo.minHeight * 100).toFixed(0)}cm`);
    }
    if (moduleInfo.minDepth) {
        minRequirements.push(`Depth: Min ${(moduleInfo.minDepth * 100).toFixed(0)}cm`);
    }
    
    minInfo.innerHTML = `
        <strong>Size Requirements:</strong><br>
        ${minRequirements.join('<br>')}
    `;

        // 기존 최소 요구사항 제거 후 새로 추가
        const existingMinInfo = document.getElementById('min-requirements');
        if (existingMinInfo) {
            existingMinInfo.remove();
        }

        const modalContent = sizeModal.querySelector('div[style*="display: flex; flex-direction: column; gap: 15px;"]');
        
        // 고급 모드에서는 최소 크기 요구사항 숨기기
        if (difficultyLevel === 'advanced') {
            minInfo.style.display = 'none';
        } else {
            minInfo.style.display = 'block';
        }
        
        modalContent.parentNode.insertBefore(minInfo, modalContent);

        sizeModal.style.display = 'block';
    }

    // 모달 닫기 함수
    function closeSizeModal() {
        sizeModal.style.display = 'none';
        currentModuleIndex = -1;
    }

    // 모듈 생성 함수
    function createModuleWithSize() {
        const width = parseFloat(document.getElementById('modal-width').value);
        const height = parseFloat(document.getElementById('modal-height').value);
        const depth = parseFloat(document.getElementById('modal-depth').value);

        // 입력 검증
        if (!width || !height || !depth || width <= 0 || height <= 0 || depth <= 0) {
            alert('Please enter valid size values. (1cm or more)');
            return;
        }

        // 높이 검증 - 서식지보다 높으면 설치 차단
        const maxHeight = boxDimensions.height * 100; // cm 단위
        if (height > maxHeight) {
            alert(`Height exceeds residence height. (Residence: ${maxHeight.toFixed(0)}cm, Current: ${height.toFixed(0)}cm)`);
            return;
        }

        // cm를 m로 변환
        const widthM = cmToMeters(width);
        const heightM = cmToMeters(height);
        const depthM = cmToMeters(depth);

        // 크기 검증 제거 - 완성 시에만 검증

        // 모듈 데이터 업데이트
        if (moduleData[currentModuleIndex]) {
            moduleData[currentModuleIndex].width = widthM;
            moduleData[currentModuleIndex].height = heightM;
            moduleData[currentModuleIndex].depth = depthM;
        }

        // 모듈 설치 시도
        if (placeModuleInBox(currentModuleIndex)) {
            clickedModules.add(currentModuleIndex);
            updateModuleButtonStates();
            showModuleInfo(currentModuleIndex);
            closeSizeModal();

            // 완성 버튼 표시
            if (placedModules.length > 0) {
                completeButton.style.display = 'block';
            }

            if (moduleData && moduleData[currentModuleIndex] && moduleData[currentModuleIndex].name) {
                console.log(`Module "${moduleData[currentModuleIndex].name}" created. Size: ${width}cm x ${height}cm x ${depth}cm`);
            } else {
                console.log(`Module created. Size: ${width}cm x ${height}cm x ${depth}cm`);
            }
        } else {
            alert('Cannot install module. Please check residence space.');
        }
    }

    // 그리드 라인 생성 함수
    function createGridLines(width, height, depth, divisions = 10) {
        const gridGroup = new THREE.Group();

        // 바닥면 그리드 (X-Z 평면)
        const floorGridGeometry = new THREE.BufferGeometry();
        const floorGridPoints = [];

        // X축 방향 그리드 라인
        for (let i = 0; i <= divisions; i++) {
            const x = (i / divisions - 0.5) * width;
            floorGridPoints.push(new THREE.Vector3(x, 0, -depth / 2));
            floorGridPoints.push(new THREE.Vector3(x, 0, depth / 2));
        }

        // Z축 방향 그리드 라인
        for (let i = 0; i <= divisions; i++) {
            const z = (i / divisions - 0.5) * depth;
            floorGridPoints.push(new THREE.Vector3(-width / 2, 0, z));
            floorGridPoints.push(new THREE.Vector3(width / 2, 0, z));
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
            frontGridPoints.push(new THREE.Vector3(x, 0, depth / 2));
            frontGridPoints.push(new THREE.Vector3(x, height, depth / 2));
        }

        // Y축 방향 그리드 라인
        for (let i = 0; i <= divisions; i++) {
            const y = (i / divisions) * height;
            frontGridPoints.push(new THREE.Vector3(-width / 2, y, depth / 2));
            frontGridPoints.push(new THREE.Vector3(width / 2, y, depth / 2));
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
            sideGridPoints.push(new THREE.Vector3(width / 2, 0, z));
            sideGridPoints.push(new THREE.Vector3(width / 2, height, z));
        }

        // Y축 방향 그리드 라인
        for (let i = 0; i <= divisions; i++) {
            const y = (i / divisions) * height;
            sideGridPoints.push(new THREE.Vector3(width / 2, y, -depth / 2));
            sideGridPoints.push(new THREE.Vector3(width / 2, y, depth / 2));
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
            new THREE.Vector3(-width / 2, 0, -depth / 2),
            new THREE.Vector3(width / 2, 0, -depth / 2),
            new THREE.Vector3(width / 2, 0, depth / 2),
            new THREE.Vector3(-width / 2, 0, depth / 2),
            new THREE.Vector3(-width / 2, 0, -depth / 2)
        ]);
        const floorBorder = new THREE.Line(floorBorderGeometry, borderMaterial);
        borderGroup.add(floorBorder);

        // 앞면 테두리 (X-Y 평면) - 뒤쪽에 위치
        const frontBorderGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-width / 2, 0, -depth / 2),
            new THREE.Vector3(width / 2, 0, -depth / 2),
            new THREE.Vector3(width / 2, height, -depth / 2),
            new THREE.Vector3(-width / 2, height, -depth / 2),
            new THREE.Vector3(-width / 2, 0, -depth / 2)
        ]);
        const frontBorder = new THREE.Line(frontBorderGeometry, borderMaterial);
        borderGroup.add(frontBorder);

        // 왼쪽 옆면 테두리 (Y-Z 평면)
        const leftSideBorderGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-width / 2, 0, -depth / 2),
            new THREE.Vector3(-width / 2, 0, depth / 2),
            new THREE.Vector3(-width / 2, height, depth / 2),
            new THREE.Vector3(-width / 2, height, -depth / 2),
            new THREE.Vector3(-width / 2, 0, -depth / 2)
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

        const moduleColors = getModuleColors();

        // 18개 모듈 생성 (3x6 배치)
        for (let i = 0; i < 18; i++) {
            const geometry = new THREE.BoxGeometry(moduleSize, moduleSize, moduleSize);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(moduleColors[i]), // 미리 정의된 색상 사용
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
                name: moduleData[i] ? moduleData[i].name : '알 수 없는 모듈',
                originalSize: {
                    width: moduleData[i] ? moduleData[i].width : 1,
                    height: moduleData[i] ? moduleData[i].height : 1,
                    depth: moduleData[i] ? moduleData[i].depth : 1
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
        // 박스 경계 체크 (높이 제한 제거)
        const maxX = (boxDimensions.width / 2) - (moduleSize.width / 2);
        const minX = -(boxDimensions.width / 2) + (moduleSize.width / 2);
        const maxZ = (boxDimensions.depth / 2) - (moduleSize.depth / 2);
        const minZ = -(boxDimensions.depth / 2) + (moduleSize.depth / 2);
        const minY = moduleSize.height / 2; // 최소 높이만 체크 (바닥 위에 있어야 함)
        
        if (position.x < minX || position.x > maxX ||
            position.z < minZ || position.z > maxZ ||
            position.y < minY) { // 최대 높이 체크 제거
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
        if (!moduleInfo) return false;

        // 이미 설치된 모듈이면 false
        if (clickedModules.has(moduleIndex)) {
            return false;
        }

        // 모든 모듈이 항상 설치 가능 (박스 크기 무관)
        return true;
    }

    // 모듈 버튼 상태 업데이트 함수
    function updateModuleButtonStates() {
        const moduleButtons = document.querySelectorAll('[data-module-index]');

        moduleButtons.forEach(button => {
            const moduleIndex = parseInt(button.getAttribute('data-module-index'));
            const moduleInfo = moduleData[moduleIndex];
            if (!moduleInfo) return;

            // 이미 설치된 모듈
            if (clickedModules.has(moduleIndex)) {
                button.style.background = 'linear-gradient(45deg, #28a745, #20c997)'; // 녹색
                button.style.color = 'white';
                button.style.opacity = '0.8';
                button.style.cursor = 'pointer'; // 클릭 가능하도록 변경
                button.style.pointerEvents = 'auto'; // 클릭 가능하도록 변경
                button.style.boxShadow = 'none';
            }
            // 공간 부족으로 설치할 수 없는 모듈 (박스 크기 체크 제거)
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
                button.style.boxShadow = 'none'; // 그림자 제거
            }
        });
    }

    // 모듈을 박스 안에 실제 크기로 배치하는 함수
    function placeModuleInBox(moduleIndex) {
        const moduleInfo = moduleData[moduleIndex];
        if (!moduleInfo) return false;

        // 높이 검증 제거 - 입력 시 실시간 검증으로 대체

        // 실제 크기로 모듈 생성
        const geometry = new THREE.BoxGeometry(moduleInfo.width, moduleInfo.height, moduleInfo.depth);
        
        const moduleColors = getModuleColors();
        
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(moduleColors[moduleIndex]),
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
            // 랜덤 위치 생성 (바닥면과 벽면 중에서)
            const surfaceType = Math.random();
            let x, y, z;

            if (surfaceType < 0.6) {
                // 60% 확률로 바닥면에 설치
                x = (Math.random() - 0.5) * (boxDimensions.width - moduleInfo.width);
                z = (Math.random() - 0.5) * (boxDimensions.depth - moduleInfo.depth);
                y = moduleInfo.height / 2;
            } else if (surfaceType < 0.8) {
                // 20% 확률로 앞면 벽에 설치
                x = (Math.random() - 0.5) * (boxDimensions.width - moduleInfo.width);
                y = moduleInfo.height / 2 + Math.random() * (boxDimensions.height - moduleInfo.height);
                z = -boxDimensions.depth / 2 + moduleInfo.depth / 2;
            } else {
                // 20% 확률로 왼쪽 벽에 설치
                x = -boxDimensions.width / 2 + moduleInfo.width / 2;
                y = moduleInfo.height / 2 + Math.random() * (boxDimensions.height - moduleInfo.height);
                z = (Math.random() - 0.5) * (boxDimensions.depth - moduleInfo.depth);
            }

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

        // 새로 추가된 모듈에 깜빡이는 효과 추가
        addBlinkingEffect(placedModule);

        // 모듈 위치 정보 추가
        addModulePlacement(moduleIndex, placedModule.position, {
            width: moduleInfo.width,
            height: moduleInfo.height,
            depth: moduleInfo.depth
        });

        // 버튼 상태 업데이트
        updateModuleButtonStates();

        // 모듈 제목 업데이트
        updateModuleTitle();

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
            const clickedModule = intersects[0].object;
            
            // 설치된 모듈을 클릭했을 때 설명창 표시
            if (clickedModule.userData && clickedModule.userData.isPlaced) {
                const moduleIndex = clickedModule.userData.index;
                showModuleInfo(moduleIndex);
                
                // 모듈 선택 (회전용)
                selectedModule = clickedModule;
                
                // 깜빡이는 효과 제거
                removeBlinkingEffect(clickedModule);
                
                // 빛나는 효과 제거
                removeGlowEffect();
                
                // 설명창 표시 후에도 드래그 시작
                draggedModule = clickedModule;
                isDragging = true;
                draggedModule.material.opacity = 0.5; // 드래그 중 반투명

                // 드래그 중에는 OrbitControls 비활성화
                controls.enabled = false;
            }
        } else {
            // 빈 공간을 클릭했을 때 선택 해제
            selectedModule = null;
        }
    }

    function onMouseMove(event) {
        if (!isDragging || !draggedModule) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 여러 면과의 교차점 계산 (바닥, 벽면들)
        const intersections = [];
        
        // 바닥면 (Y=0)
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const floorIntersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlane, floorIntersection)) {
            intersections.push({ point: floorIntersection, normal: new THREE.Vector3(0, 1, 0), type: 'floor' });
        }
        
        // 앞면 벽 (Z=-depth/2)
        const frontPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -boxDimensions.depth / 2);
        const frontIntersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(frontPlane, frontIntersection)) {
            intersections.push({ point: frontIntersection, normal: new THREE.Vector3(0, 0, 1), type: 'front' });
        }
        
        // 왼쪽 벽 (X=-width/2)
        const leftPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -boxDimensions.width / 2);
        const leftIntersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(leftPlane, leftIntersection)) {
            intersections.push({ point: leftIntersection, normal: new THREE.Vector3(1, 0, 0), type: 'left' });
        }
        
        // 뒤쪽 벽 (Z=depth/2)
        const backPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -boxDimensions.depth / 2);
        const backIntersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(backPlane, backIntersection)) {
            intersections.push({ point: backIntersection, normal: new THREE.Vector3(0, 0, -1), type: 'back' });
        }

        if (intersections.length > 0) {
            // 가장 가까운 교차점 선택
            const closestIntersection = intersections.reduce((closest, current) => {
                const closestDist = camera.position.distanceTo(closest.point);
                const currentDist = camera.position.distanceTo(current.point);
                return currentDist < closestDist ? current : closest;
            });

            // 모듈 크기 가져오기 (회전 상태 고려)
            let moduleWidth = draggedModule.geometry.parameters.width;
            let moduleDepth = draggedModule.geometry.parameters.depth;
            let moduleHeight = draggedModule.geometry.parameters.height;
            
            // 현재 회전 상태에 따른 실제 크기 계산
            const rotations = moduleRotations.get(draggedModule) || {x: 0, y: 0, z: 0};
            
            // 모든 회전을 순차적으로 적용하여 최종 크기 계산
            // Y축 회전: width와 depth가 바뀔 수 있음
            if (rotations.y === 90 || rotations.y === 270) {
                [moduleWidth, moduleDepth] = [moduleDepth, moduleWidth];
            }
            // X축 회전: height와 depth가 바뀔 수 있음
            if (rotations.x === 90 || rotations.x === 270) {
                [moduleHeight, moduleDepth] = [moduleDepth, moduleHeight];
            }

            let clampedX, clampedY, clampedZ;

            if (closestIntersection.type === 'floor') {
                // 바닥면에 설치
                const maxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const minX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const maxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const minZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);

                clampedX = Math.max(minX, Math.min(maxX, closestIntersection.point.x));
                clampedZ = Math.max(minZ, Math.min(maxZ, closestIntersection.point.z));
                clampedY = moduleHeight / 2;
                
                // 크기 제한 체크 - 모듈이 박스보다 크면 박스 중앙에 배치
                if (moduleHeight > boxDimensions.height) {
                    clampedY = boxDimensions.height / 2;
                }
                if (moduleWidth > boxDimensions.width) {
                    clampedX = 0;
                }
                if (moduleDepth > boxDimensions.depth) {
                    clampedZ = 0;
                }
                
                // 최종 경계 체크 - 모듈이 박스를 벗어나지 않도록 강제 제한
                const finalMaxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const finalMinX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const finalMaxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const finalMinZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
                const finalMaxY = boxDimensions.height - (moduleHeight / 2);
                const finalMinY = moduleHeight / 2;
                
                clampedX = Math.max(finalMinX, Math.min(finalMaxX, clampedX));
                clampedZ = Math.max(finalMinZ, Math.min(finalMaxZ, clampedZ));
                clampedY = Math.max(finalMinY, Math.min(finalMaxY, clampedY));
            } else if (closestIntersection.type === 'front') {
                // 앞면 벽에 설치
                const maxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const minX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const maxY = boxDimensions.height - (moduleHeight / 2);
                const minY = moduleHeight / 2;

                clampedX = Math.max(minX, Math.min(maxX, closestIntersection.point.x));
                clampedY = Math.max(minY, Math.min(maxY, closestIntersection.point.y));
                clampedZ = -boxDimensions.depth / 2 + moduleDepth / 2;
                
                // 크기 제한 체크 - 모듈이 박스보다 크면 박스 중앙에 배치
                if (moduleHeight > boxDimensions.height) {
                    clampedY = boxDimensions.height / 2;
                }
                if (moduleWidth > boxDimensions.width) {
                    clampedX = 0;
                }
                if (moduleDepth > boxDimensions.depth) {
                    clampedZ = 0;
                }
                
                // 최종 경계 체크 - 모듈이 박스를 벗어나지 않도록 강제 제한
                const finalMaxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const finalMinX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const finalMaxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const finalMinZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
                const finalMaxY = boxDimensions.height - (moduleHeight / 2);
                const finalMinY = moduleHeight / 2;
                
                clampedX = Math.max(finalMinX, Math.min(finalMaxX, clampedX));
                clampedZ = Math.max(finalMinZ, Math.min(finalMaxZ, clampedZ));
                clampedY = Math.max(finalMinY, Math.min(finalMaxY, clampedY));
            } else if (closestIntersection.type === 'left') {
                // 왼쪽 벽에 설치
                const maxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const minZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
                const maxY = boxDimensions.height - (moduleHeight / 2);
                const minY = moduleHeight / 2;

                clampedX = -boxDimensions.width / 2 + moduleWidth / 2;
                clampedY = Math.max(minY, Math.min(maxY, closestIntersection.point.y));
                clampedZ = Math.max(minZ, Math.min(maxZ, closestIntersection.point.z));
                
                // 크기 제한 체크 - 모듈이 박스보다 크면 박스 중앙에 배치
                if (moduleHeight > boxDimensions.height) {
                    clampedY = boxDimensions.height / 2;
                }
                if (moduleWidth > boxDimensions.width) {
                    clampedX = 0;
                }
                if (moduleDepth > boxDimensions.depth) {
                    clampedZ = 0;
                }
                
                // 최종 경계 체크 - 모듈이 박스를 벗어나지 않도록 강제 제한
                const finalMaxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const finalMinX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const finalMaxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const finalMinZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
                const finalMaxY = boxDimensions.height - (moduleHeight / 2);
                const finalMinY = moduleHeight / 2;
                
                clampedX = Math.max(finalMinX, Math.min(finalMaxX, clampedX));
                clampedZ = Math.max(finalMinZ, Math.min(finalMaxZ, clampedZ));
                clampedY = Math.max(finalMinY, Math.min(finalMaxY, clampedY));
            } else if (closestIntersection.type === 'back') {
                // 뒤쪽 벽에 설치
                const maxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const minX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const maxY = boxDimensions.height - (moduleHeight / 2);
                const minY = moduleHeight / 2;

                clampedX = Math.max(minX, Math.min(maxX, closestIntersection.point.x));
                clampedY = Math.max(minY, Math.min(maxY, closestIntersection.point.y));
                clampedZ = boxDimensions.depth / 2 - moduleDepth / 2;
                
                // 크기 제한 체크 - 모듈이 박스보다 크면 박스 중앙에 배치
                if (moduleHeight > boxDimensions.height) {
                    clampedY = boxDimensions.height / 2;
                }
                if (moduleWidth > boxDimensions.width) {
                    clampedX = 0;
                }
                if (moduleDepth > boxDimensions.depth) {
                    clampedZ = 0;
                }
                
                // 최종 경계 체크 - 모듈이 박스를 벗어나지 않도록 강제 제한
                const finalMaxX = (boxDimensions.width / 2) - (moduleWidth / 2);
                const finalMinX = -(boxDimensions.width / 2) + (moduleWidth / 2);
                const finalMaxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
                const finalMinZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
                const finalMaxY = boxDimensions.height - (moduleHeight / 2);
                const finalMinY = moduleHeight / 2;
                
                clampedX = Math.max(finalMinX, Math.min(finalMaxX, clampedX));
                clampedZ = Math.max(finalMinZ, Math.min(finalMaxZ, clampedZ));
                clampedY = Math.max(finalMinY, Math.min(finalMaxY, clampedY));
            }

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

            // 회전 상태를 고려한 실제 크기 계산
            let moduleWidth = draggedModule.geometry.parameters.width;
            let moduleHeight = draggedModule.geometry.parameters.height;
            let moduleDepth = draggedModule.geometry.parameters.depth;
            
            const rotations = moduleRotations.get(draggedModule) || {x: 0, y: 0, z: 0};
            
            // 모든 회전을 순차적으로 적용하여 최종 크기 계산
            // Y축 회전: width와 depth가 바뀔 수 있음
            if (rotations.y === 90 || rotations.y === 270) {
                [moduleWidth, moduleDepth] = [moduleDepth, moduleWidth];
            }
            // X축 회전: height와 depth가 바뀔 수 있음
            if (rotations.x === 90 || rotations.x === 270) {
                [moduleHeight, moduleDepth] = [moduleDepth, moduleHeight];
            }

            const moduleSize = {
                width: moduleWidth,
                height: moduleHeight,
                depth: moduleDepth
            };

            const canPlace = canPlaceModuleAt(finalPosition, moduleSize, draggedModule);

            if (canPlace) {
                // 충돌하지 않으면 원래 색상으로 복원
                const moduleColors = getModuleColors();
                const originalColor = new THREE.Color(moduleColors[draggedModule.userData.index]);
                draggedModule.material.color.copy(originalColor);
                draggedModule.material.opacity = 0.7;
            } else {
                // 충돌 시 빨간색으로 표시만 하고 위치는 유지
                draggedModule.material.color.setHex(0xff0000);
                draggedModule.material.opacity = 0.7;
                console.log('충돌이 발생했습니다. 모듈을 다른 위치로 이동해주세요.');
            }

            // 모듈 위치 정보 업데이트
            if (canPlace) {
                updateModulePlacement(draggedModule.userData.index, finalPosition);
            }

            isDragging = false;
            draggedModule = null;

            // 드래그 종료 시 OrbitControls 다시 활성화
            controls.enabled = true;
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
        top: 45%;
        transform: translateY(-50%);
        width: 200px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        font-family: Arial, sans-serif;
        display: none;
        padding: 12px;
        border: 2px solid #007bff;
        font-size: 13px;
    `;

        // 모달 내용
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
                <h3 id="modal-title" style="margin: 0 0 8px 0; color: #333; text-align: center; font-size: 15px;">Module Information</h3>
        <div id="modal-info" style="color: #666; line-height: 1.3; font-size: 12px;">
            <p><strong>Name:</strong> <span id="module-name">-</span></p>
            <p><strong>Size:</strong> <span id="module-size">-</span></p>
            <p><strong>Functions:</strong> <span id="module-functions">-</span></p>
            <p id="tags-section" style="display: ${difficultyLevel === 'advanced' ? 'none' : 'block'};"><strong>Tags:</strong> <span id="module-tags">-</span></p>
        </div>
        <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; margin: 8px 0; font-size: 11px; color: #666;">
            <strong>💡 Usage:</strong><br>
            • Drag module to move<br>
            • <strong>R key</strong> to rotate Y-axis<br>
            • <strong>T key</strong> to rotate X-axis<br>
            • <strong>Delete/Backspace</strong> to remove
        </div>
        <button id="close-modal" style="
            width: 100%;
            padding: 6px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 8px;
            font-weight: bold;
            font-size: 12px;
        ">Close</button>
    `;

        infoModal.appendChild(modalContent);
        document.body.appendChild(infoModal);

        // 닫기 버튼 이벤트
        document.getElementById('close-modal').addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
        
        // 모달 외부 클릭 시 닫기
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.style.display = 'none';
            }
        });
    }

    // 모듈에 빛나는 테두리 효과 추가
    function addGlowEffect(module) {
        if (!module || !module.userData || !module.userData.isPlaced) return;
        
        // 기존 빛나는 효과 제거
        removeGlowEffect();
        
        // 빛나는 테두리 생성
        const geometry = new THREE.BoxGeometry(
            module.geometry.parameters.width + 0.1, // 약간 더 크게
            module.geometry.parameters.height + 0.1,
            module.geometry.parameters.depth + 0.1
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // 녹색 빛
            transparent: true,
            opacity: 0.3,
            wireframe: true,
            side: THREE.BackSide // 내부에서 보이도록
        });
        
        glowOutline = new THREE.Mesh(geometry, material);
        glowOutline.position.copy(module.position);
        glowOutline.rotation.copy(module.rotation);
        
        scene.add(glowOutline);
        glowingModule = module;
        
        // 펄스 애니메이션 시작
        animateGlow();
        
        console.log('Glow effect added to module:', module.userData.index);
    }

    // 빛나는 효과 제거
    function removeGlowEffect() {
        if (glowOutline) {
            scene.remove(glowOutline);
            glowOutline.geometry.dispose();
            glowOutline.material.dispose();
            glowOutline = null;
        }
        glowingModule = null;
    }

    // 빛나는 애니메이션
    function animateGlow() {
        if (!glowOutline) return;
        
        const time = Date.now() * 0.005;
        const scale = 1 + Math.sin(time) * 0.1; // 0.9 ~ 1.1 크기 변화
        const opacity = 0.3 + Math.sin(time) * 0.2; // 0.1 ~ 0.5 투명도 변화
        
        glowOutline.scale.setScalar(scale);
        glowOutline.material.opacity = opacity;
        
        requestAnimationFrame(animateGlow);
    }

    // 선택된 모듈을 삭제하는 함수
    function removeSelectedModule() {
        if (!selectedModule || !selectedModule.userData || !selectedModule.userData.isPlaced) {
            return;
        }

        const moduleToRemove = selectedModule;
        const moduleIndex = moduleToRemove.userData.index;

        // 3D 씬에서 제거
        scene.remove(moduleToRemove);
        placedModules.splice(placedModules.indexOf(moduleToRemove), 1);

        // modulePlacements에서 제거
        const placementIndex = modulePlacements.findIndex(p => p.moduleId === moduleIndex + 1);
        if (placementIndex !== -1) {
            modulePlacements.splice(placementIndex, 1);
            console.log('Module placement removed:', moduleIndex + 1);
        }

        // 클릭된 모듈 목록에서 제거
        clickedModules.delete(moduleIndex);

        // 회전 정보도 제거
        moduleRotations.delete(moduleToRemove);

        // 선택 상태 초기화
        selectedModule = null;
        
        // 빛나는 효과 제거 (삭제된 모듈이 빛나고 있었다면)
        if (glowingModule === moduleToRemove) {
            removeGlowEffect();
        }

        // 버튼 상태 업데이트
        updateModuleButtonStates();

        // 모듈 제목 업데이트
        updateModuleTitle();

        // 모든 모듈이 제거되면 완성 버튼 숨기기
        if (placedModules.length === 0) {
            completeButton.style.display = 'none';
        }

        console.log('Module removed via keyboard:', moduleIndex);
    }

    // 키보드 이벤트 처리 함수
    function onKeyDown(event) {
        // Delete 또는 Backspace 키로 모듈 삭제
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (selectedModule && selectedModule.userData && selectedModule.userData.isPlaced) {
                event.preventDefault();
                removeSelectedModule();
                return;
            }
        }
        
        // 모듈이 선택되지 않은 경우 다른 키보드 기능 무시
        if (!selectedModule) return;
        
        const key = event.key.toLowerCase();
        if (key === 'r') {
            rotateModule(selectedModule, 'y');
        } else if (key === 't') {
            rotateModule(selectedModule, 'x');
        }
    }

    // 모듈 회전 함수
    function rotateModule(module, axis = 'y') {
        if (!module || !module.userData || !module.userData.isPlaced) return;

        // 현재 회전 상태 가져오기 (기본값: {x: 0, y: 0, z: 0})
        const currentRotations = moduleRotations.get(module) || {x: 0, y: 0, z: 0};
        const newRotations = {...currentRotations};
        newRotations[axis] = (currentRotations[axis] + 90) % 360; // 90도씩 회전
        
        // 모듈 크기 가져오기
        let moduleWidth = module.geometry.parameters.width;
        let moduleHeight = module.geometry.parameters.height;
        let moduleDepth = module.geometry.parameters.depth;
        
        // Y축과 X축 회전을 순차적으로 적용하여 최종 크기 계산
        // Y축 회전: width와 depth가 바뀔 수 있음
        if (newRotations.y === 90 || newRotations.y === 270) {
            [moduleWidth, moduleDepth] = [moduleDepth, moduleWidth];
        }
        // X축 회전: height와 depth가 바뀔 수 있음
        if (newRotations.x === 90 || newRotations.x === 270) {
            [moduleHeight, moduleDepth] = [moduleDepth, moduleHeight];
        }
        
        // 현재 위치
        const currentPosition = module.position.clone();
        
        // 회전 후 위치 조정을 위한 새로운 위치 계산
        let newPosition = currentPosition.clone();
        
        // 벽면에 붙어있는지 확인하고 위치 조정
        const tolerance = 0.01; // 작은 허용 오차
        
        // 높이 제한 체크 (회전 후 높이가 박스 높이를 넘어가는지 확인)
        if (moduleHeight > boxDimensions.height) {
            console.log('Cannot rotate module - height would exceed box height');
            alert(`Cannot rotate module - height would be ${(moduleHeight * 100).toFixed(0)}cm, but box height is only ${(boxDimensions.height * 100).toFixed(0)}cm`);
            return;
        }
        
        // 가로/세로 제한 체크 (회전 후 가로나 세로가 박스 크기를 넘어가는지 확인)
        if (moduleWidth > boxDimensions.width) {
            console.log('Cannot rotate module - width would exceed box width');
            alert(`Cannot rotate module - width would be ${(moduleWidth * 100).toFixed(0)}cm, but box width is only ${(boxDimensions.width * 100).toFixed(0)}cm`);
            return;
        }
        if (moduleDepth > boxDimensions.depth) {
            console.log('Cannot rotate module - depth would exceed box depth');
            alert(`Cannot rotate module - depth would be ${(moduleDepth * 100).toFixed(0)}cm, but box depth is only ${(boxDimensions.depth * 100).toFixed(0)}cm`);
            return;
        }
        
        // 벽면 스냅핑 - 모듈의 꼭짓점이 벽면에 정확히 닿도록 조정
        const originalWidth = module.geometry.parameters.width;
        const originalHeight = module.geometry.parameters.height;
        const originalDepth = module.geometry.parameters.depth;
        
        // 앞면 벽 (Z = -depth/2)에 붙어있는지 확인
        if (Math.abs(currentPosition.z - (-boxDimensions.depth / 2 + originalDepth / 2)) < tolerance) {
            // 모듈의 뒤쪽 꼭짓점이 앞면 벽에 닿도록 조정
            newPosition.z = -boxDimensions.depth / 2 + moduleDepth / 2;
        }
        // 뒤쪽 벽 (Z = depth/2)에 붙어있는지 확인
        else if (Math.abs(currentPosition.z - (boxDimensions.depth / 2 - originalDepth / 2)) < tolerance) {
            // 모듈의 앞쪽 꼭짓점이 뒤쪽 벽에 닿도록 조정
            newPosition.z = boxDimensions.depth / 2 - moduleDepth / 2;
        }
        
        // 왼쪽 벽 (X = -width/2)에 붙어있는지 확인
        if (Math.abs(currentPosition.x - (-boxDimensions.width / 2 + originalWidth / 2)) < tolerance) {
            // 모듈의 오른쪽 꼭짓점이 왼쪽 벽에 닿도록 조정
            newPosition.x = -boxDimensions.width / 2 + moduleWidth / 2;
        }
        // 오른쪽 벽 (X = width/2)에 붙어있는지 확인
        else if (Math.abs(currentPosition.x - (boxDimensions.width / 2 - originalWidth / 2)) < tolerance) {
            // 모듈의 왼쪽 꼭짓점이 오른쪽 벽에 닿도록 조정
            newPosition.x = boxDimensions.width / 2 - moduleWidth / 2;
        }
        
        // 바닥/천장 스냅핑 - 모듈의 꼭짓점이 바닥/천장에 정확히 닿도록 조정
        // 바닥 (Y = height/2)에 붙어있는지 확인
        if (Math.abs(currentPosition.y - originalHeight / 2) < tolerance) {
            // 모듈의 아래쪽 꼭짓점이 바닥에 닿도록 조정
            newPosition.y = moduleHeight / 2;
        }
        // 천장 (Y = boxHeight - height/2)에 붙어있는지 확인
        else if (Math.abs(currentPosition.y - (boxDimensions.height - originalHeight / 2)) < tolerance) {
            // 모듈의 위쪽 꼭짓점이 천장에 닿도록 조정
            newPosition.y = boxDimensions.height - moduleHeight / 2;
        }
        // 바닥에 있지 않은 경우, 회전 후 높이에 맞게 Y 위치 조정
        else {
            // X축 회전으로 모듈이 눕혀지는 경우
            if (axis === 'x' && (newRotations.x === 90 || newRotations.x === 270)) {
                newPosition.y = moduleHeight / 2;
            }
            // 다른 경우는 기존 로직 유지
            else {
                newPosition.y = Math.max(moduleHeight / 2, currentPosition.y);
            }
        }
        
        // 박스 경계 체크 (조정된 위치로)
        const maxX = (boxDimensions.width / 2) - (moduleWidth / 2);
        const minX = -(boxDimensions.width / 2) + (moduleWidth / 2);
        const maxZ = (boxDimensions.depth / 2) - (moduleDepth / 2);
        const minZ = -(boxDimensions.depth / 2) + (moduleDepth / 2);
        const maxY = boxDimensions.height - (moduleHeight / 2);
        const minY = moduleHeight / 2;
        
        // 벽면에 붙어있지 않은 경우에만 위치 제한 적용
        // 벽면에 붙어있는 경우는 이미 올바른 위치로 설정되었으므로 제한하지 않음
        if (Math.abs(currentPosition.z - (-boxDimensions.depth / 2 + module.geometry.parameters.depth / 2)) >= tolerance &&
            Math.abs(currentPosition.z - (boxDimensions.depth / 2 - module.geometry.parameters.depth / 2)) >= tolerance) {
            newPosition.z = Math.max(minZ, Math.min(maxZ, newPosition.z));
        }
        
        if (Math.abs(currentPosition.x - (-boxDimensions.width / 2 + module.geometry.parameters.width / 2)) >= tolerance &&
            Math.abs(currentPosition.x - (boxDimensions.width / 2 - module.geometry.parameters.width / 2)) >= tolerance) {
            newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x));
        }
        
        if (Math.abs(currentPosition.y - module.geometry.parameters.height / 2) >= tolerance &&
            Math.abs(currentPosition.y - (boxDimensions.height - module.geometry.parameters.height / 2)) >= tolerance) {
            newPosition.y = Math.max(minY, Math.min(maxY, newPosition.y));
        }
        
        // 충돌 체크
        const moduleSize = {
            width: moduleWidth,
            height: moduleHeight,
            depth: moduleDepth
        };
        
        if (canPlaceModuleAt(newPosition, moduleSize, module)) {
            // 회전 상태 저장
            moduleRotations.set(module, newRotations);
            
            // 모듈 회전 적용
            module.rotation.x = (newRotations.x * Math.PI) / 180;
            module.rotation.y = (newRotations.y * Math.PI) / 180;
            module.rotation.z = (newRotations.z * Math.PI) / 180;
            
            // 위치 업데이트
            module.position.copy(newPosition);
            
            // modulePlacements 배열 업데이트
            updateModulePlacement(module.userData.index, newPosition);
            
            console.log(`Module rotated ${axis}-axis to ${newRotations[axis]} degrees and repositioned to:`, newPosition);
        } else {
            console.log('Cannot rotate module - would collide with other modules');
            // 사용자에게 알림
            alert('Cannot rotate module - it would collide with other modules');
        }
    }



    // 모든 모듈의 깜빡임 효과 제거
    function stopAllBlinking() {
        placedModules.forEach(module => {
            removeBlinkingEffect(module);
        });
    }

    // 모듈 깜빡이는 효과 추가 (최근 1개만)
    function addBlinkingEffect(module) {
        // 모든 기존 깜빡임 효과 제거
        stopAllBlinking();
        
        // 기존 깜빡임 효과가 있으면 제거
        if (module.userData.blinkInterval) {
            clearInterval(module.userData.blinkInterval);
        }
        
        let isBright = true;
        
        const blinkInterval = setInterval(() => {
            // 깜빡임 효과 (투명도 변경)
            if (isBright) {
                module.material.opacity = 1.0; // 밝게
                module.material.emissive.setHex(0x444444); // 발광 효과 추가
            } else {
                module.material.opacity = 0.4; // 어둡게
                module.material.emissive.setHex(0x000000); // 발광 효과 제거
            }
            
            isBright = !isBright;
        }, 600); // 0.6초마다 깜빡임
        
        // 모듈에 깜빡임 인터벌 저장
        module.userData.blinkInterval = blinkInterval;
        module.userData.isBlinking = true;
    }

    // 모듈 깜빡이는 효과 제거
    function removeBlinkingEffect(module) {
        if (module.userData.blinkInterval) {
            clearInterval(module.userData.blinkInterval);
            module.userData.blinkInterval = null;
            module.userData.isBlinking = false;
            
            // 원래 상태로 복원
            module.material.opacity = 0.7;
            module.material.emissive.setHex(0x000000);
        }
    }

    // 모듈 제목 업데이트 함수
    function updateModuleTitle() {
        const moduleTitle = document.getElementById('module-title');
        if (moduleTitle) {
            const installedCount = placedModules.length;
            moduleTitle.textContent = `Module Selection (${installedCount}/18)`;
        }
    }

    // 모듈 정보 표시 함수
function showModuleInfo(moduleIndex) {
    console.log('showModuleInfo called, moduleIndex:', moduleIndex);
    
    // 모달이 없으면 생성
    if (!infoModal || !document.body.contains(infoModal)) {
        createInfoModal();
    }
    
    const module = moduleData[moduleIndex];
    if (!module) {
        console.log('Module not found');
        document.getElementById('module-name').textContent = 'Unknown Module';
        infoModal.style.display = 'block';
        return;
    }
    
    console.log('Module info:', module);

    document.getElementById('module-name').textContent = module.displayName || module.name;
    document.getElementById('module-size').textContent = `${(module.width * 100).toFixed(0)}cm × ${(module.height * 100).toFixed(0)}cm × ${(module.depth * 100).toFixed(0)}cm`;
    
    // functions 표시
    let functionsText = '';
    if (module.functions && Array.isArray(module.functions)) {
        functionsText = module.functions.join(', ');
    } else if (module.functions) {
        functionsText = module.functions;
    } else {
        functionsText = 'No function information';
    }
    document.getElementById('module-functions').textContent = functionsText;
    
    // tags 표시
    let tagsText = '';
    if (module.tags && Array.isArray(module.tags)) {
        if (module.tags[0] && typeof module.tags[0] === 'object') {
            // 객체 형태의 태그
            tagsText = module.tags.map(tag => tag.tagName).join(', ');
        } else {
            // 문자열 형태의 태그
            tagsText = module.tags.join(', ');
        }
    } else {
        tagsText = 'No tags';
    }
    document.getElementById('module-tags').textContent = tagsText;

    console.log('Attempting to show modal');
    console.log('infoModal exists:', !!infoModal);
    if (infoModal) {
        infoModal.style.display = 'block';
        console.log('Modal displayed');
    } else {
        console.error('infoModal does not exist!');
    }
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

        // 질문 아이콘 추가
        const questionIcon = document.createElement('div');
        questionIcon.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                ">
                    <img src="static/img/peac.png" alt="Chat Icon" style="width: 40px; height: 40px; object-fit: contain;">
                </div>
                <div style="
                    background: #007bff;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 18px;
                    font-size: 11px;
                    font-weight: bold;
                    white-space: nowrap;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                ">
                    Got questions? Ask Pavo!
                    <div style="
                        position: absolute;
                        top: -4px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 4px solid transparent;
                        border-right: 4px solid transparent;
                        border-bottom: 4px solid #007bff;
                    "></div>
                </div>
            </div>
        `;
        questionIcon.style.cssText = `
            position: absolute;
            top: -85px;
            right: 15px;
            width: auto;
            height: auto;
            background: transparent;
            cursor: pointer;
            z-index: 1001;
        `;
        
        // 호버 효과
        questionIcon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        questionIcon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        // 클릭 이벤트
        questionIcon.addEventListener('click', function() {
            toggleQuestionPanel();
        });

        // 제목과 상태 설명을 같은 줄에 배치
        const headerRow = document.createElement('div');
        headerRow.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 20px;
    `;

        // 제목
        const moduleTitle = document.createElement('h4');
        moduleTitle.id = 'module-title';
        moduleTitle.textContent = 'Module Selection (0/18)';
        moduleTitle.style.cssText = 'margin: 0; color: #333; font-size: 18px;';

        // 상태 설명 영역
        const statusLegend = document.createElement('div');
        statusLegend.style.cssText = `
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 11px;
        color: #666;
        flex-shrink: 0;
    `;
        statusLegend.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            <div style="font-weight: bold; color: #333;">📋 Module Status</div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 2px;"></div>
                <span>Available</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(45deg, #28a745, #20c997); border-radius: 2px;"></div>
                <span>Installed</span>
            </div>
        </div>
    `;

        // 제목과 상태 설명을 헤더 행에 추가
        headerRow.appendChild(moduleTitle);
        headerRow.appendChild(statusLegend);

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
            const moduleInfo = moduleData[i];
            if (!moduleInfo) continue;

            // 모듈 컨테이너 생성 (번호 + 버튼)
            const moduleContainer = document.createElement('div');
            moduleContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            flex-shrink: 0;
        `;

            // 번호 표시
            const numberLabel = document.createElement('div');
            numberLabel.style.cssText = `
            width: 100px;
            height: 20px;
            text-align: center;
            font-weight: bold;
            color: #666;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
            numberLabel.textContent = (i + 1);

            // 모듈 버튼
            const moduleButton = document.createElement('div');
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
            text-align: center;
            padding: 10px;
        `;

            // 모듈 이름 표시 (displayName 우선, 없으면 name 사용)
            const displayText = moduleInfo.displayName || moduleInfo.name;
            
            // / 기준으로 2줄로 나누기
            if (displayText.includes('/')) {
                const parts = displayText.split('/');
                const line1 = parts[0].trim();
                const line2 = parts[1].trim();
                moduleButton.innerHTML = `${line1}<br>${line2}`;
            } else {
                moduleButton.textContent = displayText;
            }

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

            // 클릭 이벤트 (크기 입력 모달 열기 또는 빛나는 효과)
            moduleButton.addEventListener('click', () => {
                // 이미 설치된 모듈이면 빛나는 효과 추가
                if (clickedModules.has(i)) {
                    const installedModule = placedModules.find(m => m.userData && m.userData.index === i);
                    if (installedModule) {
                        addGlowEffect(installedModule);
                    }
                    return;
                }

                // 크기 입력 모달 열기
                openSizeModal(i);
            });

            // 컨테이너에 번호와 버튼 추가
            moduleContainer.appendChild(numberLabel);
            moduleContainer.appendChild(moduleButton);
            moduleGrid.appendChild(moduleContainer);
        }

        moduleArea.appendChild(headerRow);
        moduleArea.appendChild(moduleGrid);
        moduleArea.appendChild(questionIcon);
        document.body.appendChild(moduleArea);

        // 버튼 상태 초기화
        updateModuleButtonStates();
    }

    // 질문 패널 토글 함수
    function toggleQuestionPanel() {
        let questionPanel = document.getElementById('question-panel');
        
        if (questionPanel) {
            // 패널이 이미 있으면 제거
            questionPanel.remove();
        } else {
            // 패널이 없으면 생성
            createQuestionPanel();
        }
    }

    // 고정된 질문 패널 생성 함수
    function createQuestionPanel() {
        const questionPanel = document.createElement('div');
        questionPanel.id = 'question-panel';
        questionPanel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        questionPanel.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            ">
                <h3 style="margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <span>💬</span> Pavo
                </h3>
                <button id="close-question-panel" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 5px 8px;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
            </div>
            
            <!-- 메시지 영역 -->
            <div id="chat-messages" style="
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8f9fa;
                border-left: 1px solid #e9ecef;
                border-right: 1px solid #e9ecef;
                height: 450px;
                display: flex;
                flex-direction: column;
            ">
                <div id="question-responses" style="
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                ">
                    <div id="welcome-message" style="
                        text-align: center;
                        color: #6c757d;
                        font-style: italic;
                        margin: 50px 0;
                padding: 20px;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    ">
                        <div>안녕하세요! 궁금한 것이 있으시면 언제든 물어보세요.</div>
                    </div>
                </div>
            </div>
            
            <!-- 입력 영역 -->
            <div style="
                padding: 20px;
                background: white;
                border-top: 1px solid #e9ecef;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
            ">
                <div style="
                    display: flex;
                    gap: 10px;
                    align-items: flex-end;
                ">
                    <div style="flex: 1; position: relative;">
                        <textarea id="question-input-panel" placeholder="메시지를 입력하세요..." style="
                        width: 100%;
                            min-height: 50px;
                            max-height: 120px;
                            padding: 14px 15px 12px 15px;
                            border: 2px solid #e9ecef;
                            border-radius: 25px;
                        font-size: 14px;
                        font-family: Arial, sans-serif;
                        resize: none;
                        box-sizing: border-box;
                            outline: none;
                            transition: border-color 0.2s;
                            background: #f8f9fa;
                        " onfocus="this.style.borderColor='#667eea'; this.style.background='white'" onblur="this.style.borderColor='#e9ecef'; this.style.background='#f8f9fa'"></textarea>
                </div>
                <button id="submit-question-panel" style="
                        width: 50px;
                        height: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                        border-radius: 50%;
                    cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        transition: all 0.2s;
                        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 10px rgba(102, 126, 234, 0.3)'">
                        <span style="margin-left: 2px;">➤</span>
                    </button>
                </div>
                <div style="
                    margin-top: 8px;
                            text-align: center;
                    color: #6c757d;
                    font-size: 12px;
                ">
                    Enter로 전송 (Shift+Enter로 줄바꿈)
                </div>
            </div>
        `;

        document.body.appendChild(questionPanel);

        // 이벤트 리스너 추가
        document.getElementById('close-question-panel').addEventListener('click', () => {
            questionPanel.remove();
        });

        document.getElementById('submit-question-panel').addEventListener('click', () => {
            const question = document.getElementById('question-input-panel').value.trim();
            if (question) {
                sendQuestionToAPI(question);
                document.getElementById('question-input-panel').value = '';
            } else {
                alert('Please enter a question.');
            }
        });

        // Enter 키로 제출 (Shift+Enter는 줄바꿈)
        document.getElementById('question-input-panel').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const question = document.getElementById('question-input-panel').value.trim();
                if (question) {
                    sendQuestionToAPI(question);
                    document.getElementById('question-input-panel').value = '';
                    // 텍스트 영역 높이 초기화
                    document.getElementById('question-input-panel').style.height = '50px';
                } else {
                    // 빈 메시지일 때는 알림 대신 무시
                }
            }
        });

        // 텍스트 영역 자동 높이 조절
        document.getElementById('question-input-panel').addEventListener('input', function() {
            this.style.height = '50px';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // 입력 필드에 포커스
        document.getElementById('question-input-panel').focus();
    }

    // 질문 입력 모달 생성 함수
    function createQuestionModal() {
        const modal = document.createElement('div');
        modal.id = 'question-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
            ">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">❓ Ask a Question</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Ask questions about habitat layout and design considerations</p>
                
                <div style="margin-bottom: 20px;">
                    <label for="question-input" style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Question:</label>
                    <textarea id="question-input" placeholder="Enter your question here..." style="
                        width: 100%;
                        height: 100px;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: Arial, sans-serif;
                        resize: vertical;
                        box-sizing: border-box;
                    "></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancel-question-btn" style="
                        padding: 10px 20px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button id="submit-question-btn" style="
                        padding: 10px 20px;
                        background: linear-gradient(45deg, #007bff, #0056b3);
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Submit</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트 리스너 추가
        document.getElementById('cancel-question-btn').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('submit-question-btn').addEventListener('click', () => {
            const question = document.getElementById('question-input').value.trim();
            if (question) {
                sendQuestionToAPI(question);
                modal.remove();
            } else {
                alert('Please enter a question.');
            }
        });

        // Enter 키로 제출
        document.getElementById('question-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                const question = document.getElementById('question-input').value.trim();
                if (question) {
                    sendQuestionToAPI(question);
                    modal.remove();
                } else {
                    alert('Please enter a question.');
                }
            }
        });

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 입력 필드에 포커스
        document.getElementById('question-input').focus();
    }

    // 질문을 API로 전송하는 함수
    function sendQuestionToAPI(question) {
        const apiUrl = 'http://192.168.0.221:8080/api/v1/rag/ask'; // LLM API URL
        
        const requestData = {
            question: question,
            mission: environment === 'default' ? 'DEFAULT' : environment.toUpperCase(),
            topK: 3
        };

        console.log('Sending question to API:', requestData);

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Question API response:', data);
            showQuestionResponseInPanel(question, data);
        })
        .catch(error => {
            console.error('Error sending question to API:', error);
            showErrorInPanel(question, error);
        });
    }

    // 질문 응답을 패널에 표시하는 함수
    function showQuestionResponseInPanel(question, data) {
        const responsesContainer = document.getElementById('question-responses');
        if (!responsesContainer) return;

        // 웰컴 메시지 숨기기 (제거하지 않고 숨김으로 레이아웃 안정성 유지)
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // 사용자 메시지 추가
        addUserMessage(question);
        
        // AI 응답 추가 (로딩 상태로 시작)
        const messageId = Date.now();
        addAIMessage(data.response || data.answer || 'No response received.', messageId);

        // 스크롤을 맨 아래로 (부드러운 애니메이션)
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    // 에러를 패널에 표시하는 함수
    function showErrorInPanel(question, error) {
        const responsesContainer = document.getElementById('question-responses');
        if (!responsesContainer) return;

        // 웰컴 메시지 숨기기 (제거하지 않고 숨김으로 레이아웃 안정성 유지)
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // 사용자 메시지 추가
        addUserMessage(question);
        
        // 에러 메시지 추가
        addErrorMessage(error.message || 'An error occurred while processing your request.');

        // 스크롤을 맨 아래로 (부드러운 애니메이션)
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    // 사용자 메시지 추가 함수
    function addUserMessage(message) {
        const responsesContainer = document.getElementById('question-responses');
        if (!responsesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-bottom: 15px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        messageDiv.innerHTML = `
            <div style="
                max-width: 80%;
                padding: 12px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 18px 18px 4px 18px;
                position: relative;
                word-wrap: break-word;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            ">
                <div style="white-space: pre-wrap; line-height: 1.4;">${message}</div>
            </div>
        `;

        responsesContainer.appendChild(messageDiv);
        
        // 메시지 추가 후 스크롤
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }

    // AI 메시지 추가 함수
    function addAIMessage(message, messageId = null) {
        const responsesContainer = document.getElementById('question-responses');
        if (!responsesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            display: flex;
            justify-content: flex-start;
            margin-bottom: 15px;
            animation: slideInLeft 0.3s ease-out;
        `;
        
        if (messageId) {
            messageDiv.id = `ai-message-${messageId}`;
        }
        
        messageDiv.innerHTML = `
            <div style="
                max-width: 80%;
                padding: 12px 16px;
                background: white;
                color: #333;
                border-radius: 18px 18px 18px 4px;
                position: relative;
                word-wrap: break-word;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 1px solid #e9ecef;
            ">
                <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    <span>🦚</span> Pavo
                </div>
                <div style="white-space: pre-wrap; line-height: 1.4;">${message}</div>
            </div>
        `;

        responsesContainer.appendChild(messageDiv);
        
        // 메시지 추가 후 스크롤
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }

    // 에러 메시지 추가 함수
    function addErrorMessage(message) {
        const responsesContainer = document.getElementById('question-responses');
        if (!responsesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            display: flex;
            justify-content: flex-start;
            margin-bottom: 15px;
            animation: slideInLeft 0.3s ease-out;
        `;
        
        messageDiv.innerHTML = `
            <div style="
                max-width: 80%;
                padding: 12px 16px;
                background: #ffebee;
                color: #d32f2f;
                border-radius: 18px 18px 18px 4px;
                position: relative;
                word-wrap: break-word;
                box-shadow: 0 2px 8px rgba(211, 47, 47, 0.2);
                border: 1px solid #ffcdd2;
            ">
                <div style="font-size: 12px; color: #d32f2f; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    <span>❌</span> System Error
                </div>
                <div style="white-space: pre-wrap; line-height: 1.4;">${message}</div>
            </div>
        `;

        responsesContainer.appendChild(messageDiv);
        
        // 메시지 추가 후 스크롤
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }

    // 질문 응답을 표시하는 함수
    function showQuestionResponse(data) {
        const modal = document.createElement('div');
        modal.id = 'question-response-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">💡 AI Response</h2>
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #333;
                ">${data.response || data.answer || 'No response received.'}</div>
                
                <div style="display: flex; justify-content: flex-end;">
                    <button id="close-response-btn" style="
                        padding: 10px 20px;
                        background: linear-gradient(45deg, #007bff, #0056b3);
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 닫기 버튼 이벤트
        document.getElementById('close-response-btn').addEventListener('click', () => {
            modal.remove();
        });

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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

    // 거주지 크기 정보 표시 UI 생성 함수
    function createHabitatInfoDisplay(width, height, depth) {
        // 기존 정보 표시가 있으면 제거
        const existingInfo = document.getElementById('habitat-info-display');
        if (existingInfo) {
            existingInfo.remove();
        }

        // 거주지 크기 정보 표시 영역 생성
        const infoDisplay = document.createElement('div');
        infoDisplay.id = 'habitat-info-display';
        infoDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 18px;
            border-radius: 11px;
            box-shadow: 0 7px 28px rgba(0, 0, 0, 0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            font-weight: bold;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 180px;
        `;

        infoDisplay.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 7px;">
                <span style="font-size: 16px; margin-right: 7px;">🏠</span>
                <span style="font-size: 14px;">Residence Size</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; font-size: 12px;">
                <div style="text-align: center;">
                    <div style="opacity: 0.8; margin-bottom: 2px;">Width</div>
                    <div style="font-size: 13px;">${width}cm</div>
                </div>
                <div style="text-align: center;">
                    <div style="opacity: 0.8; margin-bottom: 2px;">Height</div>
                    <div style="font-size: 13px;">${height}cm</div>
                </div>
                <div style="text-align: center;">
                    <div style="opacity: 0.8; margin-bottom: 2px;">Depth</div>
                    <div style="font-size: 13px;">${depth}cm</div>
                </div>
            </div>
            <div style="margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255, 255, 255, 0.2); text-align: center; font-size: 11px; opacity: 0.9;">
                Volume: ${(width * height * depth / 1000000).toFixed(1)}m³
            </div>
        `;

        document.body.appendChild(infoDisplay);
    }

    // 3D 레이아웃 생성 함수
    function createLayout() {
        if (layoutCreated) return true; // 이미 생성된 경우 중복 생성 방지

        // cm 입력값을 가져오고, 빈 값이면 기본값(200cm) 사용
        const widthCm = parseFloat(document.getElementById('width').value) || 200;
        const heightCm = parseFloat(document.getElementById('height').value) || 200;
        const depthCm = parseFloat(document.getElementById('depth').value) || 200;

        const width = cmToMeters(widthCm);
        const height = cmToMeters(heightCm);
        const depth = cmToMeters(depthCm);

        // 박스 크기 저장
        boxDimensions = { width, height, depth };
        
        // 거주지 정보 저장 (x=width, y=height, z=depth)
        habitatDimensions = { x: width, y: height, z: depth };
        
        // 거주지 정보 출력
        console.log('Habitat Dimensions:', habitatDimensions);

        // 거주지 크기 정보 표시 UI 생성
        createHabitatInfoDisplay(widthCm, heightCm, depthCm);

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

        // 크기 입력 모달 생성
        createSizeModal();

        // 완성 버튼 생성
        createCompleteButton();

        // 평가 모달 생성
        createEvaluationModal();

        // 카메라 위치 자동 조정
        adjustCameraPosition(width, height, depth);

        // 마우스 이벤트 리스너 추가
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        
        // 키보드 이벤트 리스너 추가 (모듈 회전용)
        document.addEventListener('keydown', onKeyDown);

        // 성공적으로 생성되었음을 표시
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
        
        // 성공적으로 생성됨
        return true;
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

// createLayout 함수를 전역으로 노출
window.createLayout = createLayout;

  
} else {
    var warning = WEBGL.getWebGLErrorMessage()
    document.body.appendChild(warning)
}

// 페이지 로드 시 난이도 선택 모달 표시
createDifficultyModal();

