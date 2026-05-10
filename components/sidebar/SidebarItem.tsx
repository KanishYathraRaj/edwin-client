import Link from "next/link";
import { ReactNode } from "react";

interface SidebarItemProps {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
}

export default function SidebarItem({ href, label, active, icon }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`mx-2 px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 group relative ${
        active
          ? "bg-blue-50 text-blue-600 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
      )}
      {icon && (
        <span className={`transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
          {icon}
        </span>
      )}
      <span className="text-sm truncate">{label}</span>
    </Link>
  );
}
