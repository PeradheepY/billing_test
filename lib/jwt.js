import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.NEXT_PUBLIC_JWT_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('JWT secret key is not defined in environment variables');
}

const encodedSecretKey = new TextEncoder().encode(SECRET_KEY);

 export const createToken = async (payload) => {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(encodedSecretKey);
    return token;
  } catch (error) {
    console.error('JWT creation error:', error);
    return null;
  }
}; 

export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, encodedSecretKey);
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};