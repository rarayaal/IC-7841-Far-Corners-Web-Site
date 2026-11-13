import { pool } from '../db.js';

export async function crearUsuario(nombreCompleto: string, correo: string, passwordHash: string) {
  const result = await pool.query(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, 'user', 'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING
        id,
        full_name,
        email,
        role,
        status,
        created_at
    `,
    [nombreCompleto, correo, passwordHash]
  );

  return result.rows[0];
}


export async function obtenerUsuarioCorreo(correo: string){
  const result = await pool.query(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        status
      FROM users
      WHERE email = $1
    `,
    [correo]
  );
  return result.rows[0];
}



export async function obtenerUsuarioPorId(id: string) {
  const result = await pool.query(
    `
      SELECT id, full_name, email, role, status
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

export async function actualizarUsuarioPorId(id: string, fullName: string) {
  const result = await pool.query(
    `
      UPDATE users
      SET full_name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, full_name, email, role, status
    `,
    [fullName, id]
  );

  return result.rows[0];
}

export async function obtenerUsuarioPorIdConPassword(id: string) {
  const result = await pool.query(
    `
      SELECT id, full_name, email, password_hash, role, status
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

export async function actualizarPasswordUsuario(id: string, passwordHash: string) {
  await pool.query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `,
    [passwordHash, id]
  );
}