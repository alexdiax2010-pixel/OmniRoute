/** Ícono de WhatsApp (decorativo: el texto accesible va en el enlace). */
export function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.3c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.4 0 .6.5.9 1.3 1.7 2.2 2.2.2.1.4.1.6 0l.7-.6c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.3.4.5 0 .5-.2 1.4-.9 1.8-.7.4-1.6.5-3.2-.2-1.6-.7-3.2-2.2-4-3.6-.8-1.4-.9-2.7-.6-3.7z"
        fill="currentColor"
      />
    </svg>
  );
}
