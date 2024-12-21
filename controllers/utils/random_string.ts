
export const random_string = () => {
  return "RCP-" + Math.random().toString(36).substring(2,15);
}
