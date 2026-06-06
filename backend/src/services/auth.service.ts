import { prisma } from '../config/db';
import { hashPassword, comparePassword, generateToken } from '../utils';

export class AuthService {
  static async register(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'PROCUREMENT_OFFICER' | 'VENDOR' | 'MANAGER';
    companyName?: string;
    vendorEmail?: string;
    phone?: string;
    gstNumber?: string;
    address?: string;
  }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.passwordHash);
    let createdUser;

    if (data.role === 'VENDOR') {
      if (!data.companyName || !data.vendorEmail || !data.phone || !data.gstNumber || !data.address) {
        throw new Error('Missing vendor details for VENDOR registration');
      }

      const existingVendor = await prisma.vendor.findUnique({ where: { email: data.vendorEmail } });
      if (existingVendor) {
        throw new Error('Vendor with this email already exists');
      }

      // Create vendor and user in a transaction
      createdUser = await prisma.$transaction(async (tx) => {
        const vendor = await tx.vendor.create({
          data: {
            name: data.companyName!,
            email: data.vendorEmail!,
            phone: data.phone,
            address: data.address,
            gstNumber: data.gstNumber,
            status: 'ACTIVE',
          },
        });

        return tx.user.create({
          data: {
            email: data.email,
            passwordHash: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            vendorId: vendor.id,
          },
        });
      });
    } else {
      createdUser = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
      });
    }

    const token = generateToken(createdUser.id, createdUser.role);
    return {
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
        vendorId: createdUser.vendorId,
      },
    };
  }

  static async login(data: { email: string; passwordHash: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const matches = await comparePassword(data.passwordHash, user.passwordHash);
    if (!matches) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.id, user.role);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        vendorId: user.vendorId,
      },
    };
  }
}
