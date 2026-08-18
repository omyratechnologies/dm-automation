import React from "react";
import FlowBuilder from "./_components/flow-builder";

type Props = {
  params: Promise<{ id: string }>;
};

const FlowBuilderPage = async ({ params }: Props) => {
  const { id } = await params;
  return <FlowBuilder flowId={id} />;
};

export default FlowBuilderPage;
