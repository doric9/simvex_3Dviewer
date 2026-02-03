import { Physics } from '@react-three/cannon';
import { ReactNode } from 'react';

interface PhysicsWrapperProps {
  children: ReactNode;
  debug?: boolean;
}

export default function PhysicsWrapper({ children }: PhysicsWrapperProps) {
  // debug prop is currently unused but kept for interface compatibility
  // UseCannon Physics provider usually takes no props for debug visualizer unless standard-cannon-debug is used.
  // We'll just ignore it for now.
  return (
    <Physics
      gravity={[0, -9.81, 0]}
      defaultContactMaterial={{
        contactEquationStiffness: 1e6,
        contactEquationRelaxation: 3,
        friction: 0.1,
        restitution: 0.7, // Bouncy
      }}
      isPaused={false}
    >
      {children}
    </Physics>
  );
}
