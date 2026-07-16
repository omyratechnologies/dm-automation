import { PAGE_ICON } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
};

const MainBreadCrumb = ({ page }: Props) => {
  return (
    <div className="flex items-center gap-x-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {PAGE_ICON[page.toUpperCase()]}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground capitalize">
        {page}
      </h1>
    </div>
  );
};

export default MainBreadCrumb;
