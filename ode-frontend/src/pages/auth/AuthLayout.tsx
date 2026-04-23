interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-[#EBEFF2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#105778] tracking-tight">
            OneDayEvent
          </h1>
          <p className="text-[#797979] text-sm mt-1">Event Insurance Made Simple</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-[#262D45] mb-1">{title}</h2>
          <p className="text-[#797979] text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
