import bcrypt from 'bcryptjs';

/**
 * Generates a bcrypt hash for a given password.
 * Uses the BCRYPT_ROUNDS environment variable for the salt rounds, defaulting to 10.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function generatePasswordHash(password: string): Promise<string> {
  const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS, 10) : 10;
  if (isNaN(saltRounds)) {
    throw new Error("BCRYPT_ROUNDS environment variable must be an integer.");
  }
  
  console.log(`Hashing password with ${saltRounds} salt rounds.`);
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}