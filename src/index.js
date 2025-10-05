import * as THREE from 'three'
import { WEBGL } from './webgl'


if (WEBGL.isWebGLAvailable()) {
  // 여기다 코드
  console.log(THREE);
  
} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
