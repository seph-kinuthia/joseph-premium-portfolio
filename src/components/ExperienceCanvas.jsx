import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Environment, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const modelUrl = `${import.meta.env.BASE_URL}models/joseph-avatar.glb`;

function useScrollProgress() {
  const progress = useRef(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

function CameraRig({ reducedMotion, activeLab, interactionRef }) {
  const { camera } = useThree();
  const scroll = useScrollProgress();

  useFrame((_, delta) => {
    const eased = reducedMotion ? 0 : scroll.current;
    const interaction = interactionRef?.current ?? { x: 0, y: 0, active: 0 };
    const active = reducedMotion ? 0 : interaction.active;
    const targetX = interaction.x * active * 0.08 + activeLab * 0.08;
    const targetY = 0.16 + interaction.y * active * 0.04 - eased * 0.18;
    const targetZ = 5.2 - eased * 0.7;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.4, delta);
    camera.lookAt(0, 0.05 - eased * 0.4, 0);
  });

  return null;
}

function Avatar({ reducedMotion, interactionRef }) {
  const group = useRef();
  const { scene } = useGLTF(modelUrl);
  const scroll = useScrollProgress();

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 0.85;
        child.material.roughness = Math.min(child.material.roughness ?? 0.7, 0.82);
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const progress = reducedMotion ? 0 : scroll.current;
    const width = window.innerWidth;
    const isMobile = width < 760;
    const isTablet = width < 1024;
    const interaction = interactionRef?.current ?? { x: 0, y: 0, active: 0, near: 0 };
    const active = reducedMotion || isMobile ? 0 : interaction.active;
    const idle = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.55);
    const baseX = isMobile ? 0.32 : 0.55 + progress * 0.35;
    const baseY = isMobile ? -0.42 : -0.04;
    const motionScale = isTablet ? 0.62 : 1;
    const targetX = baseX + interaction.x * active * 0.18 * motionScale;
    const targetY = baseY + interaction.y * active * 0.1 * motionScale + idle * 0.018;
    const targetRotY = -0.08 + interaction.x * active * 0.087 * motionScale + progress * 0.035 + idle * 0.008;
    const targetRotX = interaction.y * active * -0.052 * motionScale + idle * 0.004;
    const targetScale = (isMobile ? 1.25 : 2.15) * (1 + progress * 0.08 + interaction.near * 0.025);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 3.4, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 3, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetRotY, 3.1, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetRotX, 3, delta);
    const nextScale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 2.8, delta);
    group.current.scale.setScalar(nextScale);
  });

  return (
    <Float speed={reducedMotion ? 0 : 0.72} floatIntensity={reducedMotion ? 0 : 0.18} rotationIntensity={0.12}>
      <group ref={group} scale={window.innerWidth < 760 ? 1.25 : 2.15}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>
    </Float>
  );
}

function Particles({ reducedMotion }) {
  const points = useRef();
  const positions = useMemo(() => {
    const count = window.innerWidth < 760 ? 90 : 180;
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      values[i * 3] = (Math.random() - 0.5) * 8;
      values[i * 3 + 1] = (Math.random() - 0.5) * 5;
      values[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    return values;
  }, []);

  useFrame((state) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.018;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.018;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#f6eee7" transparent opacity={0.35} />
    </points>
  );
}

function Lighting({ activeLab, reducedMotion, interactionRef }) {
  const key = useRef();
  const rim = useRef();
  const red = activeLab % 2 === 0 ? '#ff263d' : '#ff4a32';

  useFrame((_, delta) => {
    if (!key.current || !rim.current) return;
    const interaction = interactionRef?.current ?? { x: 0, y: 0, active: 0, near: 0 };
    const active = reducedMotion ? 0 : interaction.active;
    key.current.position.x = THREE.MathUtils.damp(key.current.position.x, -2.4 + interaction.x * active * 1.1, 2.8, delta);
    key.current.position.y = THREE.MathUtils.damp(key.current.position.y, 3.7 - interaction.y * active * 0.55, 2.8, delta);
    key.current.intensity = THREE.MathUtils.damp(key.current.intensity, 1.15 + interaction.near * 0.18, 3, delta);
    rim.current.position.x = THREE.MathUtils.damp(rim.current.position.x, 3 + interaction.x * active * 0.6, 2.8, delta);
    rim.current.intensity = THREE.MathUtils.damp(rim.current.intensity, 1.35 + interaction.near * 0.28, 3, delta);
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight ref={key} position={[-3, 4, 4]} intensity={1.15} color="#fff7ee" castShadow />
      <spotLight ref={rim} position={[3, 2.5, 2.5]} intensity={1.35} angle={0.38} penumbra={0.7} color={red} />
      <pointLight position={[-2.4, -1.2, 1.2]} intensity={0.9} color="#ffffff" />
    </>
  );
}

function SceneFallback() {
  return (
    <mesh position={[1.2, -0.1, 0]}>
      <icosahedronGeometry args={[1.2, 2]} />
      <meshStandardMaterial color="#161616" roughness={0.7} metalness={0.25} />
    </mesh>
  );
}

export function ExperienceCanvas({ reducedMotion, activeLab, interactionRef }) {
  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.2, 5.2], fov: 36 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 4.5, 9]} />
        <Lighting activeLab={activeLab} reducedMotion={reducedMotion} interactionRef={interactionRef} />
        <Suspense fallback={<SceneFallback />}>
          <Avatar reducedMotion={reducedMotion} interactionRef={interactionRef} />
          <Environment preset="night" />
        </Suspense>
        <CameraRig reducedMotion={reducedMotion} activeLab={activeLab} interactionRef={interactionRef} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(modelUrl);
