/** Scalar fields that are safe to return on User relations. Never include passwordHash. */
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  verified: true,
  image: true,
  createdAt: true,
} as const;
