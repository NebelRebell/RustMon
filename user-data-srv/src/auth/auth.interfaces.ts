export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
