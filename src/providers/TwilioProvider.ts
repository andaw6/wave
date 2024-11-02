import twilio from "twilio";
import { SMSProviderInterface } from "../interfaces/SMSProviderInterface";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export class TwilioProvider implements SMSProviderInterface {
  async sendSMS(to: string, content: string): Promise<void> {
    await client.messages.create({
      body: content,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`Message envoyé via Twilio à ${to}`);
  }
}
