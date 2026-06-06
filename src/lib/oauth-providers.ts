import { GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

export type OAuthProviderId = "google" | "github";

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function createGithubProvider() {
  const provider = new GithubAuthProvider();
  // GitHub often hides email unless these scopes are requested
  provider.addScope("user:email");
  provider.addScope("read:user");
  return provider;
}

export function createOAuthProvider(providerId: OAuthProviderId) {
  return providerId === "google" ? createGoogleProvider() : createGithubProvider();
}
