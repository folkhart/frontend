export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-stone-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🧁</div>
        <h1 className="text-2xl font-bold text-amber-500 mb-2">Folkhart</h1>
        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}
