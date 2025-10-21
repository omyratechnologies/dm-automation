import { SignUp } from "@clerk/nextjs";
type Props = {};

function page({}: Props) {
  return <SignUp afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard" />;
}

export default page;
