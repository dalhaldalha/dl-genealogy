export interface AgeInfo {
  text: string;
  sub: string;
  isLiving: boolean;
}

/**
 * Calculates a person's age or life span details
 */
export function calculateAge(
  dob: string,
  dod: string | null,
  isDeceased: boolean,
  rawBirthDate?: string | null,
  rawDeathDate?: string | null
): AgeInfo {
  // Extract years from raw dates if provided
  const extractYear = (raw?: string | null) => {
    if (!raw) return null;
    const match = raw.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const hasRawBirth = rawBirthDate && rawBirthDate.trim() !== '';
  // Check if dob is missing or default
  const isDefaultDob = !dob || dob.startsWith('1970-01-01');

  if (hasRawBirth && isDefaultDob) {
    const bYear = extractYear(rawBirthDate);
    
    if (isDeceased || rawDeathDate) {
      const dYear = extractYear(rawDeathDate);
      const text = dYear 
        ? `${rawBirthDate} – ${rawDeathDate}` 
        : `${rawBirthDate} – ?`;
      
      const sub = (bYear && dYear) 
        ? `Approx. ${dYear - bYear} years` 
        : `Deceased`;

      return { text, sub, isLiving: false };
    } else {
      return {
        text: `${rawBirthDate}`,
        sub: bYear ? `Est. born ${bYear}` : 'Age unknown',
        isLiving: true
      };
    }
  }

  const birthDate = new Date(dob);
  const birthYear = birthDate.getFullYear();

  if (isDeceased || dod) {
    const deathDate = dod ? new Date(dod) : new Date();
    const deathYear = deathDate.getFullYear();
    const age = Math.floor((deathDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return {
      text: `${birthYear} – ${deathYear}`,
      sub: `Passed at Age ${age}`,
      isLiving: false
    };
  } else {
    const now = new Date();
    const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return {
      text: `${age} yrs old`,
      sub: `Born ${birthYear}`,
      isLiving: true
    };
  }
}
