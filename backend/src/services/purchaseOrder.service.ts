import { prisma } from '../config/db';

export class PurchaseOrderService {
  static async getAll() {
    return prisma.purchaseOrder.findMany({
      include: {
        items: true,
        quotation: true,
        vendor: true,
      },
    });
  }

  static async getById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        quotation: true,
        vendor: true,
        invoices: true,
      },
    });
  }

  static async create(data: {
    poNumber: string;
    quotationId: string;
    vendorId: string;
    items: { productName: string; description?: string; quantity: number; unitPrice: number }[];
  }) {
    let totalAmount = 0;
    const itemsData = data.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      return {
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const [purchaseOrder] = await prisma.$transaction([
      prisma.purchaseOrder.create({
        data: {
          poNumber: data.poNumber,
          quotationId: data.quotationId,
          vendorId: data.vendorId,
          totalAmount,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      }),
      prisma.quotation.update({
        where: { id: data.quotationId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return purchaseOrder;
  }

  static async updateStatus(id: string, status: 'DRAFT' | 'ISSUED' | 'COMPLETED' | 'CANCELLED') {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }
}
