import { CredentialsSignin } from "next-auth";

/** Auth.js propaga este error al server action (redirect: false) con `code` legible */
export class ActiveSessionSignin extends CredentialsSignin {
  code = "active_session";
}
