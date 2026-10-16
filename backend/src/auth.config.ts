import 'dotenv/config';

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 64) {
  throw new Error('Configura JWT_SECRET con la clave generada.');
}

export const authConfig = {
  secret,
  expiresInSeconds: 60 * 60 * 8,
  issuer: 'farcorners-api',
  audience: 'farcorners-web',
};