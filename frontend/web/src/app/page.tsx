// 임시 홈. 2부(공개 사이트)에서 랜딩 페이지로 교체한다.
export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B1F4D] px-6 text-center text-white">
      <p className="text-sm font-bold tracking-[0.16em] text-[#F6C343]">SEOUL MARATHON 2027 · MARCH 21</p>
      <h1 className="text-4xl font-extrabold sm:text-6xl">Run Seoul with Artjoy.</h1>
      <p className="max-w-md text-white/80">Our new tour site is on its way. Applications open soon.</p>
    </main>
  );
}
