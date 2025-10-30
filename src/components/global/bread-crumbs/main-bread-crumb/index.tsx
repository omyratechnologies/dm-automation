import { PAGE_ICON } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
};

const MainBreadCrumb = ({ page }: Props) => {
  return (
    <div className="flex flex-col items-start">
      <span className="inline-flex py-3 gap-x-3 items-center group">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-110 transition-transform duration-200">
          {PAGE_ICON[page.toUpperCase()]}
        </div>
        <h2 className="font-bold text-3xl capitalize text-foreground">{page}</h2>
      </span>
    </div>
  );
};

export default MainBreadCrumb;
