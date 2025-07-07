export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center p-8 bg-yellow-200 border-4 border-dashed border-red-500 rounded-lg">
        <h1 className="text-4xl font-bold text-red-600">-- HOME PAGE TEST --</h1>
        <p className="mt-4 text-lg text-black">
          If you are seeing this, <strong className="font-bold">src/app/page.tsx</strong> is the correct homepage file.
        </p>
      </div>
    </div>
  );
}
