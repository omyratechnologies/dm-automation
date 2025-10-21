import { PAGE_ICON } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
  slug?: string;
};

const MainBreadCrumb = ({ page, slug }: Props) => {
  return (
    <div className="flex flex-col items-start">
      {/* {page === "Home" && (
        <div className="flex justify-center w-full mb-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-primary/10 via-purple-500/5 to-pink-500/5 border border-slate-primary/20 rounded-2xl w-full lg:w-6/12 py-8 lg:py-12 flex flex-col items-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl" />
            <p className="text-slate-text-secondary text-base mb-2 relative z-10">Welcome back</p>
            <h2 className="capitalize text-5xl font-bold bg-gradient-to-r from-slate-primary via-purple-400 to-pink-400 bg-clip-text text-transparent relative z-10">{slug}!</h2>
          </div>
        </div>
      )} */}
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
