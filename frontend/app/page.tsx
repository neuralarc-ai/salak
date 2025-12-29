import { redirect } from "next/navigation"

export default function Home() {
  // Check if we should redirect to db-init or login
  // For now, redirect to login (db-init can be accessed via /db-init)
  redirect("/login")
}

