export default function MerciPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
        <p className="text-gray-500 text-sm">
          Votre réservation est confirmée. Vous allez recevoir un email de confirmation avec tous les détails de votre trajet.
        </p>
        <p className="text-xs text-gray-400 mt-6">Merci de votre confiance.</p>
      </div>
    </div>
  );
}
