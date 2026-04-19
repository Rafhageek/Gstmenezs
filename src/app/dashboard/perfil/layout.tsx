import { PerfilTabs } from "./tabs";

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PerfilTabs />
      {children}
    </div>
  );
}
