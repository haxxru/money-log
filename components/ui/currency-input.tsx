"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  name: string;
  defaultValue?: number;
  required?: boolean;
  placeholder?: string;
  min?: number;
  className?: string;
};

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default function CurrencyInput({
  id,
  name,
  defaultValue = 0,
  required,
  placeholder,
  min = 0,
  className,
}: Props) {
  const initial = useMemo(() => String(Math.max(0, Math.floor(defaultValue))), [defaultValue]);
  const [raw, setRaw] = useState(initial);

  const display = raw ? Number(raw).toLocaleString("ko-KR") : "";

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => setRaw(onlyDigits(e.target.value))}
        required={required}
        placeholder={placeholder}
        className={className}
        min={min}
      />
    </>
  );
}
