/**
 * seatScore.js — Pure view-quality scorer
 * Extracted UNCHANGED from CINEMAVIEW 3D calculateSeatViewScore()
 * No THREE.js dependency — uses plain math.
 *
 * @param {{ x: number, y: number, z: number }} eyePos - seat eye position
 * @param {{ screenCenter: {x,y,z}, scoring: {idealDistance,distancePenaltyFactor,anglePenaltyFactor} }} config
 * @returns {{ finalScore, tierName, tierHex, distanceScore, angleScore, horizontalAngleDeg, distanceToScreenCenter, finalPrice }}
 */
export function calculateSeatViewScore(eyePos, config) {
  const sc = config.screenCenter;

  const dx = eyePos.x - sc.x;
  const dy = eyePos.y - sc.y;
  const dz = eyePos.z - sc.z;
  const distanceToScreenCenter = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distanceDiff = Math.abs(distanceToScreenCenter - config.scoring.idealDistance);
  const distanceScore = Math.max(0, Math.min(100, 100 - distanceDiff * config.scoring.distancePenaltyFactor));

  const horizontalAngleRad = Math.atan2(dx, dz);
  const horizontalAngleDeg = Math.abs(horizontalAngleRad * (180 / Math.PI));
  const angleScore = Math.max(0, Math.min(100, 100 - horizontalAngleDeg * config.scoring.anglePenaltyFactor));

  const rawScore = distanceScore * 0.5 + angleScore * 0.5;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let tierHex, tierName;
  if (finalScore >= 80) {
    tierHex = '#2ecc71';
    tierName = 'Prime Center View';
  } else if (finalScore >= 55) {
    tierHex = '#f1c40f';
    tierName = 'Standard View';
  } else {
    tierHex = '#e74c3c';
    tierName = 'Side-Wing View';
  }

  return {
    distanceScore: Math.round(distanceScore),
    angleScore: Math.round(angleScore),
    horizontalAngleDeg: Math.round(horizontalAngleDeg * 10) / 10,
    distanceToScreenCenter: Math.round(distanceToScreenCenter * 10) / 10,
    finalScore,
    tierName,
    tierHex,
  };
}

/**
 * Compute the eye position for a given seat in the layout.
 * @param {number} rowIndex - 0-based row index
 * @param {number} seatCol - 0-based seat column index
 * @param {object} layout - auditorium layout from auditoriums.json
 * @returns {{ x: number, y: number, z: number }}
 */
export function getSeatEyePosition(rowIndex, seatCol, layout) {
  const rowZ = layout.rowZStart + rowIndex * layout.rowDepth;
  const rowY = rowIndex * layout.rowRise + 0.06;
  const rowFanFactor = 1.0 + (rowIndex / (layout.rows - 1)) * 0.04;
  const baseX = layout.seatXOffsets[seatCol] * rowFanFactor;
  const radialCurve = Math.pow(baseX / 7.0, 2) * 0.15;
  return {
    x: baseX,
    y: rowY + 1.15,
    z: rowZ + radialCurve - 0.05,
  };
}

/**
 * Build a complete seat map for the auditorium.
 * @param {object} layout - auditorium layout from auditoriums.json
 * @returns {Map<string, object>} seatId → { seatId, row, col, rowName, seatNum, blockName, eyePos, score }
 */
export function buildSeatMap(layout) {
  const map = new Map();
  for (let r = 0; r < layout.rows; r++) {
    for (let s = 0; s < layout.seatsPerRow; s++) {
      const seatId = `${layout.rowLetters[r]}${s + 1}`;
      const eyePos = getSeatEyePosition(r, s, layout);
      const score = calculateSeatViewScore(eyePos, layout);

      let blockName = 'Center Block';
      for (const block of layout.blocks) {
        if (s >= block.start && s <= block.end) {
          blockName = block.name;
          break;
        }
      }

      map.set(seatId, {
        seatId,
        row: r,
        col: s,
        rowName: `Row ${layout.rowLetters[r]}`,
        seatNum: s + 1,
        blockName,
        eyePos,
        score,
      });
    }
  }
  return map;
}
