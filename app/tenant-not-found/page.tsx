export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Restaurant non trouvé
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Le domaine que vous avez saisi ne correspond à aucun restaurant actif.
        </p>
        <p className="text-sm text-gray-500">
          Veuillez vérifier l'URL ou contacter le support.
        </p>
      </div>
    </div>
  );
}
