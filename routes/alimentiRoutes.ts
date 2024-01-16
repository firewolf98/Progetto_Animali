import express, { Request, Response } from 'express';
import Alimento from '../models/Alimenti';
import Ordine from '../models/Ordini';
import Operazione from '../models/Operazioni'; 
import { Op } from 'sequelize';


import { StateMachine, OrdineStato } from '../utils/StateMachine';

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

// Rotta per segnalare che un ordine è stato preso in carico
router.put('/ordini/:id/preso-in-carico', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const ordine = await Ordine.findByPk(id);
    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato.' });
    }

    const stateMachine = new StateMachine();
    if (stateMachine.transizioneVerso(OrdineStato.IN_ESECUZIONE)) {
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

// Rotta per segnalare il carico di un determinato peso di un alimento
router.post('/carico-alimenti', async (req: Request, res: Response) => {
  const { alimentoId, peso } = req.body;

  try {
    const alimento = await Alimento.findByPk(alimentoId);
    if (!alimento) {
      return res.status(404).json({ error: 'Alimento non trovato.' });
    }

    // Verifica che l'ordine sia ancora in uno stato valido
    const ordine = await Ordine.findOne({ where: { stato: OrdineStato.IN_ESECUZIONE } });
    if (!ordine) {
      return res.status(400).json({ error: 'Nessun ordine in esecuzione.' });
    }

    // Registra il timestamp
    const timestamp = new Date();
    alimento.updated_at = timestamp;
    alimento.quantita_disponibile += peso;
    await alimento.save();

    // Verifica la sequenza di carico
    const alimentiOrdine = await ordine.getAlimenti();
    const indiceAlimentoCorrente = alimentiOrdine.findIndex((a) => a.id === alimento.id);
    if (indiceAlimentoCorrente === -1) {
      // L'alimento non fa parte dell'ordine corrente
      await ordine.update({ stato: OrdineStato.FALLITO });
      return res.status(400).json({ error: 'Sequenza di carico non rispettata. Ordine annullato.' });
    }

    // Verifica le quantità caricate rispetto al valore richiesto
    const percentualeDeviazionePermitita = parseFloat(process.env.PERCENTUALE_DEVIATA || '5'); // Modifica il valore di default
    const quantitaRichiesta = alimentiOrdine[indiceAlimentoCorrente].quantita;
    const quantitaCaricata = alimento.quantita_disponibile;
    const deviazionePercentuale = Math.abs(((quantitaCaricata - quantitaRichiesta) / quantitaRichiesta) * 100);

    if (deviazionePercentuale > percentualeDeviazionePermitita) {
      // Quantità caricate deviate rispetto al valore richiesto
      await ordine.update({ stato: OrdineStato.FALLITO });
      return res.status(400).json({
        error: `Deviazione percentuale troppo elevata (${deviazionePercentuale}%). Ordine annullato.`,
      });
    }

    // Verifica se l'ordine è COMPLETATO
    const ordineCompletato = alimentiOrdine.every((a, index) => {
      return index <= indiceAlimentoCorrente ? a.quantita === a.quantita_caricata : a.quantita_caricata === a.quantita;
    });

    if (ordineCompletato) {
      await ordine.update({ stato: OrdineStato.COMPLETATO });
      return res.status(200).json({ message: 'Ordine completato con successo.' });
    }

    return res.status(200).json({ message: 'Carico dell\'alimento registrato con successo.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento delle quantità disponibili dell\'alimento.' });
  }
});

// Rotta per ottenere lo stato di un ordine
router.get('/ordine/:id/stato', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    // Trova l'ordine e i relativi alimenti
    const ordine = await Ordine.findByPk(orderId, {
      include: [{ model: Alimento, as: 'alimenti' }],
    });

    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    const ordineConAlimenti = ordine as Ordine & { alimenti: Alimento[] };

    // Crea un'istanza di StateMachine
    const stateMachine = new StateMachine();

    // Verifica lo stato dell'ordine
    const statoOrdine = stateMachine.getStatoCorrente();

    if (statoOrdine === OrdineStato.COMPLETATO) {
      // Calcola lo scostamento e il tempo richiesto per ogni alimento
      const risultatiAlimenti = await Promise.all(
        ordineConAlimenti.alimenti.map(async (alimento) => {
          const scostamento = alimento.quantita_caricata - alimento.quantita;
          const tempoRichiesto = (alimento.updated_at as Date).getTime() - (alimento.created_at as Date).getTime();


    
          return {
            alimentoId: alimento.id,
            nome: alimento.nome,
            scostamento,
            tempoRichiesto,
          };
        })
      );

      // Esegui la transizione dello stato se necessario
      const transizioneRiuscita = stateMachine.transizioneVerso(OrdineStato.COMPLETATO); 

      // Invia la risposta con i risultati
      return res.json({
        stato: statoOrdine,
        risultatiAlimenti,
        transizioneRiuscita,
      });
    } else {
      // Se l'ordine non è completato, invia solo lo stato
      return res.json({
        stato: statoOrdine,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rotta per elencare operazioni di carico/scarico di un dato alimento in un periodo di riferimento
router.get('/alimenti/:alimentoId/operazioni', async (req: Request, res: Response) => {
  try {
    // Estrai i parametri dalla richiesta
    const alimentoId = parseInt(req.params.alimentoId, 10);
    const dataInizio = new Date(req.query.dataInizio as string);
    const dataFine = new Date(req.query.dataFine as string);

    // Trova l'alimento e le relative operazioni in base alle date
    const alimento = await Alimento.findByPk(alimentoId, {
      include: [{ model: Operazione, as: 'operazioni', where: { timestamp: { [Op.between]: [dataInizio, dataFine] } } }],
    });

    if (!alimento) {
      return res.status(404).json({ error: 'Alimento non trovato' });
    }

    // Invia la risposta con le operazioni dell'alimento nel periodo specificato
    return res.json({
      alimentoId: alimento.id,
      nome: alimento.nome,
      operazioni: alimento.operazioni,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rotta per ottenere lo stato di tutti gli ordini con filtri
router.get('/ordini', async (req: Request, res: Response) => {
  try {
    // Definisci i filtri opzionali
    const { dataDa, dataA, alimenti } = req.query;

    // Converti i valori delle date in oggetti Date validi
    const filtroData: any = {};
    if (dataDa) {
      const dataDaString = Array.isArray(dataDa) ? (dataDa[0] as string) : (dataDa as string);
      filtroData[Op.gte] = new Date(dataDaString);
    }
    if (dataA) {
      const dataAString = Array.isArray(dataA) ? (dataA[0] as string) : (dataA as string);
      filtroData[Op.lte] = new Date(dataAString);
    }



    // Costruisci il filtro per gli alimenti
    const filtroAlimenti: any = {};
    if (alimenti) {
      filtroAlimenti.id = Array.isArray(alimenti) ? { [Op.in]: alimenti } : alimenti;
    }

    // Esegui la query utilizzando i filtri
    const ordini = await Ordine.findAll({
      where: {
        created_at: filtroData,
      },
      include: [
        {
          model: Alimento,
          as: 'alimenti',
          where: filtroAlimenti,
          required: alimenti ? true : false, // Se sono specificati alimenti, richiedi la corrispondenza
        },
      ],
    });

    // Invia la risposta con gli ordini filtrati
    return res.json({ ordini });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});



export default router;
