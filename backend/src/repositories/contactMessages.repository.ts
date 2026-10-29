import { pool } from '../db.js';

export async function crearMensaje(
  nombre: string,
  correo: string,
  asunto: string,
  mensaje: string
) {
  const result = await pool.query(
    `
      INSERT INTO contact_messages (
        name,
        email,
        subject,
        message
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, status, created_at
    `,
    [nombre, correo, asunto, mensaje]
  );

  return result.rows[0];
}

export async function obtenerMensajes() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      email,
      subject,
      message,
      status,
      created_at
    FROM contact_messages
    ORDER BY created_at DESC, id DESC
  `);

  return result.rows;
}



export async function crearRespuestaContacto(
  mensajeId: string,
  administradorId: string,
  texto: string
) {
  const resultado = await pool.query(
    `
      INSERT INTO contact_message_replies (
        contact_message_id,
        admin_user_id,
        response_text
      )
      SELECT id, $2, $3
      FROM contact_messages
      WHERE id = $1
      RETURNING
        id,
        contact_message_id,
        admin_user_id,
        response_text,
        status,
        created_at,
        sent_at
    `,
    [mensajeId, administradorId, texto]
  );

  return resultado.rows[0];
}

export async function obtenerRespuestasDeMensaje(mensajeId: string) {
  const resultado = await pool.query(
    `
      SELECT
        id,
        contact_message_id,
        admin_user_id,
        response_text,
        status,
        created_at,
        sent_at
      FROM contact_message_replies
      WHERE contact_message_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [mensajeId]
  );

  return resultado.rows;
}

export async function obtenerMensajePorId(mensajeId: string) {
  const resultado = await pool.query<{
    id: string;
    name: string;
    email: string;
    subject: string;
  }>(
    `
      SELECT id, name, email, subject
      FROM contact_messages
      WHERE id = $1
    `,
    [mensajeId]
  );

  return resultado.rows[0];
}

export async function marcarRespuestaEnviada(respuestaId: string) {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `
        UPDATE contact_message_replies
        SET
          status = 'sent',
          sent_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          contact_message_id,
          response_text,
          status,
          created_at,
          sent_at
      `,
      [respuestaId]
    );

    const respuesta = resultado.rows[0];

    if (!respuesta) {
      throw new Error('No se encontró la respuesta para actualizarla.');
    }

    await cliente.query(
      `
        UPDATE contact_messages
        SET status = 'replied'
        WHERE id = $1
      `,
      [respuesta.contact_message_id]
    );

    await cliente.query('COMMIT');

    return respuesta;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}


export async function marcarRespuestaFallida(respuestaId: string) {
  const resultado = await pool.query(
    `
      UPDATE contact_message_replies
      SET
        status = 'failed',
        sent_at = NULL
      WHERE id = $1
        AND status <> 'sent'
      RETURNING id, status
    `,
    [respuestaId]
  );

  if (!resultado.rows[0]) {
    throw new Error(
      'La respuesta no existe o ya está registrada como enviada.'
    );
  }

  return resultado.rows[0];
}