import { redirect } from "next/navigation";

export default function AdminRedirect() {
  redirect("http://localhost:1337/admin");
}