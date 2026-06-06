'use strict';

const db = require('../../config/db');

exports.getAll = async () => {
  const result = await db.query(
    'SELECT id, full_name as "fullName", email, role, created_at as "createdAt" FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

exports.update = async (id, data) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.role) {
    updates.push(`role = $${paramCount++}`);
    values.push(data.role);
  }


  if (updates.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE users 
    SET ${updates.join(', ')}, updated_at = NOW() 
    WHERE id = $${paramCount} 
    RETURNING id, full_name as "fullName", email, role
  `;

  const result = await db.query(query, values);
  if (result.rows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};
