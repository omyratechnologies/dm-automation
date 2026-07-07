import { SignIn } from "@clerk/nextjs";

type Props = {};

const Page = (page: Props) => {
  return <SignIn fallbackRedirectUrl="/dashboard" />;
};

export default Page;
