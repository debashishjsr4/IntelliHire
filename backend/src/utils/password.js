import crypto from "crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export const createPasswordHash = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return { passwordHash, salt };
};

export const verifyPassword = ({ password, passwordHash, salt }) => {
  const attemptedHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(attemptedHash, "hex"));
};
