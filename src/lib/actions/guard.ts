import "server-only";
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autenticato");
  }
  return session;
}
