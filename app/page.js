"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const goToBrownian = () => {
    router.push("/brownian");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to StockOverflow</h1>
      <button
        onClick={goToBrownian}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-xl transition shadow-lg"
      >
        Launch Simulator
      </button>
    </div>
  );
}
