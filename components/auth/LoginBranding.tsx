export function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, #002868 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
        <div className="max-w-lg text-center">
          <img src="/HEROICA.svg" alt="Heroica" className="h-20 mb-6 mx-auto" />
          <div className="h-[1px] w-32 bg-gradient-to-r from-[#002868]/20 via-[#002868]/50 to-[#002868]/20 mb-10 mx-auto" />
          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.3em] font-semibold text-[#002868]/70">
              Sistema administrativo
            </h2>
            <p className="text-3xl font-light leading-tight max-w-sm mx-auto text-[#002868] border-l-2 border-[#002868]/20 pl-6 italic">
              "Claridad en las cuentas, <br />
              <span className="opacity-60">integridad en los resultados."</span>
            </p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#002868]/5 to-transparent" />
    </div>
  );
}
