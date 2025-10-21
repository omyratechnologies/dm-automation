"use client";

import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { useRef } from "react";

type Props = {
  children: React.ReactNode;
};

function ReduxProvider({ children }: Props) {
  // Use ref to ensure store stability across re-renders
  const storeRef = useRef(store);
  
  return <Provider store={storeRef.current}>{children}</Provider>;
}

export default ReduxProvider;
