import { SignUp } from "@clerk/nextjs";
type Props = {};

function page({}: Props) {
  return <SignUp fallbackRedirectUrl="/dashboard" />;
}

export default page;
