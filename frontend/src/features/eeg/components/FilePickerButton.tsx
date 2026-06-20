import { useRef, type ReactNode } from 'react';

interface FilePickerButtonProps {
  accept: string;
  onPick: (file: File) => void;
  primary?: boolean;
  title?: string;
  children: ReactNode;
}

/** A button that opens a native file dialog and reports the chosen file. */
export function FilePickerButton({ accept, onPick, primary, title, children }: FilePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className={primary ? 'btn btn--primary' : 'btn'}
        title={title}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = ''; // allow re-picking the same file
        }}
      />
    </>
  );
}
