import express, { Request, Response } from 'express';
import Alimento from '../models/Alimenti';
import Ordine from '../models/Ordini';
import { StateMachine, OrdineStato } from '../utils/stateMachine';

const router = express.Router();

// Rotta per ottenere tutti gli alimenti
router.get('/alimenti', async (req: Request, res: Response) => {
  try {
    const alimenti = await Alimento.findAll();
    return res.status(200).json(alimenti);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nel recupero degli alimenti.' });
  }
});

// Rotta per creare un nuovo alimento
router.post('/alimenti', async (req: Request, res: Response) => {
  const { nome, quantita } = req.body;

  try {
    const nuovoAlimento = await Alimento.create({ nome, quantita });
    return res.status(201).json(nuovoAlimento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nella creazione del nuovo alimento.' });
  }
});

// Rotta per aggiornare un alimento esistente
router.put('/alimenti/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, quantita } = req.body;

  try {
    const alimento = await Alimento.findByPk(id);
    if (!alimento) {
      return res.status(404).json({ error: 'Alimento non trovato.' });
    }

    alimento.nome = nome;
    alimento.quantita = quantita;
    await alimento.save();

    return res.status(200).json(alimento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'alimento.' });
  }
});

// Rotta per eliminare un alimento
router.delete('/alimenti/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const alimento = await Alimento.findByPk(id);
    if (!alimento) {
      return res.status(404).json({ error: 'Alimento non trovato.' });
    }

    await alimento.destroy();

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'alimento.' });
  }
});

// Rotta per creare un nuovo ordine di prelievo
router.post('/ordini', async (req: Request, res: Response) => {
  const { alimenti } = req.body;

  try {
    // Controlla la disponibilità degli alimenti richiesti
    for (const { id, quantita } of alimenti) {
      const alimento = await Alimento.findByPk(id);
      if (!alimento || alimento.quantita_disponibile < quantita) {
        return res.status(400).json({ error: 'Quantità non disponibile per uno o più alimenti.' });
      }
    }

    // Se tutte le quantità sono disponibili, crea l'ordine
    const nuovoOrdine = await Ordine.create();
    
    // Aggiorna le quantità disponibili degli alimenti nell'ordine
    for (const { id, quantita } of alimenti) {
      const alimento = await Alimento.findByPk(id);
      if (alimento) {
        alimento.quantita_disponibile -= quantita;
        await alimento.save();
      }
    }

    return res.status(201).json(nuovoOrdine);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nella creazione dell\'ordine.' });
  }
});

// Rotta per aggiornare lo stato di un ordine
router.put('/ordini/:id/stato', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { statoDestinazione } = req.body;

  try {
    const ordine = await Ordine.findByPk(id);
    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato.' });
    }

    const stateMachine = new StateMachine();
    if (stateMachine.transizioneVerso(statoDestinazione as OrdineStato)) {
      ordine.stato = stateMachine.getStatoCorrente();
      await ordine.save();
      return res.status(200).json(ordine);
    } else {
      return res.status(400).json({ error: 'Transizione di stato non valida.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato dell\'ordine.' });
  }
});

export default router;
