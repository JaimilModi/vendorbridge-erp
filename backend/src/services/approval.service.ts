import { prisma } from '../config/db';

export class ApprovalService {
  static async getAll(userRole?: string, userId?: string) {
    let where: any = {};

    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.vendorId) {
        where = {
          quotation: {
            vendorId: user.vendorId,
          },
        };
      } else {
        return [];
      }
    }

    return prisma.approval.findMany({
      where,
      include: {
        quotation: {
          include: {
            rfq: true,
            vendor: true,
          },
        },
        approvedBy: {
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

  static async getById(id: string, userRole?: string, userId?: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            rfq: true,
            vendor: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (approval && userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || approval.quotation.vendorId !== user.vendorId) {
        throw new Error("Access denied: You do not own this quotation's approval record");
      }
    }

    return approval;
  }

  static async create(
    approvedById: string,
    data: {
      quotationId: string;
      status: 'APPROVED' | 'REJECTED';
      remarks?: string;
    }
  ) {
    const quotation = await prisma.quotation.findUnique({ where: { id: data.quotationId } });
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    if (quotation.status !== 'SUBMITTED') {
      throw new Error('Access denied: Quotation is not awaiting approval');
    }

    const quotationStatus = data.status === 'APPROVED' ? 'ACCEPTED' : 'REJECTED';

    const [approval] = await prisma.$transaction([
      prisma.approval.create({
        data: {
          quotationId: data.quotationId,
          approvedById,
          status: data.status,
          remarks: data.remarks,
        },
      }),
      prisma.quotation.update({
        where: { id: data.quotationId },
        data: { status: quotationStatus },
      }),
    ]);

    return approval;
  }
}

