export function createLatestRequestGuard() {
  let latestToken = 0;

  return {
    begin() {
      latestToken += 1;
      return latestToken;
    },
    isLatest(token) {
      return token === latestToken;
    },
  };
}
