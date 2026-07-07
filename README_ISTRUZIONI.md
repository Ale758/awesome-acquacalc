# AcquaCalc — guida al deploy (versione semplice, zero backend)

Questo sito non ha bisogno di chiavi API, database o variabili d'ambiente:
sono solo calcoli che avvengono nel browser. Per questo il deploy è più
semplice di Ripassa.

## 1. Carica il codice su GitHub

1. Crea un account gratuito su [github.com](https://github.com) se non lo hai già.
2. Crea un nuovo repository (es. "acquacalc").
3. Carica tutti i file e le cartelle di questo pacchetto (trascina l'intera
   cartella nella pagina "uploading an existing file" di GitHub).

## 2. Collega Vercel

1. Vai su [vercel.com](https://vercel.com) e registrati con l'account GitHub.
2. "Add New… → Project", scegli il repository "acquacalc".
3. Clicca "Deploy" — non serve aggiungere nessuna variabile d'ambiente questa
   volta. Dopo un minuto avrai un indirizzo tipo `acquacalc.vercel.app`.

## 3. Farti trovare su Google

Stesso procedimento di Ripassa:
1. Registra il sito su [Google Search Console](https://search.google.com/search-console).
2. Condividilo nei gruppi/forum di acquariofilia (es. gruppi Facebook, forum
   come acquariofiliafacile) — un paio di link da fonti reali aiutano Google
   a indicizzare prima.

## 4. Pubblicità (quando vuoi provarci)

Stesso identico procedimento spiegato per Ripassa: registrazione AdSense,
script nell'head del layout, blocco annuncio al posto di un placeholder nel
codice. Se vuoi, te lo aggiungo qui allo stesso modo la prossima volta.

## Perché questo deploy è più semplice

- **Nessun costo per utente**: non essendoci chiamate a un'AI, puoi avere
  qualsiasi quantità di traffico gratis sui piani free di Vercel.
- **Nessun database**: niente Supabase da configurare, niente schema SQL.
- **Nessuna chiave da proteggere**: tutto il codice può stare tranquillamente
  pubblico su GitHub, non c'è nulla di segreto da nascondere.

Se in futuro vuoi aggiungere qualcosa che richiede persistenza (es. salvare
le impostazioni della tua vasca tra una visita e l'altra), a quel punto sì
servirebbe qualcosa come Supabase — stessa struttura del pacchetto Ripassa.
