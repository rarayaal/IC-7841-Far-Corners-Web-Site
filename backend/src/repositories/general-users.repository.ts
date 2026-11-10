import { pool } from '../db.js';

export interface UsuarioGeneral {
  id: string;
  full_name: string;
  email: string;
  role: 'visitor' | 'user';
  status: 'active' | 'inactive';
  participant_type: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function obtenerUsuariosGenerales() {
  const resultado = await pool.query<UsuarioGeneral>(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        participant_type,
        created_at,
        updated_at
      FROM users
      WHERE role IN ('visitor', 'user')
      ORDER BY created_at DESC, id DESC
    `
  );

  return resultado.rows;
}

export async function obtenerUsuarioGeneralPorId(id: string) {
  const resultado = await pool.query<UsuarioGeneral>(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        participant_type,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
        AND role IN ('visitor', 'user')
    `,
    [id]
  );

  return resultado.rows[0];
}

export async function crearUsuarioGeneral(
  nombre: string,
  correo: string,
  passwordHash: string
) {
  const resultado = await pool.query<UsuarioGeneral>(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, 'visitor', 'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING
        id,
        full_name,
        email,
        role,
        status,
        participant_type,
        created_at,
        updated_at
    `,
    [nombre, correo, passwordHash]
  );

  return resultado.rows[0];
}

export async function actualizarUsuarioGeneral(
  id: string,
  nombre: string,
  correo: string
) {
  const resultado = await pool.query<UsuarioGeneral>(
    `
      UPDATE users
      SET
        full_name = $2,
        email = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND role IN ('visitor', 'user')
      RETURNING
        id,
        full_name,
        email,
        role,
        status,
        participant_type,
        created_at,
        updated_at
    `,
    [id, nombre, correo]
  );

  return resultado.rows[0];
}

export async function cambiarEstadoUsuarioGeneral(
  id: string,
  estado: 'active' | 'inactive'
) {
  const resultado = await pool.query<UsuarioGeneral>(
    `
      UPDATE users
      SET
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND role IN ('visitor', 'user')
      RETURNING
        id,
        full_name,
        email,
        role,
        status,
        participant_type,
        created_at,
        updated_at
    `,
    [id, estado]
  );

  return resultado.rows[0];
}