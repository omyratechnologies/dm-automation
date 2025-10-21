import { SignIn } from "@clerk/nextjs";

type Props = {};

const Page = (page: Props) => {
  return <SignIn afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard" />;
};

export default Page;
