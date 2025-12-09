export default function handler(req, res) {
  const baseURL = process.env.NETCHECK_BASE_URL || "https://www.19980926.xyz";
  res.status(200).json({ baseURL });
}
