import type { Request, Response } from "express";
import { buscarContenido } from "../repositories/search.repository.js";

export async function buscar(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (q === '') {
      res.status(400).json({ message: 'El parámetro de búsqueda "q" es obligatorio.' });
      return;
    }

    const resultados = await buscarContenido(q);

    res.status(200).json({ query: q, ...resultados });
  } catch (error) {
    console.error("Error en la búsqueda global:", error);
    res.status(500).json({ message: "No se pudo realizar la búsqueda" });
  }
}
