import { createHash } from 'crypto';

/**
 * Generate a DID (Decentralized Identifier) for Halal Chain
 * Format: did:halal:<type>:<unique-hash>
 *
 * @param type - The entity type (user, charity, asset, bond)
 * @param walletAddress - The XRPL wallet address to derive the DID from
 * @returns The generated DID string
 */
export function generateDID(type: 'user' | 'charity' | 'asset' | 'bond', walletAddress: string): string {
  // Create a hash from the wallet address for uniqueness
  const hash = createHash('sha256')
    .update(walletAddress)
    .digest('hex')
    .substring(0, 16); // Take first 16 chars for readability

  return `did:halal:${type}:${hash}`;
}

/**
 * Parse a DID to extract its components
 * @param did - The DID string to parse
 * @returns Object with method, type, and identifier
 */
export function parseDID(did: string): { method: string; type: string; identifier: string } | null {
  const parts = did.split(':');
  if (parts.length !== 4 || parts[0] !== 'did' || parts[1] !== 'halal') {
    return null;
  }
  return {
    method: parts[1],
    type: parts[2],
    identifier: parts[3],
  };
}

/**
 * Validate a DID format
 * @param did - The DID string to validate
 * @returns Boolean indicating if the DID is valid
 */
export function isValidDID(did: string): boolean {
  const parsed = parseDID(did);
  if (!parsed) return false;

  const validTypes = ['user', 'charity', 'asset', 'bond'];
  return validTypes.includes(parsed.type) && parsed.identifier.length === 16;
}
