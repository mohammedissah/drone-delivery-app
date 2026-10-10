import React, { useEffect, useRef } from 'react';

/**
 * High-precision Aerospace Attitude Indicator (Artificial Horizon)
 * Visualizes pitch & roll in real time using HTML5 Canvas
 */
export default function AttitudeIndicator({ pitch = 0, roll = 0, heading = 0, altitude = 0, speed = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 4;

    // Clear
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Clip to circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Background (Sky / Ground)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((roll * Math.PI) / 180);

    // Pitch shift: 1 degree = ~2.2 pixels
    const pitchOffset = pitch * 2.2;
    ctx.translate(0, pitchOffset);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, -centerY * 2, 0, 0);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-width, -height * 2, width * 2, height * 2);

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, 0, 0, centerY * 2);
    groundGrad.addColorStop(0, '#78350f');
    groundGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-width, 0, width * 2, height * 2);

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(-width, 0);
    ctx.lineTo(width, 0);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pitch ladders (±10°, ±20°, ±30°)
    for (let deg = -30; deg <= 30; deg += 10) {
      if (deg === 0) continue;
      const y = -deg * 2.2;
      const ladderWidth = deg % 20 === 0 ? 36 : 22;

      ctx.beginPath();
      ctx.moveTo(-ladderWidth, y);
      ctx.lineTo(ladderWidth, y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.stroke();

      // Pitch degree number
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(Math.abs(deg).toString(), -ladderWidth - 4, y + 3);
      ctx.textAlign = 'left';
      ctx.fillText(Math.abs(deg).toString(), ladderWidth + 4, y + 3);
    }

    ctx.restore();

    // Aircraft Reticle / Bore sight (Fixed in center)
    ctx.beginPath();
    // Left wing
    ctx.moveTo(centerX - 35, centerY);
    ctx.lineTo(centerX - 12, centerY);
    ctx.lineTo(centerX - 12, centerY + 6);
    // Center pip
    ctx.moveTo(centerX - 3, centerY);
    ctx.lineTo(centerX + 3, centerY);
    // Right wing
    ctx.moveTo(centerX + 12, centerY + 6);
    ctx.lineTo(centerX + 12, centerY);
    ctx.lineTo(centerX + 35, centerY);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2fe';
    ctx.fill();

    // Roll scale arc (top)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Roll angle indicator marks
    [-45, -30, -20, -10, 0, 10, 20, 30, 45].forEach(deg => {
      const rad = ((deg - 90) * Math.PI) / 180;
      const inner = radius - 14;
      const outer = radius - 6;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(rad) * inner, centerY + Math.sin(rad) * inner);
      ctx.lineTo(centerX + Math.cos(rad) * outer, centerY + Math.sin(rad) * outer);
      ctx.strokeStyle = deg === 0 ? '#00f2fe' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = deg === 0 ? 2.5 : 1.5;
      ctx.stroke();
    });

    ctx.restore();

    // Outer bezel ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.stroke();
  }, [pitch, roll]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          className="hud-canvas"
          style={{ borderRadius: '50%', background: '#0a0f18' }}
        />
        {/* Subtle crosshair grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          pointerEvents: 'none'
        }} />
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)'
      }}>
        <span>PITCH: <strong style={{ color: '#38bdf8' }}>{pitch.toFixed(1)}°</strong></span>
        <span>ROLL: <strong style={{ color: '#38bdf8' }}>{roll.toFixed(1)}°</strong></span>
        <span>HDG: <strong style={{ color: '#00f2fe' }}>{heading.toFixed(0)}°</strong></span>
      </div>
    </div>
  );
}
