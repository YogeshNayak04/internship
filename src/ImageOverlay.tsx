import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';

interface Props {
  onSubmit: (lineCount: number) => void;
}

const InputOverlay: React.FC<Props> = ({ onSubmit }) => {
  const op = useRef<OverlayPanel | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = () => {
    const inputValue = inputRef.current?.value || "";
    const count = parseInt(inputValue);
    if (!isNaN(count) && count > 0) {
      onSubmit(count);
    }
    op.current?.hide();
  };

  return (
    <div className="card flex justify-content-center">
      <Button
        type="button"
        icon="pi pi-chevron-down"
        onClick={(e) => op.current?.toggle(e)}
      />
      <OverlayPanel ref={op}>
        <div className="flex flex-column gap-2 p-3 w-20rem">
          <InputText
            ref={inputRef}
            placeholder="Enter number of rows to select"
            className="w-full"
          />
          <Button label="Submit" icon="pi pi-check" onClick={handleSubmit} />
        </div>
      </OverlayPanel>
    </div>
  );
};

export default InputOverlay;
