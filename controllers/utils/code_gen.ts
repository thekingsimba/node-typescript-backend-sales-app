export const codeGenerator = () => {
  const code: string = "IP" + Math.floor(1000000 + Math.random() * 900000);
  return code.toString();
}

export const coupon_code = () => {
  let result = '';
  // Just something random to show an example. can be improved
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 15) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const transaction_code = () => {
  const code = Math.floor(10000000 + Math.random() * 900000);
  return code;
}

export const otp_code = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code;
}

export const log_client_code = () => {
  let result = 'trx-';
  // Just something random to show an example. can be improved with uuid
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 10) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}