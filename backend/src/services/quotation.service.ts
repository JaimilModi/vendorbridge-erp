import { prisma } from '../config/db';

export class QuotationService {
  static async getAll() {
    return prisma.quotation.findMany({
      include: {
        items: true,
        rfq: true,
        vendor: true,
      },
    });
  }

  static async getById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        rfq: true,
        vendor: true,
        approvals: true,
      },
    });
  }

  static async create(
    vendorId: string,
    data: {
      rfqId: string;
      validityDate: string;
      items: { rfqItemId: string; unitPrice: number; deliveryTimeline?: string }[];
    }
  ) {
    let totalAmount = 0;
    const itemsData = [];

    for (const item of data.items) {
      const rfqItem = await prisma.rFQItem.findUnique({ where: { id: item.rfqItemId } });
      if (!rfqItem) {
        throw new Error(`RFQ Item ${item.rfqItemId} not found`);
      }
      const qty = rfqItem.quantity;
      const totalPrice = item.unitPrice * qty;
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

  static async updateStatus(id: string, status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED') {
    return prisma.quotation.update({
      where: { id },
      data: { status },
    });
  }
}
