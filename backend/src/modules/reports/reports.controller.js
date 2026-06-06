'use strict';

/**
 * src/modules/reports/reports.controller.js
 * Thin controller — parse req, call service, return response.
 */

const reportsService = require('./reports.service');
const { ok } = require('../../utils/response');

const summary           = async (req, res, next) => { try { return ok(res, await reportsService.summary()); } catch (e) { next(e); } };
const spend             = async (req, res, next) => { try { return ok(res, await reportsService.spend()); } catch (e) { next(e); } };
const vendorPerformance = async (req, res, next) => { try { return ok(res, await reportsService.vendorPerformance()); } catch (e) { next(e); } };
const monthlyTrend      = async (req, res, next) => { try { return ok(res, await reportsService.monthlyTrend(req.query.year)); } catch (e) { next(e); } };

module.exports = { summary, spend, vendorPerformance, monthlyTrend };
