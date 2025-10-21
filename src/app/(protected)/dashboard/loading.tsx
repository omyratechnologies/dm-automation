import Loader from "@/components/global/loader";
import React from "react";

type Props = {};

export default function loading(props: Props) {
  return (
    <div className="h-screen flex justify-center items-center">
      <Loader state>Loading...</Loader>
    </div>
  );
}
