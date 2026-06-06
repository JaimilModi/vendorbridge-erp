'use strict';

/**
 * src/utils/camelCase.js
 *
 * Transforms PostgreSQL snake_case column names to camelCase
 * for all API responses, matching the frontend TypeScript interfaces exactly.
 *
 * Usage:
 *   const { toCamel, rowsToCamel } = require('../utils/camelCase');
 *   const user = toCamel(result.rows[0]);
 *   const users = rowsToCamel(result.rows);
 */

/**
 * Convert a snake_case string to camelCase.
 * @param {string} str
 * @returns {string}
 */
const snakeToCamel = (str) =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Recursively convert all keys of an object from snake_case to camelCase.
 * Handles nested objects and arrays.
 *
 * @param {any} obj
 * @returns {any}
 */
const toCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamel);
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      acc[snakeToCamel(key)] = toCamel(val);
      return acc;
    }, {});
  }

  return obj;
};

/**
 * Convert an array of database row objects to camelCase.
 * @param {Object[]} rows
 * @returns {Object[]}
 */
const rowsToCamel = (rows) => rows.map(toCamel);

module.exports = { toCamel, rowsToCamel, snakeToCamel };
