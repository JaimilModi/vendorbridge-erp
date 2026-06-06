import { prisma } from '../config/db';

export class DashboardService {
  static async getAnalytics(userId: string, role: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, vendorId: true }
    });

    const isVendor = role === 'VENDOR';
    const vendorId = user?.vendorId;

    if (isVendor && !vendorId) {
      return this.emptyAnalytics();
    }

    // Determine start of 6 months ago (e.g. 5 months before current month)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get month templates
    const monthsTemplate = this.getLast6MonthsTemplate();

    if (isVendor && vendorId) {
      // 1. Vendor Metrics
      const totalQuotations = await prisma.quotation.count({ where: { vendorId } });
      const submittedQuotations = await prisma.quotation.count({ where: { vendorId, status: 'SUBMITTED' } });
      const acceptedQuotations = await prisma.quotation.count({ where: { vendorId, status: 'ACCEPTED' } });
      const rejectedQuotations = await prisma.quotation.count({ where: { vendorId, status: 'REJECTED' } });

      const pendingApprovals = await prisma.approval.count({
        where: {
          quotation: { vendorId },
          status: 'PENDING'
        }
      });

      const purchaseOrders = await prisma.purchaseOrder.count({ where: { vendorId } });
      const invoices = await prisma.invoice.count({ where: { vendorId } });
      const paidInvoices = await prisma.invoice.count({ where: { vendorId, status: 'PAID' } });
      const outstandingInvoices = await prisma.invoice.count({
        where: {
          vendorId,
          status: { in: ['SENT', 'OVERDUE'] }
        }
      });

      const spendSum = await prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          vendorId,
          status: { in: ['ISSUED', 'COMPLETED'] }
        }
      });
      const totalSalesSpend = spendSum._sum.totalAmount ? Number(spendSum._sum.totalAmount) : 0;

      // 2. Vendor Time-Series
      const rfqsRaw = await prisma.rFQ.findMany({
        where: {
          createdAt: { gte: startDate },
          OR: [
            { status: 'OPEN' },
            { quotations: { some: { vendorId } } }
          ]
        },
        select: { createdAt: true }
      });

      const quotationsRaw = await prisma.quotation.findMany({
        where: { vendorId, createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      const poRaw = await prisma.purchaseOrder.findMany({
        where: { vendorId, createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      const invoicesRaw = await prisma.invoice.findMany({
        where: { vendorId, createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      // 3. Vendor Status Distribution
      const poStatuses = await prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: true,
        where: { vendorId }
      });

      const invoiceStatuses = await prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
        where: { vendorId }
      });

      return {
        role,
        metrics: {
          totalVendors: 0,
          activeVendors: 0,
          totalRfqs: rfqsRaw.length,
          openRfqs: rfqsRaw.filter(r => r.createdAt >= startDate).length, // approximate
          closedRfqs: 0,
          totalQuotations,
          submittedQuotations,
          acceptedQuotations,
          rejectedQuotations,
          pendingApprovals,
          purchaseOrders,
          invoices,
          paidInvoices,
          outstandingInvoices,
          totalProcurementSpend: totalSalesSpend // For vendors, this represents total sales spend
        },
        charts: {
          rfqsPerMonth: this.groupTimeSeries(rfqsRaw, monthsTemplate),
          quotationsPerMonth: this.groupTimeSeries(quotationsRaw, monthsTemplate),
          purchaseOrdersPerMonth: this.groupTimeSeries(poRaw, monthsTemplate),
          invoicesPerMonth: this.groupTimeSeries(invoicesRaw, monthsTemplate),
          invoiceStatusDistribution: invoiceStatuses.map(item => ({ name: item.status, value: item._count })),
          purchaseOrderStatusDistribution: poStatuses.map(item => ({ name: item.status, value: item._count }))
        }
      };
    } else {
      // Global metrics (ADMIN, PROCUREMENT_OFFICER, MANAGER)
      const totalVendors = await prisma.vendor.count();
      const activeVendors = await prisma.vendor.count({ where: { status: 'ACTIVE' } });
      const totalRfqs = await prisma.rFQ.count();
      const openRfqs = await prisma.rFQ.count({ where: { status: 'OPEN' } });
      const closedRfqs = await prisma.rFQ.count({ where: { status: 'CLOSED' } });
      const totalQuotations = await prisma.quotation.count();
      const submittedQuotations = await prisma.quotation.count({ where: { status: 'SUBMITTED' } });
      const acceptedQuotations = await prisma.quotation.count({ where: { status: 'ACCEPTED' } });
      const rejectedQuotations = await prisma.quotation.count({ where: { status: 'REJECTED' } });
      const pendingApprovals = await prisma.approval.count({ where: { status: 'PENDING' } });
      const purchaseOrders = await prisma.purchaseOrder.count();
      const invoices = await prisma.invoice.count();
      const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } });
      const outstandingInvoices = await prisma.invoice.count({
        where: { status: { in: ['SENT', 'OVERDUE'] } }
      });

      const spendSum = await prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['ISSUED', 'COMPLETED'] } }
      });
      const totalProcurementSpend = spendSum._sum.totalAmount ? Number(spendSum._sum.totalAmount) : 0;

      // Global Time-Series
      const rfqsRaw = await prisma.rFQ.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      const quotationsRaw = await prisma.quotation.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      const poRaw = await prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      const invoicesRaw = await prisma.invoice.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      });

      // Global Status Distribution
      const poStatuses = await prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: true
      });

      const invoiceStatuses = await prisma.invoice.groupBy({
        by: ['status'],
        _count: true
      });

      return {
        role,
        metrics: {
          totalVendors,
          activeVendors,
          totalRfqs,
          openRfqs,
          closedRfqs,
          totalQuotations,
          submittedQuotations,
          acceptedQuotations,
          rejectedQuotations,
          pendingApprovals,
          purchaseOrders,
          invoices,
          paidInvoices,
          outstandingInvoices,
          totalProcurementSpend
        },
        charts: {
          rfqsPerMonth: this.groupTimeSeries(rfqsRaw, monthsTemplate),
          quotationsPerMonth: this.groupTimeSeries(quotationsRaw, monthsTemplate),
          purchaseOrdersPerMonth: this.groupTimeSeries(poRaw, monthsTemplate),
          invoicesPerMonth: this.groupTimeSeries(invoicesRaw, monthsTemplate),
          invoiceStatusDistribution: invoiceStatuses.map(item => ({ name: item.status, value: item._count })),
          purchaseOrderStatusDistribution: poStatuses.map(item => ({ name: item.status, value: item._count }))
        }
      };
    }
  }

  private static emptyAnalytics() {
    const monthsTemplate = this.getLast6MonthsTemplate();
    const emptySeries = monthsTemplate.map(m => ({ name: m.label, value: 0 }));
    return {
      role: 'VENDOR',
      metrics: {
        totalVendors: 0,
        activeVendors: 0,
        totalRfqs: 0,
        openRfqs: 0,
        closedRfqs: 0,
        totalQuotations: 0,
        submittedQuotations: 0,
        acceptedQuotations: 0,
        rejectedQuotations: 0,
        pendingApprovals: 0,
        purchaseOrders: 0,
        invoices: 0,
        paidInvoices: 0,
        outstandingInvoices: 0,
        totalProcurementSpend: 0
      },
      charts: {
        rfqsPerMonth: emptySeries,
        quotationsPerMonth: emptySeries,
        purchaseOrdersPerMonth: emptySeries,
        invoicesPerMonth: emptySeries,
        invoiceStatusDistribution: [],
        purchaseOrderStatusDistribution: []
      }
    };
  }

  private static getLast6MonthsTemplate() {
    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().substring(2);
      months.push({
        label,
        year: d.getFullYear(),
        month: d.getMonth(),
        value: 0
      });
    }
    return months;
  }

  private static groupTimeSeries(records: { createdAt: Date }[], monthsList: any[]) {
    const list = monthsList.map(m => ({ ...m }));
    records.forEach(r => {
      const rDate = new Date(r.createdAt);
      const rYear = rDate.getFullYear();
      const rMonth = rDate.getMonth();
      const match = list.find(m => m.year === rYear && m.month === rMonth);
      if (match) {
        match.value += 1;
      }
    });
    return list.map(m => ({ name: m.label, value: m.value }));
  }
}
