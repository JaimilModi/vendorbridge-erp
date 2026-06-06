import { prisma } from '../config/db';

export class InvoiceService {
  static async getAll() {
    return prisma.invoice.findMany({
      include: {
        items: true,
        po: true,
        vendor: true,
      },
    });
  }

  static async getById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        po: true,
        vendor: true,
      },
    });
  }

  static async create(data: {
    invoiceNumber: string;
    poId: string;
    vendorId: string;
    dueDate: string;
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

    return prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        poId: data.poId,
        vendorId: data.vendorId,
        totalAmount,
        dueDate: new Date(data.dueDate),
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateStatus(id: string, status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE') {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}
