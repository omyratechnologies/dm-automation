"use client";
import PaymentCard from "./payment-card";
import { useQueryUser } from "@/hooks/user-queries";

type Props = {};

function Billing({}: Props) {
  const { data } = useQueryUser();
  return (
    <div className="dlex lg:flex-row flex flex-col gap-5 w-full lg:w-10/12 xl:w-8/12 container">
      <PaymentCard label="PRO" current={data?.subscription?.plan ?? "FREE"} />
      <PaymentCard label="FREE" current={data?.subscription?.plan ?? "FREE"} />
    </div>
  );
}

export default Billing;
