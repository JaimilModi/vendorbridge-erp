import { prisma } from '../config/db';

export class RFQService {
  static async getAll() {
    return prisma.rFQ.findMany({
      include: {
        items: true,
        createdBy: {
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
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        quotations: true,
      },
    });
  }

  static async create(
    createdById: string,
    data: {
      title: string;
      description?: string;
      deadline: string;
      items: { productName: string; description?: string; quantity: number; uom: string }[];
    }
  ) {
    return prisma.rFQ.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        createdById,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.rFQ.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });
  }

  static async delete(id: string) {
    return prisma.rFQ.delete({
      where: { id },
    });
  }
}
