import React from "react";
import PopOver from "../../popover";
import { BlueAddIcon } from "@/icons";

type Props = {
  label: string;
  children: React.ReactNode;
};

function TriggerButton({ children, label }: Props) {
  return (
    <PopOver
      className="w-[400px]"
      trigger={
        <div className="border-2 border-dashed w-full border-primary hover:opacity-80 cursor-pointer transition duration-100 rounded-xl flex gap-x-2 justify-center items-center p-5">
          <BlueAddIcon />
          <p className="text-primary font-bold">{label}</p>
        </div>
      }
    >
      {children}
    </PopOver>
  );
}

export default TriggerButton;
