import { prisma } from '../config/db';

export class ApprovalService {
  static async getAll() {
    return prisma.approval.findMany({
      include: {
        quotation: true,
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

  static async getById(id: string) {
    return prisma.approval.findUnique({
      where: { id },
      include: {
        quotation: true,
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

  static async create(
    approvedById: string,
    data: {
      quotationId: string;
      status: 'APPROVED' | 'REJECTED';
      remarks?: string;
    }
  ) {
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
