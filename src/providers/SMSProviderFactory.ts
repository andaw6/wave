import { TwilioProvider } from "./TwilioProvider";
import { InfobipProvider } from "./InfobipProvider";
import { SMSProviderInterface } from "../interfaces/SMSProviderInterface";

export const createSMSProvider = (): SMSProviderInterface => {
  if (process.env.SMS_PROVIDER === "twilio") {
    return new TwilioProvider();
  } else if (process.env.SMS_PROVIDER === "infobip") {
    return new InfobipProvider();
  } else {
    throw new Error("Aucun fournisseur SMS valide n'a été configuré.");
  }
};
