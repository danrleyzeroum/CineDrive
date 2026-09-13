import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Clapperboard,
  Layers,
  Star,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Globe2,
} from 'lucide-react';
import { MediaItem } from '../types';

export type CategoryFilterType = 'all' | '2026' | 'cinema' | 'genre';

interface CategoryHeroYouCineProps {
  categoryType: 'movies' | 'series' | 'kids' | 'anime';
  categoryTitle: string;
  items: MediaItem[];
  activeFilter: CategoryFilterType;
  onSelectFilter: (filter: CategoryFilterType) => void;
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onOpenCoverEditor: (item: MediaItem) => void;
  onOpenFixMatch?: (item: MediaItem) => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
}

/**
 * Deterministic pseudo-random generator based on a seed number.
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculates a unique seed number for the current week starting every Monday.
 * Updates automatically every Monday at 00:00:00!
 */
function getMondayWeekSeed(): number {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = (day + 6) % 7; // days since last Monday
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - diffToMonday);
  lastMonday.setHours(0, 0, 0, 0);
  return Math.floor(lastMonday.getTime() / (7 * 24 * 60 * 60 * 1000));
}

export default function CategoryHeroYouCine({
  categoryType,
  categoryTitle,
  items,
  activeFilter,
  onSelectFilter,
  selectedGenre,
  onSelectGenre,
  onPlay,
  onOpenDetails,
  onOpenCoverEditor,
  onOpenFixMatch,
  favorites,
  onToggleFavorite,
}: CategoryHeroYouCineProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. CAROUSEL ITEMS: LANÇAMENTOS DE 2026 (ATUALIZANDO TODA SEGUNDA-FEIRA, ~10 CONTEÚDOS DA BIBLIOTECA)
  const carouselItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    // Prioridade 1: Lançamentos de 2026 da biblioteca
    const items2026 = items.filter((item) => item.year === '2026');

    // Se tiver menos que 10 títulos de 2026, complementa com os mais recentes da biblioteca (2025, 2024...)
    let candidates = [...items2026];
    if (candidates.length < 10) {
      const recentOtherYears = items
        .filter((item) => item.year !== '2026')
        .sort((a, b) => {
          const ya = parseInt(a.year || '0', 10);
          const yb = parseInt(b.year || '0', 10);
          return yb - ya;
        });

      for (const item of recentOtherYears) {
        if (!candidates.some((c) => c.id === item.id)) {
          candidates.push(item);
        }
        if (candidates.length >= 15) break;
      }
    }

    if (candidates.length <= 10) {
      return candidates;
    }

    // Shuffle determinístico com base na semana (muda toda segunda-feira!)
    const weekSeed = getMondayWeekSeed();
    const shuffled = [...candidates].sort((a, b) => {
      // Use string char codes + weekSeed
      const seedA = weekSeed + a.title.charCodeAt(0) + (a.title.charCodeAt(1) || 0);
      const seedB = weekSeed + b.title.charCodeAt(0) + (b.title.charCodeAt(1) || 0);
      return seededRandom(seedA) - seededRandom(seedB);
    });

    return shuffled.slice(0, 10);
  }, [items]);

  // 2. DOIS BANNERS VERTICAIS: 2 CONTEÚDOS ALEATÓRIOS MAIS ASSISTIDOS NO MUNDO DA BIBLIOTECA
  const verticalBannerItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    // Ordena por sucesso mundial: rating alto (>= 7.0) ou maiores ratings do TMDb / popularidade
    const topHits = [...items].sort((a, b) => {
      const ratingA = parseFloat(a.rating || '0') || 0;
      const ratingB = parseFloat(b.rating || '0') || 0;
      return ratingB - ratingA;
    });

    // Pega o grupo dos top 10 a 15 mais assistidos/avaliados
    const topPool = topHits.slice(0, Math.min(15, topHits.length));

    // Para variar semanalmente de forma estável entre os mais assistidos:
    const weekSeed = getMondayWeekSeed();
    const shuffledPool = [...topPool].sort((a, b) => {
      const seedA = weekSeed * 3 + a.id.charCodeAt(0);
      const seedB = weekSeed * 3 + b.id.charCodeAt(0);
      return seededRandom(seedA) - seededRandom(seedB);
    });

    // Pega os 2 primeiros do pool
    const first = shuffledPool[0] || items[0];
    const second = shuffledPool[1] || items[1] || items[0];

    return [first, second];
  }, [items]);

  // Ciclo automático do carrossel a cada 6.5 segundos
  useEffect(() => {
    if (carouselItems.length <= 1 || isCarouselHovered) return;

    autoPlayTimerRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [carouselItems.length, isCarouselHovered]);

  const activeCarouselItem = carouselItems.length > 0 ? carouselItems[carouselIndex % carouselItems.length] : null;

  // Lista de todos os gêneros únicos disponíveis na categoria atual
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    items.forEach((item) => {
      item.genre?.forEach((g) => {
        if (g && g.trim()) genreSet.add(g.trim());
      });
    });
    return Array.from(genreSet).sort();
  }, [items]);

  const handlePrevCarousel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselItems.length - 1));
  };

  const handleNextCarousel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 mb-8">
      {/* ========================================================================= */}
      {/* GRID PRINCIPAL YOUCINE: LADO ESQUERDO (CARROSSEL + BOTÕES) | LADO DIREITO (2 VERTICAIS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4.5 xl:gap-5 items-stretch">
        {/* ----------------------------------------------------------------------- */}
        {/* COLUNA ESQUERDA (7 colunas no desktop / TV) */}
        {/* Banner Carrossel Horizontal + Fileira de 4 Botões Navegáveis Abaixo */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5 sm:gap-4.5">
          {/* BANNER CARROSSEL HORIZONTAL (Lançamentos de 2026) */}
          <div
            id="youcine-category-carousel"
            tabIndex={0}
            role="button"
            aria-label={activeCarouselItem ? `Destaque: ${activeCarouselItem.title}` : 'Carrossel de Lançamentos'}
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            onFocus={() => setIsCarouselHovered(true)}
            onBlur={() => setIsCarouselHovered(false)}
            onClick={() => activeCarouselItem && onOpenDetails(activeCarouselItem)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (activeCarouselItem) onOpenDetails(activeCarouselItem);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselItems.length - 1));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
              }
            }}
            className="relative group w-full h-[230px] sm:h-[280px] md:h-[320px] lg:h-[310px] xl:h-[340px] rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl cursor-pointer border border-neutral-800/80 hover:border-amber-400/80 focus-visible:border-amber-400 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none transition-all select-none"
          >
            {activeCarouselItem ? (
              <>
                {/* Imagem de Fundo (Backdrop ou Poster horizontal) */}
                {activeCarouselItem.backdropUrl || activeCarouselItem.posterUrl ? (
                  <img
                    src={activeCarouselItem.backdropUrl || activeCarouselItem.posterUrl}
                    alt={activeCarouselItem.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 flex items-center justify-center">
                    <Clapperboard className="w-16 h-16 text-neutral-700" />
                  </div>
                )}

                {/* Gradientes e Vinhetas de Cinema */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />

                {/* Badge Superior: Lançamentos 2026 (Atualizado Semanalmente) */}
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-950/60">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Lançamentos {activeCarouselItem.year || '2026'}
                  </span>
                  <span className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-neutral-300 border border-neutral-700/60 backdrop-blur-md">
                    Atualização Semanal
                  </span>
                </div>

                {/* Botão Rápido Favorito no Topo Direito */}
                <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(activeCarouselItem.id);
                    }}
                    className="p-2 rounded-xl bg-black/70 hover:bg-neutral-800 text-neutral-300 hover:text-rose-500 border border-neutral-700/60 backdrop-blur-md transition-all active:scale-90"
                    title={favorites.includes(activeCarouselItem.id) ? 'Remover favorito' : 'Favoritar'}
                  >
                    {favorites.includes(activeCarouselItem.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Informações na Base do Banner Carrossel */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-10 flex items-end justify-between gap-4">
                  {/* Título e Metadados à Esquerda */}
                  <div className="max-w-[75%] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                      {activeCarouselItem.year && (
                        <span className="px-1.5 py-0.5 rounded bg-black/60 border border-neutral-700/60 text-amber-400 font-bold text-[11px]">
                          {activeCarouselItem.year}
                        </span>
                      )}
                      {activeCarouselItem.rating && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {activeCarouselItem.rating}
                        </span>
                      )}
                      {activeCarouselItem.genre && activeCarouselItem.genre.length > 0 && (
                        <span className="hidden sm:inline text-neutral-400 text-xs">
                          • {activeCarouselItem.genre.slice(0, 2).join(' / ')}
                        </span>
                      )}
                    </div>

                    {/* TÍTULO GRANDE ESTILO YOUCINE (Ex: "O PÁRAMO") */}
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-xl line-clamp-1">
                      {activeCarouselItem.title}
                    </h2>

                    {activeCarouselItem.overview && (
                      <p className="text-xs text-neutral-300 line-clamp-2 max-w-lg font-normal drop-shadow leading-relaxed hidden sm:block">
                        {activeCarouselItem.overview}
                      </p>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(activeCarouselItem);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs shadow-lg transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Assistir
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(activeCarouselItem);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-700/80 backdrop-blur-md transition-all active:scale-95"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                    </div>
                  </div>

                  {/* INDICADORES DO CARROSSEL NO CANTO INFERIOR DIREITO (Igual ao print: • • ━) */}
                  {carouselItems.length > 1 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-neutral-800/80 backdrop-blur-md shrink-0">
                      {carouselItems.map((_, idx) => {
                        const isActive = idx === carouselIndex % carouselItems.length;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCarouselIndex(idx);
                            }}
                            className={`transition-all rounded-full ${
                              isActive
                                ? 'w-5 h-2 bg-amber-400 shadow-sm shadow-amber-400/50'
                                : 'w-2 h-2 bg-neutral-600 hover:bg-neutral-400'
                            }`}
                            title={`Slide ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Setas discretas para navegação */}
                {carouselItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevCarousel}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCarousel}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                      title="Próximo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <Clapperboard className="w-12 h-12 mb-2 text-neutral-600" />
                <span className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Nenhum título em destaque no momento
                </span>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* FILEIRA DE 4 BOTÕES NAVEGÁVEIS COLORIDOS (IDÊNTICOS AO PRINT DO YOUCINE) */}
          {/* 1. Rosa: Gênero | 2. Azul: 2026 | 3. Verde: No Cinema | 4. Amarelo: Todos */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* BOTÃO 1: GÊNERO (ROSA / CORAL) */}
            <button
              id="youcine-btn-genre"
              type="button"
              tabIndex={0}
              onClick={() => onSelectFilter(activeFilter === 'genre' ? 'all' : 'genre')}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl transition-all duration-200 select-none outline-none group ${
                activeFilter === 'genre'
                  ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 text-white ring-4 ring-white shadow-xl shadow-rose-950/80 scale-105 z-10'
                  : 'bg-gradient-to-tr from-rose-700 via-pink-600 to-rose-500 text-white/95 hover:scale-105 active:scale-95 hover:shadow-lg focus-visible:scale-105 focus-visible:ring-4 focus-visible:ring-white'
              }`}
            >
              {/* Ícone Estilo YouCine (Filtro estilizado) */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/20 flex items-center justify-center">
                <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.5]" />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase drop-shadow">
                Gênero
              </span>
            </button>

            {/* BOTÃO 2: 2026 (AZUL CIANO / SKY COM LOGO "NEW") */}
            <button
              id="youcine-btn-2026"
              type="button"
              tabIndex={0}
              onClick={() => onSelectFilter(activeFilter === '2026' ? 'all' : '2026')}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl transition-all duration-200 select-none outline-none group ${
                activeFilter === '2026'
                  ? 'bg-gradient-to-tr from-sky-600 via-cyan-600 to-blue-500 text-white ring-4 ring-white shadow-xl shadow-sky-950/80 scale-105 z-10'
                  : 'bg-gradient-to-tr from-sky-700 via-cyan-600 to-blue-500 text-white/95 hover:scale-105 active:scale-95 hover:shadow-lg focus-visible:scale-105 focus-visible:ring-4 focus-visible:ring-white'
              }`}
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/20 flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                <span className="absolute -top-1 -right-1 px-1 rounded bg-amber-400 text-[8px] font-black text-black leading-tight uppercase">
                  NEW
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase drop-shadow">
                2026
              </span>
            </button>

            {/* BOTÃO 3: NO CINEMA (VERDE LIMÃO VIBRANTE) */}
            <button
              id="youcine-btn-cinema"
              type="button"
              tabIndex={0}
              onClick={() => onSelectFilter(activeFilter === 'cinema' ? 'all' : 'cinema')}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl transition-all duration-200 select-none outline-none group ${
                activeFilter === 'cinema'
                  ? 'bg-gradient-to-tr from-emerald-600 via-green-600 to-lime-500 text-white ring-4 ring-white shadow-xl shadow-emerald-950/80 scale-105 z-10'
                  : 'bg-gradient-to-tr from-emerald-700 via-green-600 to-lime-500 text-white/95 hover:scale-105 active:scale-95 hover:shadow-lg focus-visible:scale-105 focus-visible:ring-4 focus-visible:ring-white'
              }`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/20 flex items-center justify-center">
                <Clapperboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase drop-shadow whitespace-nowrap">
                No Cinema
              </span>
            </button>

            {/* BOTÃO 4: TODOS (AMARELO OURO VIBRANTE) */}
            <button
              id="youcine-btn-all"
              type="button"
              tabIndex={0}
              onClick={() => onSelectFilter('all')}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl transition-all duration-200 select-none outline-none group ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-neutral-950 ring-4 ring-white shadow-xl shadow-amber-950/80 scale-105 z-10'
                  : 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 text-neutral-950 hover:scale-105 active:scale-95 hover:shadow-lg focus-visible:scale-105 focus-visible:ring-4 focus-visible:ring-white'
              }`}
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/20 flex items-center justify-center">
                <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-950" />
                <span className="absolute -top-1 -right-1 px-1 rounded bg-black text-[8px] font-black text-amber-300 leading-tight uppercase">
                  ALL
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase drop-shadow">
                Todos
              </span>
            </button>
          </div>

          {/* Seletor de Gêneros Acionado pelo botão "Gênero" */}
          {activeFilter === 'genre' && availableGenres.length > 0 && (
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Filtrar por Gênero:
                </span>
                {selectedGenre && (
                  <button
                    type="button"
                    onClick={() => onSelectGenre(null)}
                    className="text-[11px] text-amber-400 hover:underline font-semibold"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenre?.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => onSelectGenre(isSelected ? null : genre)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white font-bold shadow-md scale-105'
                          : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUNA DIREITA (5 colunas no desktop / TV): */}
        {/* 2 BANNERS VERTICAIS DE LADO: 2 CONTEÚDOS ALEATÓRIOS MAIS ASSISTIDOS NO MUNDO DA BIBLIOTECA */}
        {/* (Exatamente como "AMERICAN SIEGE" e "THE MATRIX RESURRECTIONS" no print) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4.5 items-stretch">
          {verticalBannerItems.map((item, index) => {
            if (!item) return null;
            return (
              <div
                key={`${item.id}_${index}`}
                id={`youcine-vertical-banner-${index}`}
                tabIndex={0}
                role="button"
                aria-label={`Mais assistido no mundo: ${item.title}`}
                onClick={() => onOpenDetails(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDetails(item);
                  }
                }}
                className="relative group rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl cursor-pointer border border-neutral-800/80 hover:border-amber-400/80 focus-visible:border-amber-400 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none transition-all flex flex-col justify-end select-none h-full min-h-[300px] sm:min-h-[360px] lg:min-h-[380px]"
              >
                {/* Poster Vertical em Alta Resolução */}
                {item.posterUrl || item.backdropUrl ? (
                  <img
                    src={item.posterUrl || item.backdropUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 to-neutral-950 flex items-center justify-center p-4">
                    <span className="text-center font-bold text-xs text-neutral-400 uppercase">
                      {item.title}
                    </span>
                  </div>
                )}

                {/* Gradiente Escuro de Cinema no Rodapé */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />

                {/* Badge Topo: TOP MUNDO / MAIS ASSISTIDO */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-black/80 text-amber-400 border border-amber-500/40 backdrop-blur-md shadow-md">
                    <Globe2 className="w-3 h-3 text-amber-400" />
                    Top Mundo
                  </span>
                </div>

                {/* Avaliação no Topo Direito */}
                {item.rating && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/80 text-white border border-neutral-700 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                )}

                {/* Conteúdo na Base do Banner Vertical */}
                <div className="relative z-10 p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-semibold">
                    {item.year && <span>{item.year}</span>}
                    {item.quality && (
                      <span className="px-1 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                        {item.quality}
                      </span>
                    )}
                  </div>

                  {/* TÍTULO EM DISPLAY MAIÚSCULO (Como "AMERICAN SIEGE" e "THE MATRIX" no print) */}
                  <h3 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                    {item.title}
                  </h3>

                  {/* Botão de Assistir no Hover */}
                  <div className="pt-1 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(item);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white hover:bg-amber-400 hover:text-black text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Assistir
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(item);
                      }}
                      className="p-1.5 rounded-xl bg-black/70 hover:bg-neutral-800 text-white border border-neutral-700 transition-all active:scale-95"
                      title="Mais Informações"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
