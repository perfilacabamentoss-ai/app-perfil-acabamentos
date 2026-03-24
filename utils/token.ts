
export const generateCollaboratorToken = (collabId: string) => {
  // TOTP-like token that changes every 30 seconds
  const timeStep = Math.floor(Date.now() / 30000);
  const seed = `${collabId}-${timeStep}-perfil-secret-2024`;
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Ensure it's a positive 6-digit number
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};

export const getRemainingTokenTime = () => {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
};
