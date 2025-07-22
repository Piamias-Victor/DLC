import { Pill, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-pharmacy-700 mb-4 flex items-center justify-center gap-3">
            <Pill className="w-10 h-10" />
            Signalement Pharmacie
          </h1>
          <p className="text-gray-600 text-lg">
            Test des composants et du design system
          </p>
        </header>

        {/* Test Buttons */}
        <section className="card">
          <h2 className="text-2xl font-semibold mb-4">Boutons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              Nouveau Signalement
            </button>
            <button className="btn-secondary">
              Voir Dashboard
            </button>
            <button className="btn-primary disabled:opacity-50" disabled>
              Bouton Désactivé
            </button>
          </div>
        </section>

        {/* Test Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cards de Signalement</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Signalement Critique */}
            <div className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="badge-urgency-critical">
                  CRITIQUE
                </div>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Doliprane 1000mg</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Quantité:</strong> 15 boîtes
              </p>
              <p className="text-gray-600 text-sm mb-3">
                <strong>Expire le:</strong> 25/07/2025
              </p>
              <button className="w-full btn-primary text-sm">
                Traiter
              </button>
            </div>

            {/* Signalement Élevé */}
            <div className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="badge-urgency-high">
                  ÉLEVÉ
                </div>
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Vitamine C 500mg</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Quantité:</strong> 8 boîtes
              </p>
              <p className="text-gray-600 text-sm mb-3">
                <strong>Expire le:</strong> 05/08/2025
              </p>
              <button className="w-full btn-secondary text-sm">
                Programmer
              </button>
            </div>

            {/* Signalement Traité */}
            <div className="card bg-green-50 border-green-200 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="badge-urgency-low">
                  TRAITÉ
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sérum physiologique</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Action:</strong> Promotion appliquée
              </p>
              <p className="text-gray-600 text-sm mb-3">
                <strong>Économie:</strong> 45€
              </p>
              <button className="w-full btn-secondary text-sm opacity-75" disabled>
                Terminé
              </button>
            </div>
          </div>
        </section>

        {/* Test Form */}
        <section className="card">
          <h2 className="text-2xl font-semibold mb-4">Formulaire Test</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code produit (EAN13)
              </label>
              <input 
                type="text" 
                className="input-field"
                placeholder="3401579826789"
                maxLength={13}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="15"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de péremption
                </label>
                <input 
                  type="date" 
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaire
              </label>
              <textarea 
                className="input-field resize-none"
                rows={3}
                placeholder="Informations complémentaires..."
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Envoyer Signalement
              </button>
              <button type="button" className="btn-secondary">
                Scanner Code
              </button>
            </div>
          </form>
        </section>

        {/* Test Responsive */}
        <section className="card">
          <h2 className="text-2xl font-semibold mb-4">Test Responsive</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div className="p-4 bg-pharmacy-100 rounded">Mobile</div>
            <div className="p-4 bg-pharmacy-200 rounded hidden sm:block">SM+</div>
            <div className="p-4 bg-pharmacy-300 rounded hidden md:block">MD+</div>
            <div className="p-4 bg-pharmacy-400 rounded hidden lg:block">LG+</div>
            <div className="p-4 bg-pharmacy-500 rounded hidden xl:block text-white">XL+</div>
            <div className="p-4 bg-pharmacy-600 rounded hidden 2xl:block text-white">2XL+</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500">
          <p>Setup Tailwind ✅ | Responsive ✅ | Icons ✅</p>
        </footer>

      </div>
    </div>
  );
}