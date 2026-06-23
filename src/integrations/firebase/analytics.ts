import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { firebaseApp } from "./config";

let analytics: Analytics | undefined;

export async function initAnalytics(): Promise<Analytics | undefined> {
  if (typeof window === "undefined" || analytics) return analytics;
  if (await isSupported()) {
    analytics = getAnalytics(firebaseApp);
  }
  return analytics;
}
