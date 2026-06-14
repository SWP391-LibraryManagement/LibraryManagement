export class Fail {
  constructor(httpStatusCode, code, message) {
    this.httpStatusCode = httpStatusCode;
    this.code = code;
    this.message = message;
  }

  // AUTH
  static WRONG_ACCOUNT = new Fail(404, 401, "Username or password is not correct");
  static EXPIRE_TOKEN = new Fail(401, 402, "AccessToken is not valid");
  static INVALID_REFRESH_TOKEN = new Fail(401, 402, "RefreshToken is not valid");

  // USER
  static FAIL_BAN = new Fail(400, 455, "Failed ban");
  static FAIL_UNBAN = new Fail(400, 456, "Failed unban");
  static FAIL_PUT_USER = new Fail(400, 457, "Failed load users");

}