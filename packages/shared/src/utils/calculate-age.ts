import { AgeInfo } from '../types/entities';

export function calculateAge(dob: string, dod: string | null, isDeceased: boolean): AgeInfo {
  const birthDate = new Date(dob);
  const birthYear = birthDate.getFullYear();
  
  if (isDeceased && dod) {
    const deathDate = new Date(dod);
    const deathYear = deathDate.getFullYear();
    const age = Math.floor((deathDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    return {
      text: `${birthYear} – ${deathYear}`,
      sub: `Passed at Age ${age}`,
      isLiving: false
    };
  }
  
  const currentDate = new Date();
  const age = Math.floor((currentDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  return {
    text: `${age} yrs old`,
    sub: `Born ${birthYear}`,
    isLiving: true
  };
}
