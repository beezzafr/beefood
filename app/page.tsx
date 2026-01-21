export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <div className="text-center text-white px-4">
        <h1 className="text-6xl font-bold mb-4">🍔 Coming Soon</h1>
        <p className="text-2xl mb-8">Restaurant Multitenant Platform</p>
        <p className="text-lg opacity-90">
          BEEFOOD • TACOBEE • BEELLISSIMO • BEERGER
        </p>
        <div className="mt-12 text-sm opacity-75">
          <p>Powered by Next.js 16 + Supabase + Zelty</p>
        </div>
      </div>
    </div>
  );
}
