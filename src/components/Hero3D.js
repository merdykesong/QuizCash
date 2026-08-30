"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Hero3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Forme principale : icosaèdre façon "dé à facettes"
    const geometry = new THREE.IcosahedronGeometry(1.6, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.4,
      roughness: 0.25,
      flatShading: true,
    });
    const shape = new THREE.Mesh(geometry, material);
    scene.add(shape);

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.5 })
    );
    shape.add(wireframe);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    const light2 = new THREE.AmbientLight(0x818cf8, 0.6);
    scene.add(light2);

    let animationId;
    function animate() {
      shape.rotation.x += 0.004;
      shape.rotation.y += 0.006;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80"
    />
  );
}
