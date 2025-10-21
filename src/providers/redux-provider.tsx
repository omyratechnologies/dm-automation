"use client";

import { Provider } from "react-redux";
import { store } from "../../redux/store";

type Props = {
  children: React.ReactNode;
};

function ReduxProvider({ children }: Props) {
  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
