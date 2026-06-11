import * as bcrypt from 'bcryptjs';

export class HashUtil {
  static async hash(data: string, saltOrRounds: string | number = 10): Promise<string> {
    return bcrypt.hash(data, saltOrRounds);
  }

  static async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
