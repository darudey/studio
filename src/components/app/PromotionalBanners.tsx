"use client"
import Image from "next/image"

const promoData = [
    { title: "Monsoon Must-haves", hint: "umbrella rain", off: "50%" },
    { title: "Self Care & More", hint: "cosmetics skincare", off: "25%" },
    { title: "Kitchen Essentials", hint: "kitchen utensils", off: "35%" },
    { title: "Daily Deals", hint: "shopping sale", off: "50%" },
]

export default function PromotionalBanners() {
    return (
        <div className="bg-white p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {promoData.map(promo => (
                    <div key={promo.title} className="bg-yellow-50 rounded-lg shadow-sm p-2 text-center relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-br-lg">{promo.off}</div>
                         <div className="mt-8 mb-2 flex-grow flex items-center justify-center">
                            <Image src={`https://placehold.co/100x100.png`} data-ai-hint={promo.hint} alt={promo.title} width={80} height={80} className="mx-auto object-contain" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 h-10 flex items-center justify-center">{promo.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    )
}
