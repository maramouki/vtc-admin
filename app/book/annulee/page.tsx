export default function AnnuleePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
        <p className="text-gray-500 text-sm">
          Votre paiement a été annulé. Votre réservation n&apos;a pas été confirmée.
        </p>
        <a
          href="javascript:history.back()"
          className="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Réessayer
        </a>
      </div>
    </div>
  );
}
