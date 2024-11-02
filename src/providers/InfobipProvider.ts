import { SMSProviderInterface } from "../interfaces/SMSProviderInterface";
import axios from "axios";

export class InfobipProvider implements SMSProviderInterface {
  async sendSMS(to: string, content: string): Promise<void> {
    await axios.post("https://api.infobip.com/sms/1/text/single", {
      from: "WAVE",
      to,
      text: content,
    }, {
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
      },
    });
    console.log(`Message envoyé via Infobip à ${to}`);
  }
}
