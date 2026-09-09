import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LandParcel, FloorDetail, UnitDetail } from '../types';
import { convertCoordsToLocalMeters, getStatusColor } from '../utils/cadastreUtils';
import { 
  Layers, 
  Maximize2, 
  Sun, 
  Moon, 
  Box, 
  Eye, 
  RotateCcw, 
  Sliders, 
  Compass, 
  Building2, 
  MapPin, 
  Sparkles,
  Info,
  ZoomIn,
  ZoomOut,
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Navigation
} from 'lucide-react';

interface ThreePropertyViewerProps {
  parcel: LandParcel;
  viewMode: 'land' | 'vertical' | 'exploded';
  onViewModeChange: (mode: 'land' | 'vertical' | 'exploded') => void;
  selectedFloor: FloorDetail | null;
  selectedUnit: UnitDetail | null;
  onSelectFloor: (floor: FloorDetail | null) => void;
  onSelectUnit: (unit: UnitDetail | null, floor: FloorDetail) => void;
  className?: string;
}

export const ThreePropertyViewer: React.FC<ThreePropertyViewerProps> = ({
  parcel,
  viewMode,
  onViewModeChange,
  selectedFloor,
  selectedUnit,
  onSelectFloor,
  onSelectUnit,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Scene management refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Group refs for dynamic animations
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const parcelGroupRef = useRef<THREE.Group | null>(null);
  const floorMeshesRef = useRef<Map<number, { group: THREE.Group; baseElevation: number; floorData: FloorDetail }>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Interactive local states
  const [explodedGap, setExplodedGap] = useState<number>(3.5);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [lightingMode, setLightingMode] = useState<'day' | 'golden' | 'night'>('day');
  const [hoveredFloorNumber, setHoveredFloorNumber] = useState<number | null>(null);
  const [hoveredUnitNumber, setHoveredUnitNumber] = useState<string | null>(null);
  const [isHoveringMesh, setIsHoveringMesh] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<string>('isometric');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [isLoading3D, setIsLoading3D] = useState<boolean>(true);

  // Digital Twin GIS Layer states matching user photo
  const [layersOpen, setLayersOpen] = useState<boolean>(true);
  const [layerBuildings, setLayerBuildings] = useState<boolean>(true);
  const [layerBoundaries, setLayerBoundaries] = useState<boolean>(true);
  const [layerOwnership, setLayerOwnership] = useState<boolean>(true);
  const [layerRoads, setLayerRoads] = useState<boolean>(true);
  const [layerUtilities, setLayerUtilities] = useState<boolean>(true);
  const [layer3DTiles, setLayer3DTiles] = useState<boolean>(true);
  const [gisViewDimension, setGisViewDimension] = useState<'2D' | '3D'>('3D');

  // Initialize Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'night' ? 0x050914 : lightingMode === 'golden' ? 0x0f172a : 0x0a101d);
    scene.fog = new THREE.FogExp2(lightingMode === 'night' ? 0x050914 : 0x0a101d, 0.0035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(90, 75, 110);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // don't go below ground
    controls.minDistance = 15;
    controls.maxDistance = 500;
    controls.target.set(0, 18, 0);
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, lightingMode === 'night' ? 0.3 : lightingMode === 'golden' ? 0.6 : 0.85);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      lightingMode === 'golden' ? 0xffbb77 : 0xffffff,
      lightingMode === 'night' ? 0.8 : lightingMode === 'golden' ? 1.6 : 1.4
    );
    dirLight.name = 'dirLight';
    dirLight.position.set(120, 150, 90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 100;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Accent blue rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rimLight.position.set(-100, 80, -100);
    scene.add(rimLight);

    // 6. Base Ground Plane & Cadastral Grid
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080e1b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle Cadastral Grid
    const gridHelper = new THREE.GridHelper(400, 80, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 7. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // Smooth floating animation for selection ring
      const time = performance.now() * 0.002;
      scene.traverse((obj) => {
        if (obj.userData?.isFloatingMarker) {
          obj.position.y = obj.userData.initialY + Math.sin(time + obj.userData.offset) * 0.8;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update lighting & scene background when lightingMode changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    scene.background = new THREE.Color(lightingMode === 'night' ? 0x050914 : lightingMode === 'golden' ? 0x0f172a : 0x0a101d);
    scene.fog = new THREE.FogExp2(lightingMode === 'night' ? 0x050914 : 0x0a101d, 0.0035);

    const ambient = scene.getObjectByName('ambientLight') as THREE.AmbientLight;
    const dir = scene.getObjectByName('dirLight') as THREE.DirectionalLight;

    if (ambient) {
      ambient.intensity = lightingMode === 'night' ? 0.35 : lightingMode === 'golden' ? 0.6 : 0.85;
    }
    if (dir) {
      dir.color.setHex(lightingMode === 'golden' ? 0xffbb77 : lightingMode === 'night' ? 0x93c5fd : 0xffffff);
      dir.intensity = lightingMode === 'night' ? 0.8 : lightingMode === 'golden' ? 1.6 : 1.4;
    }
  }, [lightingMode]);

  // Build Geometry for Parcel and Building
  useEffect(() => {
    if (!sceneRef.current) return;
    setIsLoading3D(true);
    const scene = sceneRef.current;

    // Remove existing groups
    if (parcelGroupRef.current) {
      scene.remove(parcelGroupRef.current);
      parcelGroupRef.current = null;
    }
    if (buildingGroupRef.current) {
      scene.remove(buildingGroupRef.current);
      buildingGroupRef.current = null;
    }
    floorMeshesRef.current.clear();

    // 1. Create Parcel Polygon
    const parcelGroup = new THREE.Group();
    parcelGroup.name = 'parcelGroup';
    parcelGroupRef.current = parcelGroup;
    scene.add(parcelGroup);

    // Convert parcel lat/lng to local relative coordinates in meters
    const localCoords = convertCoordsToLocalMeters(parcel.boundaries, parcel.centerCoordinate);

    // Construct 2D shape for extrusion
    const shape = new THREE.Shape();
    localCoords.forEach((pt, idx) => {
      if (idx === 0) shape.moveTo(pt.x, -pt.z);
      else shape.lineTo(pt.x, -pt.z);
    });
    shape.closePath();

    // Extrude parcel boundary slab
    const extrudeSettings = {
      depth: 1.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.3,
      bevelThickness: 0.3,
    };

    const parcelGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate to lie horizontally on XZ plane
    parcelGeometry.rotateX(-Math.PI / 2);

    const parcelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2744,
      roughness: 0.6,
      metalness: 0.2,
      wireframe: wireframeMode,
    });

    const parcelMesh = new THREE.Mesh(parcelGeometry, parcelMaterial);
    parcelMesh.position.y = 0;
    parcelMesh.receiveShadow = true;
    parcelMesh.castShadow = true;
    parcelGroup.add(parcelMesh);

    // Parcel Perimeter Glowing Boundary Line
    const points: THREE.Vector3[] = [];
    localCoords.forEach((pt) => {
      points.push(new THREE.Vector3(pt.x, 1.4, pt.z));
    });
    points.push(new THREE.Vector3(localCoords[0].x, 1.4, localCoords[0].z)); // close loop
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
    });
    const boundaryLine = new THREE.Line(lineGeo, lineMat);
    parcelGroup.add(boundaryLine);

    // Survey Corner Boundary Pillars & Markers
    localCoords.forEach((pt, index) => {
      const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 2.5, 8);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x78350f,
        emissiveIntensity: 0.3,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, 1.5, pt.z);
      pillar.castShadow = true;
      parcelGroup.add(pillar);

      // Coordinate Pin beacon
      const beaconGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(pt.x, 3.2, pt.z);
      beacon.userData = {
        isFloatingMarker: true,
        initialY: 3.2,
        offset: index * 0.7,
      };
      parcelGroup.add(beacon);
    });

    // 2. Create Building & Floors (if building exists)
    if (parcel.building) {
      const bld = parcel.building;
      const buildingGroup = new THREE.Group();
      buildingGroup.name = 'buildingGroup';
      buildingGroupRef.current = buildingGroup;
      scene.add(buildingGroup);

      const bldWidth = bld.footprintWidthMeters;
      const bldLength = bld.footprintLengthMeters;
      const floorH = bld.floorToCeilingHeightMeters;

      bld.floors.forEach((floor, fIdx) => {
        const floorGroup = new THREE.Group();
        floorGroup.name = `floor-${fIdx}`;
        floorGroup.userData = {
          floorNumber: fIdx,
          floorData: floor,
        };

        const baseElev = fIdx * floorH;

        // A. Floor Concrete Slab
        const slabGeo = new THREE.BoxGeometry(bldWidth + 1.2, 0.4, bldLength + 1.2);
        const slabMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.5,
          metalness: 0.3,
          wireframe: wireframeMode,
        });
        const slabMesh = new THREE.Mesh(slabGeo, slabMat);
        slabMesh.position.set(0, 0.2, 0);
        slabMesh.receiveShadow = true;
        slabMesh.castShadow = true;
        floorGroup.add(slabMesh);

        // B. Glass Curtain Walls / Facade
        const glassGeo = new THREE.BoxGeometry(bldWidth, floorH - 0.4, bldLength);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: fIdx >= bld.floors.length - 2 ? 0x38bdf8 : 0x1e3a8a,
          transparent: true,
          opacity: wireframeMode ? 0.3 : 0.42,
          roughness: 0.1,
          metalness: 0.85,
          transmission: 0.6,
          ior: 1.5,
          wireframe: wireframeMode,
        });
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.position.set(0, floorH / 2, 0);
        glassMesh.userData = {
          isFloorBody: true,
          floorNumber: fIdx,
          floorData: floor,
        };
        floorGroup.add(glassMesh);

        // C. Structural Edge Mullions & Columns
        const mullionMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.8,
          roughness: 0.2,
        });
        [-bldWidth / 2, bldWidth / 2].forEach((colX) => {
          [-bldLength / 2, bldLength / 2].forEach((colZ) => {
            const colGeo = new THREE.BoxGeometry(0.8, floorH, 0.8);
            const col = new THREE.Mesh(colGeo, mullionMat);
            col.position.set(colX, floorH / 2, colZ);
            col.castShadow = true;
            floorGroup.add(col);
          });
        });

        // D. Interior Unit Layout Blocks
        if (floor.units && floor.units.length > 0) {
          const unitCount = floor.units.length;
          const unitDepth = (bldLength - 4) / unitCount;

          floor.units.forEach((unit, uIdx) => {
            const statusConfig = getStatusColor(unit.status);
            const unitGeo = new THREE.BoxGeometry(bldWidth - 6, floorH * 0.7, unitDepth - 1);
            const unitMat = new THREE.MeshStandardMaterial({
              color: statusConfig.hex,
              roughness: 0.4,
              metalness: 0.1,
              transparent: true,
              opacity: 0.65,
              wireframe: wireframeMode,
            });

            const unitMesh = new THREE.Mesh(unitGeo, unitMat);
            const unitPosZ = -bldLength / 2 + 2 + uIdx * unitDepth + unitDepth / 2;
            unitMesh.position.set(0, floorH * 0.4, unitPosZ);
            unitMesh.castShadow = true;
            unitMesh.userData = {
              isUnitMesh: true,
              floorData: floor,
              unitData: unit,
              unitId: unit.id,
              floorNumber: fIdx,
            };
            floorGroup.add(unitMesh);
          });
        }

        // Set initial elevation
        floorGroup.position.y = baseElev + 1.2;
        buildingGroup.add(floorGroup);

        floorMeshesRef.current.set(fIdx, {
          group: floorGroup,
          baseElevation: baseElev + 1.2,
          floorData: floor,
        });
      });

      // Rooftop Amenities (Helipad / Sky Lounge deck)
      const topFloorElev = bld.floors.length * floorH + 1.2;
      const roofDeckGeo = new THREE.BoxGeometry(bldWidth * 0.7, 1.2, bldLength * 0.7);
      const roofDeckMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.7,
        roughness: 0.3,
      });
      const roofDeck = new THREE.Mesh(roofDeckGeo, roofDeckMat);
      roofDeck.position.set(0, topFloorElev + 0.6, 0);
      roofDeck.castShadow = true;
      buildingGroup.add(roofDeck);

      // Helipad Ring or Feature
      const ringGeo = new THREE.RingGeometry(5, 6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(0, topFloorElev + 1.3, 0);
      buildingGroup.add(ringMesh);
    }

    // Adjust camera target
    if (controlsRef.current) {
      const bldHeight = (parcel.building?.totalFloors || 8) * (parcel.building?.floorToCeilingHeightMeters || 3.5);
      controlsRef.current.target.set(0, bldHeight * 0.4, 0);
    }

    setTimeout(() => {
      setIsLoading3D(false);
    }, 250);
  }, [parcel, wireframeMode]);

  // Update Floor Vertical Positions based on View Mode (land / vertical / exploded)
  useEffect(() => {
    if (!buildingGroupRef.current) return;

    if (viewMode === 'land') {
      // Hide or ghost building in Land-only Cadastre mode
      buildingGroupRef.current.visible = false;
    } else {
      buildingGroupRef.current.visible = true;

      floorMeshesRef.current.forEach(({ group, baseElevation, floorData }, fIdx) => {
        let targetY = baseElevation;

        if (viewMode === 'exploded') {
          // Explode floors vertically
          targetY = baseElevation + fIdx * (explodedGap * 2.2);
        }

        // Animate position smoothly
        group.position.y = targetY;

        // Highlight selected floor or unit
        const isSelectedFloor = selectedFloor?.floorNumber === fIdx;
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.userData?.isUnitMesh) {
              const isSelectedUnit = selectedUnit?.id === child.userData.unitData?.id;
              if (isSelectedUnit) {
                (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x38bdf8);
                (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
              } else {
                (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
                (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.0;
              }
            } else if (child.userData?.isFloorBody) {
              if (isSelectedFloor) {
                (child.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x1d4ed8);
                (child.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.45;
              } else if (hoveredFloorNumber === fIdx) {
                (child.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x0284c7);
                (child.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.25;
              } else {
                (child.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x000000);
                (child.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0;
              }
            }
          }
        });
      });
    }
  }, [viewMode, explodedGap, selectedFloor, selectedUnit, hoveredFloorNumber]);

  // Raycasting for Click and Hover Selection
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    let foundInteractive = false;
    for (const hit of intersects) {
      const obj = hit.object;
      if (obj.userData?.isUnitMesh) {
        setHoveredUnitNumber(obj.userData.unitData.unitNumber);
        setHoveredFloorNumber(obj.userData.floorNumber);
        foundInteractive = true;
        break;
      } else if (obj.userData?.isFloorBody) {
        setHoveredFloorNumber(obj.userData.floorNumber);
        setHoveredUnitNumber(null);
        foundInteractive = true;
        break;
      }
    }

    setIsHoveringMesh(foundInteractive);
    if (!foundInteractive) {
      setHoveredFloorNumber(null);
      setHoveredUnitNumber(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      const obj = hit.object;
      if (obj.userData?.isUnitMesh) {
        onSelectFloor(obj.userData.floorData);
        onSelectUnit(obj.userData.unitData, obj.userData.floorData);
        return;
      } else if (obj.userData?.isFloorBody) {
        onSelectFloor(obj.userData.floorData);
        onSelectUnit(null, obj.userData.floorData);
        return;
      }
    }
  };

  // Camera Presets
  const applyCameraPreset = (preset: 'isometric' | 'top' | 'street' | 'front') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraPreset(preset);
    const bldHeight = (parcel.building?.totalFloors || 10) * 3.8;

    switch (preset) {
      case 'isometric':
        cameraRef.current.position.set(85, bldHeight * 1.3, 105);
        controlsRef.current.target.set(0, bldHeight * 0.4, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, bldHeight * 3.2, 0.1);
        controlsRef.current.target.set(0, 0, 0);
        break;
      case 'street':
        cameraRef.current.position.set(50, 4, 60);
        controlsRef.current.target.set(0, bldHeight * 0.4, 0);
        break;
      case 'front':
        cameraRef.current.position.set(0, bldHeight * 0.5, 120);
        controlsRef.current.target.set(0, bldHeight * 0.5, 0);
        break;
    }
    controlsRef.current.update();
  };

  // Update visibility based on GIS layers
  useEffect(() => {
    if (buildingGroupRef.current) {
      buildingGroupRef.current.visible = layerBuildings;
    }
    if (parcelGroupRef.current) {
      parcelGroupRef.current.visible = layerBoundaries;
    }
  }, [layerBuildings, layerBoundaries]);

  const handleZoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(0.8);
    controlsRef.current.update();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(1.25);
    controlsRef.current.update();
  };

  const handleGisDimensionSwitch = (dim: '2D' | '3D') => {
    setGisViewDimension(dim);
    if (dim === '2D') {
      applyCameraPreset('top');
      onViewModeChange('land');
    } else {
      applyCameraPreset('isometric');
      onViewModeChange('vertical');
    }
  };

  const resetView = () => {
    applyCameraPreset('isometric');
    setGisViewDimension('3D');
    onSelectFloor(null);
    onSelectUnit(null, null as any);
  };

  return (
    <div
      ref={containerRef}
      id="three-property-viewer-container"
      className={`relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl select-none ${className}`}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        id="three-canvas"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className={`w-full h-full block touch-none ${isHoveringMesh ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {/* Loading overlay */}
      {isLoading3D && (
        <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
          <span className="text-sm font-medium tracking-wide text-slate-300">
            Generating 3D Cadastral & Vertical Spatial Geometry...
          </span>
        </div>
      )}

      {/* Top Left Floating Bar: Parcel ULPIN & Status */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100%-14rem)]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-mono text-slate-400">ULPIN</span>
          <span className="text-xs font-mono font-bold tracking-wider text-amber-300">
            {parcel.ulpin}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {parcel.building && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200">
              {parcel.building.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
              G + {parcel.building.totalFloors - 1}
            </span>
          </div>
        )}
      </div>

      {/* Top Right Controls: Compass, Zoom, Lighting, Wireframe */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-xl backdrop-blur-md shadow-lg">
        {/* Compass N button */}
        <button
          id="btn-compass-n"
          onClick={() => {
            if (cameraRef.current && controlsRef.current) {
              cameraRef.current.position.set(0, 90, 110);
              controlsRef.current.target.set(0, 15, 0);
              controlsRef.current.update();
            }
          }}
          title="Align North"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 text-amber-400 hover:bg-slate-700 transition-colors font-mono font-bold text-xs"
        >
          <span className="flex items-center gap-0.5">
            <Navigation className="w-3 h-3 rotate-45 text-rose-400 fill-rose-400" />
            <span className="text-[10px] font-extrabold text-slate-200">N</span>
          </span>
        </button>

        {/* Zoom In */}
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Lighting Toggle */}
        <button
          id="btn-lighting-toggle"
          onClick={() =>
            setLightingMode((prev) => (prev === 'day' ? 'golden' : prev === 'golden' ? 'night' : 'day'))
          }
          title={`Lighting: ${lightingMode.toUpperCase()}`}
          className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
        >
          {lightingMode === 'night' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : lightingMode === 'golden' ? (
            <Sparkles className="w-4 h-4 text-amber-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-300" />
          )}
        </button>

        {/* Wireframe Toggle */}
        <button
          id="btn-wireframe-toggle"
          onClick={() => setWireframeMode(!wireframeMode)}
          title="Toggle Wireframe Structural Mesh"
          className={`p-2 rounded-lg transition-colors ${
            wireframeMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/80'
          }`}
        >
          <Box className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          id="btn-reset-view"
          onClick={resetView}
          title="Reset Camera View"
          className="p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Left Digital Twin GIS Panel: Layers & Minimap (Matching uploaded photo) */}
      <div className="absolute left-4 top-16 z-20 w-56 flex flex-col gap-2">
        {/* Layers Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-2xl p-3 space-y-2.5 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Layers</span>
            </span>
            <button
              onClick={() => setLayersOpen(!layersOpen)}
              className="text-slate-400 hover:text-slate-200"
            >
              {layersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Layer Checkboxes */}
          {layersOpen && (
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerBuildings}
                  onChange={(e) => setLayerBuildings(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Buildings</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerBoundaries}
                  onChange={(e) => setLayerBoundaries(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Property Boundaries</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerOwnership}
                  onChange={(e) => setLayerOwnership(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Ownership</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerRoads}
                  onChange={(e) => setLayerRoads(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Roads</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerUtilities}
                  onChange={(e) => setLayerUtilities(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Utilities</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layer3DTiles}
                  onChange={(e) => setLayer3DTiles(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>3D Tiles</span>
              </label>

              {/* View Mode: 2D | 3D */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">View Mode:</span>
                <div className="flex rounded-lg bg-slate-800/90 p-0.5 border border-slate-700">
                  <button
                    id="btn-gis-2d"
                    onClick={() => handleGisDimensionSwitch('2D')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                      gisViewDimension === '2D'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2D
                  </button>
                  <button
                    id="btn-gis-3d"
                    onClick={() => handleGisDimensionSwitch('3D')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                      gisViewDimension === '3D'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3D
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2D Inset Minimap (Matching user photo) */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-2xl p-2 space-y-1 text-xs">
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-amber-400" />
              <span>CADASTRAL MINIMAP</span>
            </span>
            <span className="text-amber-400 font-bold">{parcel.surveyNumber}</span>
          </div>

          <div className="relative h-24 w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />

            {/* Cadastral Polygon representation */}
            <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              {/* Surrounding parcel borders */}
              <polygon points="10,20 40,15 45,45 15,50" fill="none" stroke="#e11d48" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
              <polygon points="45,15 85,10 90,40 50,45" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
              <polygon points="15,55 50,50 45,90 10,85" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
              
              {/* Highlighted active parcel */}
              <polygon
                points="30,30 75,25 70,75 25,70"
                fill="rgba(245, 158, 11, 0.15)"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="4" fill="#ef4444" className="animate-ping origin-center" />
              <circle cx="50" cy="50" r="3" fill="#ef4444" />
            </svg>

            {/* Coordinates overlay badge */}
            <div className="absolute bottom-1 right-1 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400">
              {parcel.centerCoordinate.lat.toFixed(3)}°N, {parcel.centerCoordinate.lng.toFixed(3)}°E
            </div>
          </div>
        </div>

        {/* View Mode Selector: Land / Vertical / Exploded */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl backdrop-blur-md shadow-xl">
          <button
            id="btn-view-land"
            onClick={() => onViewModeChange('land')}
            className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-semibold transition-all ${
              viewMode === 'land'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Parcel
          </button>
          <button
            id="btn-view-vertical"
            onClick={() => onViewModeChange('vertical')}
            className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-semibold transition-all ${
              viewMode === 'vertical'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Vertical
          </button>
          <button
            id="btn-view-exploded"
            onClick={() => onViewModeChange('exploded')}
            className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-semibold transition-all ${
              viewMode === 'exploded'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Explode
          </button>
        </div>
      </div>

      {/* Floating 3D Building Highlight Tag (Matching screenshot "Building ID: B-102 | Owner: R. Kumar | Floors: G + 5") */}
      {layerOwnership && (
        <div className="absolute top-20 right-6 z-15 pointer-events-none hidden md:block">
          <div className="bg-slate-950/90 border border-cyan-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md text-left space-y-1 min-w-[170px] animate-fade-in">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Building ID: {parcel.building?.id?.replace('bld-', 'B-').toUpperCase() || 'B-102'}</span>
            </div>
            <div className="text-xs text-slate-200 font-semibold">
              Owner: <span className="text-white font-bold">{parcel.ownerOfRecord}</span>
            </div>
            <div className="text-[11px] text-amber-300 font-mono">
              Floors: <span className="font-bold">G + {parcel.building ? parcel.building.totalFloors - 1 : 5}</span>
            </div>
          </div>
        </div>
      )}

      {/* Exploded Slider Controls (When in Exploded View) */}
      {viewMode === 'exploded' && (
        <div className="absolute bottom-20 left-4 z-20 bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl backdrop-blur-md shadow-xl w-60">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Explosion Offset
            </span>
            <span className="font-mono text-amber-300 text-[11px]">{explodedGap.toFixed(1)} m</span>
          </div>
          <input
            id="input-explosion-slider"
            type="range"
            min="1.0"
            max="7.0"
            step="0.2"
            value={explodedGap}
            onChange={(e) => setExplodedGap(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Compact</span>
            <span>Expanded</span>
          </div>
        </div>
      )}

      {/* Bottom Cadastral Telemetry Ribbon HUD (Exact match to screenshot HUD) */}
      <div className="absolute bottom-3 left-4 right-4 z-20">
        <div className="max-w-4xl mx-auto bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-5 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Survey No */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Survey No:</span>
            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {parcel.surveyNumber}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Owner */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Owner:</span>
            <span className="font-semibold text-white">
              {parcel.ownerOfRecord}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Area */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Area:</span>
            <span className="font-mono font-bold text-emerald-400">
              {parcel.areaSqMeters.toLocaleString()} m²
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Type */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Type:</span>
            <span className="font-semibold capitalize text-sky-300">
              {parcel.classification}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip / Status Display */}
      {(hoveredFloorNumber !== null || hoveredUnitNumber !== null) && (
        <div className="absolute bottom-16 right-4 z-20 bg-slate-900/95 border border-amber-500/40 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-2xl pointer-events-none flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-100">
              {hoveredUnitNumber ? `Unit ${hoveredUnitNumber}` : `Floor ${hoveredFloorNumber}`}
            </div>
            <div className="text-[11px] text-slate-400">
              Click to inspect floor specs & unit plans
            </div>
          </div>
        </div>
      )}

      {/* Help / Instructions Pill */}
      <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 z-10 items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 pointer-events-none">
        <Info className="w-3 h-3 text-slate-400" />
        <span>Rotate: Left Click + Drag | Pan: Right Click | Zoom: Scroll | Click floors to inspect</span>
      </div>
    </div>
  );
};
