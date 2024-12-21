import path from "path";

require("dotenv").config({ path: path.resolve(__dirname + "/../../.env") });


export const dynamic_template_data = (data: any) => {
  const mail_data = {
    from: {
      email:  process.env.MAIN_INFO_EMAIL,
    },
    personalizations: [
      {
        to: {
          email: data.email,
        },
        dynamic_template_data: data.data
      }
    ],
    template_id: data.template_id
  }

  return mail_data;
}