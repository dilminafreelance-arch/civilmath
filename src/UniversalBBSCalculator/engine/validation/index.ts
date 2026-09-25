import { ValidationResult, ValidationRule, StandardFormulas, DesignStandard } from '../types';
import { getStandard } from '../standards';

export function validateReinforcement(
  params: {
    elementType: string;
    width: number;
    depth: number;
    length: number;
    cover: number;
    barDia: number;
    barCount: number;
    spacing: number;
    isMetric: boolean;
  },
  standard: DesignStandard
): ValidationResult {
  const code = getStandard(standard);
  const errors: ValidationRule[] = [];
  const warnings: ValidationRule[] = [];
  const m = params.isMetric ? 1 : 25.4;
  const mm = (v: number) => params.isMetric ? v : v * 25.4;

  // 1. Negative dimensions
  if (params.width <= 0) {
    errors.push({
      field: 'width', label: 'Width', severity: 'error',
      message: 'Width must be greater than zero',
      limit: '> 0', actual: String(params.width), condition: 'width < 0'
    });
  }
  if (params.depth <= 0) {
    errors.push({
      field: 'depth', label: 'Depth', severity: 'error',
      message: 'Depth must be greater than zero',
      limit: '> 0', actual: String(params.depth), condition: 'depth < 0'
    });
  }
  if (params.length <= 0) {
    errors.push({
      field: 'length', label: 'Length', severity: 'error',
      message: 'Length must be greater than zero',
      limit: '> 0', actual: String(params.length), condition: 'length < 0'
    });
  }

  // 2. Cover check
  const minCv = code.minCover('moderate', params.elementType);
  if (params.cover < minCv) {
    errors.push({
      field: 'cover', label: 'Cover', severity: 'error',
      message: `Cover (${params.cover}mm) is less than minimum required (${minCv}mm) for this code`,
      limit: `≥ ${minCv} mm`, actual: `${params.cover} mm`, condition: `cover < ${minCv}`
    });
  }
  if (params.cover > 100) {
    warnings.push({
      field: 'cover', label: 'Cover', severity: 'warning',
      message: 'Excessive cover may require mesh reinforcement',
      limit: '≤ 100 mm', actual: `${params.cover} mm`, condition: `cover > 100`
    });
  }

  // 3. Bar spacing checks
  const aggSize = 20;
  const minSp = code.minBarSpacing(params.barDia, aggSize);
  if (params.spacing > 0 && params.spacing < minSp) {
    errors.push({
      field: 'spacing', label: 'Spacing', severity: 'error',
      message: `Spacing (${params.spacing}mm) is less than minimum (${minSp}mm)`,
      limit: `≥ ${minSp} mm`, actual: `${params.spacing} mm`, condition: `spacing < ${minSp}`
    });
  }

  const maxSp = code.maxSpacing(params.elementType, true);
  if (params.spacing > maxSp) {
    warnings.push({
      field: 'spacing', label: 'Spacing', severity: 'warning',
      message: `Spacing (${params.spacing}mm) exceeds maximum (${maxSp}mm)`,
      limit: `≤ ${maxSp} mm`, actual: `${params.spacing} mm`, condition: `spacing > ${maxSp}`
    });
  }

  // 4. Bar count / congestion check
  const clearDim = params.depth - 2 * params.cover / m;
  const barsPerLayer = params.barCount;
  const requiredWidth = barsPerLayer * mm(params.barDia) + (barsPerLayer - 1) * minSp + 2 * params.cover;
  const availableWidth = mm(params.width);
  if (requiredWidth > availableWidth && availableWidth > 0) {
    errors.push({
      field: 'barCount', label: 'Bar Count', severity: 'error',
      message: 'Too many bars — congestion detected',
      limit: `${Math.floor((availableWidth - 2 * params.cover + minSp) / (mm(params.barDia) + minSp))} bars`,
      actual: `${params.barCount} bars`, condition: `required ${requiredWidth.toFixed(0)}mm > available ${availableWidth.toFixed(0)}mm`
    });
  }

  // 5. Minimum reinforcement ratio
  const As = params.barCount * Math.PI * params.barDia * params.barDia / 4;
  const Ag = params.depth * params.width;
  const rho = Ag > 0 ? As / (Ag * m * m) : 0;
  const rhoMin = code.minReinfRatio(params.elementType);
  if (rho < rhoMin && rho > 0) {
    warnings.push({
      field: 'barCount', label: 'Reinforcement Ratio', severity: 'warning',
      message: `Reinforcement ratio ρ=${(rho * 100).toFixed(3)}% is below minimum ${(rhoMin * 100).toFixed(2)}%`,
      limit: `≥ ${(rhoMin * 100).toFixed(2)}%`, actual: `${(rho * 100).toFixed(3)}%`, condition: `ρ < ρ_min`
    });
  }

  // 6. Maximum reinforcement ratio
  const rhoMax = code.maxReinfRatio(params.elementType);
  if (rho > rhoMax) {
    errors.push({
      field: 'barCount', label: 'Reinforcement Ratio', severity: 'error',
      message: `Reinforcement ratio ρ=${(rho * 100).toFixed(2)}% exceeds maximum ${(rhoMax * 100).toFixed(1)}%`,
      limit: `≤ ${(rhoMax * 100).toFixed(1)}%`, actual: `${(rho * 100).toFixed(2)}%`, condition: `ρ > ρ_max`
    });
  }

  // 7. Clear spacing violation
  if (params.barCount > 1 && params.width > 0) {
    const clearSpacing = (mm(params.width) - 2 * params.cover - params.barCount * mm(params.barDia)) / (params.barCount - 1);
    if (clearSpacing < mm(params.barDia) && clearSpacing > 0) {
      warnings.push({
        field: 'spacing', label: 'Clear Spacing', severity: 'warning',
        message: `Clear spacing (${clearSpacing.toFixed(1)}mm) is less than bar diameter (${mm(params.barDia).toFixed(1)}mm)`,
        limit: `≥ ${mm(params.barDia).toFixed(1)} mm`, actual: `${clearSpacing.toFixed(1)} mm`, condition: `clear spacing < bar dia`
      });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}
