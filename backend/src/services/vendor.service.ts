import { prisma } from '../config/db';

export class VendorService {
  static async getAll() {
    return prisma.vendor.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async getById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async create(data: { name: string; email: string; phone?: string; address?: string }) {
    return prisma.vendor.create({
      data,
    });
  }

  static async update(id: string, data: any) {
    return prisma.vendor.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.vendor.delete({
      where: { id },
    });
  }
}
