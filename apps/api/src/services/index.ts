import { prisma } from "../prisma/client";

export class Service {
  public static async getDatabaseInfo(): Promise<{ userCount: number; sampleUser: any }> {
    try {
      const userCount = await prisma.users.count();
      const sampleUser = await prisma.users.findFirst();
      
      if (!sampleUser) return { userCount, sampleUser: null };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, verificationToken, verificationTokenExpiresAt, ...rest } = sampleUser as any;

      return { userCount, sampleUser: rest };
    } catch (error) {
      throw new Error(`Database query failed: ${String(error)}`);
    }
  }
}