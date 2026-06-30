import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../lib/auth";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    isAuthenticated().then((result) => {
      setAuthed(result);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return <Redirect href={authed ? "/(tabs)" : "/(auth)/login"} />;
}
