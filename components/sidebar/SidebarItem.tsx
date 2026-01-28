import Link from "next/link";

interface SidebarItemProps {
  href: string;
  label: string;
  active?: boolean;
}

export default function SidebarItem({ href, label, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded hover:bg-gray-100 block ${
        active ? "bg-blue-100 font-semibold" : ""
      }`}
    >
      {label}
    </Link>
  );
}
