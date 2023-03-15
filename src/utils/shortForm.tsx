export const shortForm = (id: string) => {
  if (!id) return "";
  if (id.length < 6) return id;
  const first5 = id.slice(0, 4);
  const last5 = id.slice(-3);
  return `${first5}...${last5}`;
};
