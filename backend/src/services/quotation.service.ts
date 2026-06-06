import { prisma } from '../config/db';

export class QuotationService {
  static async getAll(userRole?: string, userId?: string) {
    let where: any = {};
    
    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.vendorId) {
        where = { vendorId: user.vendorId };
      } else {
        return [];
      }
    }

    return prisma.quotation.findMany({
      where,
      include: {
        items: {
          include: {
            rfqItem: true,
          },
        },
        rfq: true,
        vendor: true,
      },
    });
  }

  static async getById(id: string, userRole?: string, userId?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            rfqItem: true,
          },
        },
        rfq: {
          include: {
            items: true,
          },
        },
        vendor: true,
        approvals: true,
      },
    });

    if (quotation && userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || quotation.vendorId !== user.vendorId) {
        throw new Error('Access denied: You do not own this quotation');
      }
    }

    return quotation;
  }

  static async create(
    vendorId: string,
    data: {
      rfqId: string;
      validityDate: string;
      items: { rfqItemId: string; unitPrice: number; deliveryTimeline?: string }[];
    }
  ) {
    const rfq = await prisma.rFQ.findUnique({ where: { id: data.rfqId } });
    if (!rfq) {
      throw new Error('RFQ not found');
    }
    if (rfq.status !== 'OPEN') {
      throw new Error('Access denied: RFQ is not open for bidding');
    }
    if (new Date(rfq.deadline) < new Date()) {
      throw new Error('Access denied: RFQ deadline has passed');
    }

    // Check if vendor has already submitted a quotation for this RFQ
    const existingQuotation = await prisma.quotation.findFirst({
      where: {
        rfqId: data.rfqId,
        vendorId,
      },
    });
    if (existingQuotation) {
      throw new Error('You have already submitted a quotation for this RFQ');
    }

    let totalAmount = 0;
    const itemsData: { rfqItemId: string; unitPrice: number; totalPrice: number; deliveryTimeline?: string }[] = [];

    for (const item of data.items) {
      const rfqItem = await prisma.rFQItem.findUnique({ where: { id: item.rfqItemId } });
      if (!rfqItem) {
        throw new Error(`RFQ Item ${item.rfqItemId} not found`);
      }
      const qty = rfqItem.quantity;
      const totalPrice = Number(item.unitPrice) * qty;
      totalAmount += totalPrice;

      itemsData.push({
        rfqItemId: item.rfqItemId,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        deliveryTimeline: item.deliveryTimeline,
      });
    }

    return prisma.quotation.create({
      data: {
        rfqId: data.rfqId,
        vendorId,
        validityDate: new Date(data.validityDate),
        totalAmount,
        items: {
          create: itemsData,
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
      validityDate: string;
      items: { rfqItemId: string; unitPrice: number; deliveryTimeline?: string }[];
    },
    userRole?: string,
    userId?: string
  ) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { rfq: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || quotation.vendorId !== user.vendorId) {
        throw new Error('Access denied: You do not own this quotation');
      }
    }

    if (quotation.rfq.status !== 'OPEN') {
      throw new Error('Access denied: RFQ is not open');
    }
    if (new Date(quotation.rfq.deadline) < new Date()) {
      throw new Error('Access denied: RFQ deadline has passed');
    }

    let totalAmount = 0;
    const itemsData: { rfqItemId: string; unitPrice: number; totalPrice: number; deliveryTimeline?: string }[] = [];

    for (const item of data.items) {
      const rfqItem = await prisma.rFQItem.findUnique({ where: { id: item.rfqItemId } });
      if (!rfqItem) {
        throw new Error(`RFQ Item ${item.rfqItemId} not found`);
      }
      const qty = rfqItem.quantity;
      const totalPrice = Number(item.unitPrice) * qty;
      totalAmount += totalPrice;

      itemsData.push({
        rfqItemId: item.rfqItemId,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        deliveryTimeline: item.deliveryTimeline,
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      return tx.quotation.update({
        where: { id },
        data: {
          validityDate: new Date(data.validityDate),
          totalAmount,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });
  }

  static async delete(id: string, userRole?: string, userId?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { rfq: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || quotation.vendorId !== user.vendorId) {
        throw new Error('Access denied: You do not own this quotation');
      }
    }

    if (quotation.rfq.status !== 'OPEN') {
      throw new Error('Access denied: RFQ is not open');
    }
    if (new Date(quotation.rfq.deadline) < new Date()) {
      throw new Error('Access denied: RFQ deadline has passed');
    }

    return prisma.quotation.delete({
      where: { id },
    });
  }

  static async updateStatus(id: string, status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED') {
    return prisma.quotation.update({
      where: { id },
      data: { status },
    });
  }
}

