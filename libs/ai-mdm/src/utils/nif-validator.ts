// Spanish NIF/CIF/NIE Validator
// Compliant with Spanish tax authority format

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_CHARS = 'JABCDEFGHI';

export function validateNIF(nif: string): boolean {
  if (!nif) return false;
  
  const normalized = nif.toUpperCase().replace(/[\s-]/g, '');
  
  // Check format: 8 digits + 1 letter
  if (!/^\d{8}[A-Z]$/.test(normalized)) return false;
  
  const number = parseInt(normalized.substring(0, 8), 10);
  const letter = normalized.charAt(8);
  const expectedLetter = NIF_LETTERS.charAt(number % 23);
  
  return letter === expectedLetter;
}

export function validateNIE(nie: string): boolean {
  if (!nie) return false;
  
  const normalized = nie.toUpperCase().replace(/[\s-]/g, '');
  
  // Check format: X/Y/Z + 7 digits + 1 letter
  if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) return false;
  
  // Convert first letter to number
  const firstChar = normalized.charAt(0);
  const prefix = { 'X': '0', 'Y': '1', 'Z': '2' }[firstChar] || '0';
  
  const number = parseInt(prefix + normalized.substring(1, 8), 10);
  const letter = normalized.charAt(8);
  const expectedLetter = NIF_LETTERS.charAt(number % 23);
  
  return letter === expectedLetter;
}

export function validateCIF(cif: string): boolean {
  if (!cif) return false;
  
  const normalized = cif.toUpperCase().replace(/[\s-]/g, '');
  
  // Check format: 1 letter + 7 digits + 1 control char
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[A-J0-9]$/.test(normalized)) return false;
  
  const orgType = normalized.charAt(0);
  const digits = normalized.substring(1, 8);
  const control = normalized.charAt(8);
  
  // Calculate control digit
  let sumEven = 0;
  let sumOdd = 0;
  
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(digits.charAt(i), 10);
    if (i % 2 === 0) {
      // Odd position (0-indexed): multiply by 2
      const doubled = digit * 2;
      sumOdd += doubled > 9 ? doubled - 9 : doubled;
    } else {
      // Even position
      sumEven += digit;
    }
  }
  
  const total = sumEven + sumOdd;
  const controlDigit = (10 - (total % 10)) % 10;
  
  // Some org types use letter, others use digit
  const letterControl = CIF_CONTROL_CHARS.charAt(controlDigit);
  const digitControl = controlDigit.toString();
  
  if ('KPQS'.includes(orgType)) {
    return control === letterControl;
  } else if ('ABEH'.includes(orgType)) {
    return control === digitControl;
  } else {
    return control === letterControl || control === digitControl;
  }
}

export function validateSpanishId(id: string): { valid: boolean; type: 'NIF' | 'NIE' | 'CIF' | null } {
  if (validateNIF(id)) return { valid: true, type: 'NIF' };
  if (validateNIE(id)) return { valid: true, type: 'NIE' };
  if (validateCIF(id)) return { valid: true, type: 'CIF' };
  return { valid: false, type: null };
}

export function formatNIF(nif: string): string {
  const normalized = nif.toUpperCase().replace(/[\s-]/g, '');
  if (normalized.length === 9) {
    return normalized.substring(0, 8) + '-' + normalized.substring(8);
  }
  return normalized;
}
