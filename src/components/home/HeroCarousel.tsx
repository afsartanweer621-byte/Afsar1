
"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from "@/components/ui/carousel";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

export function HeroCarousel() {
  const db = useFirestore();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const carouselQuery = useMemoFirebase(() => 
    query(collection(db, "app_assets", "homepage", "carousel"), orderBy("order", "asc")),
  [db]);

  const { data: slides, isLoading } = useCollection(carouselQuery);

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!mounted || isLoading) {
    return (
      <div className="h-[35vh] md:h-[70vh] w-full flex items-center justify-center bg-primary/5">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const displaySlides = slides?.length ? slides : [
    {
      id: "fallback-1",
      imageUrl: "https://picsum.photos/seed/shoes1/1920/1080",
      title: "Artisan Craftsmanship",
      description: "Direct workshop access to the world's finest footwear.",
    },
    {
      id: "fallback-2",
      imageUrl: "https://picsum.photos/seed/shoes2/1920/1080",
      title: "Luxury Defined",
      description: "Sourcing premium handcrafted silhouettes for boutiques.",
    }
  ];

  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* Registry Label */}
      <div className="container mx-auto px-4 pt-4 md:pt-10 pb-3 md:pb-6">
        <div className="flex items-center gap-3">
          <div className="h-px w-5 md:w-8 bg-secondary" />
          <span className="text-secondary font-black uppercase tracking-widest text-[8px] md:text-[10px]">Exclusive B2B Gateway</span>
        </div>
      </div>

      <Carousel 
        className="w-full h-[35vh] md:h-[70vh]"
        plugins={[plugin.current]}
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent className="-ml-0 h-full">
          {displaySlides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0 h-[35vh] md:h-[70vh] relative">
              <div className="relative w-full h-full">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority
                  data-ai-hint="luxury shoes"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/20 to-transparent" />
                
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-2xl space-y-1 md:space-y-6 animate-in fade-in slide-in-from-left-4 duration-1000">
                      <h2 className="text-xl md:text-8xl font-serif italic text-white leading-tight">
                        {slide.title}
                      </h2>
                      <p className="text-white/80 text-[8px] md:text-2xl font-medium leading-relaxed max-w-[200px] md:max-w-lg">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
