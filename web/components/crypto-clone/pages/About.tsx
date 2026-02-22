export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-24 pb-32">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">About ENV Crypto</h1>
      <div className="prose prose-invert prose-slate max-w-none">
        <p className="text-lg text-slate-400 leading-relaxed mb-6">
          ENV Crypto Edition was founded on the principle that active traders deserve institutional-grade tools
          without the complexity of legacy platforms. We provide tighter execution, deeper liquidity, and a 
          focused crypto-first dashboard.
        </p>
        <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
        <p className="text-slate-400 leading-relaxed mb-6">
          To democratize access to high-frequency trading infrastructure, enabling retail and institutional 
          investors alike to trade momentum with confidence and precision.
        </p>
        <h2 className="text-2xl font-bold mt-12 mb-4">Technology</h2>
        <p className="text-slate-400 leading-relaxed">
          Our proprietary order routing engine achieves sub-90ms latency, connecting you to the deepest 
          liquidity pools across the globe 24/7.
        </p>
      </div>
    </div>
  );
}
