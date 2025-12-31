import GreetingBlock from "@/components/GreetingBlock";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div>
      <GreetingBlock />
      {title && <h1>{title}</h1>}
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}