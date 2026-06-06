import { prisma } from '../config/db';

export class InvoiceService {
  static async getAll(userRole?: string, userId?: string) {
    let where: any = {};

    if (userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.vendorId) {
        where = {
          vendorId: user.vendorId,
          status: {
            in: ['SENT', 'PAID', 'OVERDUE'],
          },
        };
      } else {
        return [];
      }
    }

    return prisma.invoice.findMany({
      where,
      include: {
        items: true,
        po: {
          include: {
            quotation: {
              include: {
                rfq: true,
              },
            },
          },
        },
        vendor: true,
      },
    });
  }

  static async getById(id: string, userRole?: string, userId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        po: {
          include: {
            quotation: {
              include: {
                rfq: true,
              },
            },
          },
        },
        vendor: true,
      },
    });

    if (invoice && userRole === 'VENDOR' && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || invoice.vendorId !== user.vendorId || invoice.status === 'DRAFT') {
        throw new Error('Access denied: You do not have permission to view this invoice');
      }
    }

    return invoice;
  }

  static async generate(poId: string, dueDate: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status !== 'ISSUED' && po.status !== 'COMPLETED') {
      throw new Error('Only ISSUED or COMPLETED Purchase Orders can generate invoices');
    }

    // Check if invoice already exists for this PO
    const existingInvoice = await prisma.invoice.findFirst({
      where: { poId },
    });

    if (existingInvoice) {
      throw new Error('An invoice has already been generated for this Purchase Order');
    }

    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    const nextNum = (count + 1).toString().padStart(4, '0');
    const invoiceNumber = `${prefix}${nextNum}`;

    const itemsData = (po.items || []).map((item) => {
      const quantity = item.quantity;
      const unitPrice = Number(item.unitPrice);
      const totalPrice = quantity * unitPrice;

      return {
        productName: item.productName,
        description: item.description,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    return prisma.invoice.create({
      data: {
        invoiceNumber,
        poId,
        vendorId: po.vendorId,
        totalAmount: po.totalAmount,
        dueDate: new Date(dueDate),
        status: 'DRAFT',
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
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}

