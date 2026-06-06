import { prisma } from '../config/db';

export class RFQService {
  static async getAll(userRole?: string) {
    const where = userRole === 'VENDOR' ? { status: 'OPEN' as const } : {};

    return prisma.rFQ.findMany({
      where,
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

  static async getById(id: string, userRole?: string) {
    const rfq = await prisma.rFQ.findUnique({
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
        quotations: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (rfq && userRole === 'VENDOR' && rfq.status !== 'OPEN') {
      throw new Error('Access denied: RFQ is not open');
    }

    return rfq;
  }

  static async create(
    createdById: string,
    data: {
      title: string;
      description?: string;
      deadline: string;
      items: {
        productName: string;
        description?: string;
        quantity: number;
        uom: string;
      }[];
    }
  ) {
    return prisma.rFQ.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        createdById,

        items: {
          create: data.items.map((item) => ({
            productName: item.productName,
            description: item.description,
            quantity: Number(item.quantity),
            uom: item.uom,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async update(
    id: string,
    data: {
      title: string;
      description?: string;
      status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'AWARDED';
      deadline: string;
      items?: {
        productName: string;
        description?: string;
        quantity: number;
        uom: string;
      }[];
    }
  ) {
    if (data.items && data.items.length > 0) {
      return prisma.$transaction(async (tx) => {
        await tx.rFQItem.deleteMany({
          where: { rfqId: id },
        });

        return tx.rFQ.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
            deadline: new Date(data.deadline),

            items: {
            create: data.items!.map((item) => ({
              productName: item.productName,
              description: item.description,
              quantity: Number(item.quantity),
              uom: item.uom,
            })),
          },
          },
          include: {
            items: true,
          },
        });
      });
    }

    return prisma.rFQ.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        deadline: new Date(data.deadline),
      },
      include: {
        items: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.rFQ.delete({
      where: { id },
    });
  }
}
