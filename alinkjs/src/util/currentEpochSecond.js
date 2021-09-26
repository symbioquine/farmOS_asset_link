export default function currentEpochSecond() {
  return parseInt(new Date().getTime() / 1000);
}
