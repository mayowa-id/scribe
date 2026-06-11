export class ResponseUtil {
  static success(data: any, message = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }
}
