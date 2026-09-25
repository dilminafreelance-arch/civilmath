/**
 * Shareable calculation URL utilities for CivilMath.
 * Encodes input state into URL search params so any calculation can be shared via link.
 */

export function encodeCalculationToUrl(
  inputs: Record<string, any>,
  unitSystem: string,
  extraParams?: Record<string, string | number>
): string {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();

  params.set('unit', unitSystem);

  // Encode simple primitive inputs
  Object.entries(inputs).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
        params.set(key, String(val));
      }
    }
  });

  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      params.set(k, String(v));
    });
  }

  url.search = params.toString();
  return url.toString();
}

export function parseCalculationFromUrl(): {
  inputs: Record<string, any>;
  unitSystem?: 'metric' | 'imperial';
} | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return null;

  const inputs: Record<string, any> = {};
  let unitSystem: 'metric' | 'imperial' | undefined = undefined;

  params.forEach((value, key) => {
    if (key === 'unit') {
      if (value === 'metric' || value === 'imperial') {
        unitSystem = value;
      }
      return;
    }

    // Try parsing as number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      inputs[key] = num;
    } else if (value === 'true') {
      inputs[key] = true;
    } else if (value === 'false') {
      inputs[key] = false;
    } else {
      inputs[key] = value;
    }
  });

  return { inputs, unitSystem };
}

export async function copyShareLinkToClipboard(url?: string): Promise<boolean> {
  const targetUrl = url || window.location.href;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(targetUrl);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = targetUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
