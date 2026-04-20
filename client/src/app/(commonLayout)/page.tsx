import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to PH Healthcare</h1>
      Go to <Link href={"/login"}>Login</Link>
    </div>
  );
}
