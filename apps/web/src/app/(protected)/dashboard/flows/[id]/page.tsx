import React from "react";
import FlowBuilder from "./_components/flow-builder";

type Props = {
  params: { id: string };
};

const FlowBuilderPage = ({ params }: Props) => {
  return <FlowBuilder flowId={params.id} />;
};

export default FlowBuilderPage;
