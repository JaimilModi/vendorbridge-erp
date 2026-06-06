import { prisma } from '../config/db';

export class PurchaseOrderService {
  static async getAll(userRole?: string, userId?: string) {
    let where: any = {};

    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.vendorId) {
        where = {
          vendorId: user.vendorId,
          status: {
            in: ['ISSUED', 'COMPLETED', 'CANCELLED'],
          },
        };
      } else {
        return [];
      }
    }

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
        quotation: {
          include: {
            rfq: true,
          },
        },
        vendor: true,
      },
    });
  }

  static async getById(id: string, userRole?: string, userId?: string) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        quotation: {
          include: {
            rfq: true,
          },
        },
        vendor: true,
      },
    });

    if (purchaseOrder && userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || purchaseOrder.vendorId !== user.vendorId || purchaseOrder.status === 'DRAFT') {
        throw new Error('Access denied: You do not have permission to view this Purchase Order');
      }
    }

    return purchaseOrder;
  }

  static async generate(quotationId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            rfqItem: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'ACCEPTED') {
      throw new Error('Only ACCEPTED quotations can generate Purchase Orders');
    }

    // Check if a PO has already been generated for this quotation
    const existingPo = await prisma.purchaseOrder.findFirst({
      where: { quotationId },
    });

    if (existingPo) {
      throw new Error('A Purchase Order has already been generated for this quotation');
    }

    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const count = await prisma.purchaseOrder.count({
      where: {
        poNumber: {
          startsWith: prefix,
        },
      },
    });

    const nextNum = (count + 1).toString().padStart(4, '0');
    const poNumber = `${prefix}${nextNum}`;

    // console.log('Quotation:', quotation.id);
    // console.log('Quotation Items:', quotation.items);

    const itemsData = (quotation.items || []).map((item) => {
      const productName = item.rfqItem?.productName || 'Line Item';
      const description = item.rfqItem?.description || null;
      const quantity = item.rfqItem?.quantity || 0;
      const unitPrice = Number(item.unitPrice);
      const totalPrice = quantity * unitPrice;

      return {
        productName,
        description,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    return prisma.purchaseOrder.create({
      data: {
        poNumber,
        quotationId,
        vendorId: quotation.vendorId,
        totalAmount: quotation.totalAmount,
        status: 'ISSUED',
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateStatus(id: string, status: 'DRAFT' | 'ISSUED' | 'COMPLETED' | 'CANCELLED') {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new Error('Purchase Order not found');
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }
}
