import "./globals.css";

export const metadata = {
  title: "AcquaCalc — Calcolatori gratuiti per l'acquario d'acqua dolce",
  description:
    "Calcola litri vasca, cambio acqua, popolazione pesci indicativa, conversione GH/KH e stima CO2 per il tuo acquario d'acqua dolce. Gratis, senza account.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
